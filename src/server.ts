import http from "http";
import env from "#config/env/env.js";
import { runFetchOnce, scheduleFetchHourly } from "#jobs/fetchTariffs.js";
import { runSheetsUpdateOnce, scheduleSheetsHourly } from "#jobs/updateSheets.js";

export async function startServer() {
    try {
        await runFetchOnce();
    } catch (e) {
        console.error("initial WB fetch failed:", e);
    }

    try {
        await runSheetsUpdateOnce();
    } catch (e) {
        console.error("initial Sheets update failed:", e);
    }

    scheduleFetchHourly();
    scheduleSheetsHourly();

    const server = http.createServer((_, res) => res.end("ok"));
    const port = Number(env.APP_PORT || 3000);
    server.listen(port, () => console.log(`App started on :${port}`));
}
