import axios, { AxiosError } from "axios";
import { WbBoxTariffsResponse } from "#types/wb.js";
import { throttle } from "#utils/throttle.js";

const WB_URL = "https://common-api.wildberries.ru/api/v1/tariffs/box";
const MAX_ATTEMPTS = 3;
const REQ_TIMEOUT_MS = 15_000;

function getAuthHeader(): string {
    const v = process.env.WB_API_KEY?.trim();
    if (!v) {
        throw new Error("WB_API_KEY is not set");
    }

    return v;
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function backoffDelay(attempt: number, base = 400) {
    return base * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
}

function getRetryAfterMs(header?: string | number): number | undefined {
    if (!header) return undefined;
    const n = typeof header === "string" ? Number(header) : header;
    return Number.isFinite(n) ? Number(n) * 1000 : undefined;
}

const http = axios.create({
    timeout: REQ_TIMEOUT_MS,
    validateStatus: () => true,
});

export async function getWbBoxTariffs(dateIso: string): Promise<WbBoxTariffsResponse> {
    const url = `${WB_URL}?date=${encodeURIComponent(dateIso)}`;
    const headers = { Authorization: getAuthHeader() };

    let lastErr: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
            const res = await throttle(() => http.get<WbBoxTariffsResponse>(url, { headers }));

            if (res.status === 200) {
                const ok = res.data?.response?.data?.warehouseList;
                if (!ok) {
                    throw new Error("WB response has unexpected shape");
                }
                return res.data;
            }

            if (res.status == 400) {
                throw new Error(`WB 400 Bad Request: ${JSON.stringify(res.data)}`);
            }

            if (res.status === 401) {
                throw new Error(`WB 401 Unauthorized: ${JSON.stringify(res.data)}`);
            }

            if (res.status === 429) {
                if (attempt < MAX_ATTEMPTS - 1) {
                    const retryAfter = getRetryAfterMs(res.headers?.["retry-after"]);
                    await sleep(retryAfter ?? backoffDelay(attempt));
                    continue;
                }
                throw new Error(`WB 429 Too Many Requests: ${JSON.stringify(res.data)}`);
            }

            throw new Error(`WB ${res.status}: ${JSON.stringify(res.data)}`);
        } catch (err) {
            lastErr = err;

            const ax = err as AxiosError;
            const isNetwork = ax.code === "ECONNABORTED" || ax.code === "ENOTFOUND" || ax.code === "ECONNRESET" || ax.code === "EAI_AGAIN" || !ax.response;

            if (isNetwork && attempt < MAX_ATTEMPTS - 1) {
                await sleep(backoffDelay(attempt));
                continue;
            }
            break;
        }
    }

    throw lastErr ?? new Error("WB request failed");
}
