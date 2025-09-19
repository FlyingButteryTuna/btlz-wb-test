import cron from "node-cron";
import knex from "#postgres/knex.js";
import { selectTariffsForDateSorted } from "#repos/tariffsRepo.js";
import { writeTariffs } from "#services/googleSheets.js";
import { todayUTC } from "#utils/date.js";

export async function runSheetsUpdateOnce() {
    const spreadsheets = await knex("spreadsheets").select("spreadsheet_id");
    if (!spreadsheets.length) {
        console.log("[Sheets] no spreadsheets found");
        return;
    }
    const date = todayUTC();
    const rows = await selectTariffsForDateSorted(date);

    const table: any[][] = [
        [
            "date",
            "warehouse_name",
            "geo_name",
            "box_delivery_base",
            "box_delivery_coef_expr",
            "box_delivery_liter",
            "box_delivery_marketplace_base",
            "box_delivery_marketplace_coef_expr",
            "box_delivery_marketplace_liter",
            "box_storage_base",
            "box_storage_coef_expr",
            "box_storage_liter",
        ],
        ...rows.map((r: any) => [
            formatDate(r.date),
            r.warehouse_name,
            r.geo_name,
            show(r.box_delivery_base),
            show(r.box_delivery_coef_expr),
            show(r.box_delivery_liter),
            show(r.box_delivery_marketplace_base),
            show(r.box_delivery_marketplace_coef_expr),
            show(r.box_delivery_marketplace_liter),
            show(r.box_storage_base),
            show(r.box_storage_coef_expr),
            show(r.box_storage_liter),
        ]),
    ];

    for (const s of spreadsheets) {
        await writeTariffs(s.spreadsheet_id, table);
        console.log(`[Sheets] updated '${s.spreadsheet_id}' with ${rows.length} rows`);
    }
}

export function scheduleSheetsHourly() {
    cron.schedule("5 * * * *", () => {
        runSheetsUpdateOnce().catch((e) => console.error("updateSheets error:", e));
    });
}

function show(v: number | null): string {
    return v == null ? "-" : String(v);
}

function formatDate(d: string | Date | null): string {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
}
