import env from "#config/env/env.js";
import { google } from "googleapis";

const SHEET_TITLE = "stocks_coefs";

function auth() {
    const clientEmail = env.GOOGLE_CLIENT_EMAIL;
    const rawKey = env.GOOGLE_PRIVATE_KEY;
    if (!clientEmail || !rawKey) {
        throw new Error("Google credentials are not set (GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY)");
    }

    const privateKey = rawKey.includes("\\n") ? rawKey.replace("/\\n/g", "/n") : rawKey;

    return new google.auth.JWT(clientEmail, undefined, privateKey, ["https://www.googleapis.com/auth/spreadsheets"]);
}

export function sheetsClient() {
    return google.sheets({ version: "v4", auth: auth() });
}

async function ensureSheetExists(spreadsheetId: string) {
    const sheets = sheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const titles = (meta.data.sheets ?? []).map((s) => s.properties?.title);
    if (titles.includes(SHEET_TITLE)) return;

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{ addSheet: { properties: { title: SHEET_TITLE } } }],
        },
    });
}

export async function writeTariffs(spreadsheetId: string, values: any[]) {
    const sheets = sheetsClient();

    await ensureSheetExists(spreadsheetId);

    try {
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `${SHEET_TITLE}!A:Z`,
        });
    } catch {}

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_TITLE}!A1`,
        valueInputOption: "RAW",
        requestBody: { values },
    });
}
