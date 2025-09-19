import cron from "node-cron";
import env from "#config/env/env.js";
import { getWbBoxTariffs } from "#services/wbClient.js";
import { upsertDailyTariffs } from "#repos/tariffsRepo.js";
import { todayUTC } from "#utils/date.js";

const WB_KEY = env.WB_API_KEY;

export async function runFetchOnce() {
    if (!WB_KEY) throw new Error("WB_API_KEY is not set");
    const date = todayUTC();
    const data = await getWbBoxTariffs(date);
    const list = data?.response?.data?.warehouseList ?? [];
    const count = await upsertDailyTariffs(date, list);
    console.log(`[WB] ${date}: upserted ${count} rows`);
}

export function scheduleFetchHourly() {
    cron.schedule("0 * * * *", () => {
        runFetchOnce().catch((e) => console.error("fetchTariffs error:", e));
    });
}
