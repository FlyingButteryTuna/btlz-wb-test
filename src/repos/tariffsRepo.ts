import knex from "#postgres/knex.js";

const dec = (s?: string | null): number | null => {
    if (s == null) return null;
    const t = String(s).trim();
    if (t === "" || t === "-") return null;

    const n = Number(t.replace(",", "."));
    return Number.isFinite(n) ? n : null;
};

export type TariffRow = {
    date: string;
    warehouse_name: string;
    geo_name: string;
    box_delivery_base: number | null;
    box_delivery_coef_expr: number | null;
    box_delivery_liter: number | null;
    box_delivery_marketplace_base: number | null;
    box_delivery_marketplace_coef_expr: number | null;
    box_delivery_marketplace_liter: number | null;
    box_storage_base: number | null;
    box_storage_coef_expr: number | null;
    box_storage_liter: number | null;
};

export async function upsertDailyTariffs(dateIso: string, warehouses: any[]) {
    const rows: TariffRow[] = warehouses.map((w) => ({
        date: dateIso,
        warehouse_name: w.warehouseName,
        geo_name: w.geoName,
        box_delivery_base: dec(w.boxDeliveryBase),
        box_delivery_coef_expr: dec(w.boxDeliveryCoefExpr),
        box_delivery_liter: dec(w.boxDeliveryLiter),
        box_delivery_marketplace_base: dec(w.boxDeliveryMarketplaceBase),
        box_delivery_marketplace_coef_expr: dec(w.boxDeliveryMarketplaceCoefExpr),
        box_delivery_marketplace_liter: dec(w.boxDeliveryMarketplaceLiter),
        box_storage_base: dec(w.boxStorageBase),
        box_storage_coef_expr: dec(w.boxStorageCoefExpr),
        box_storage_liter: dec(w.boxStorageLiter),
    }));

    if (!rows.length) return 0;

    await knex("daily_box_tariffs")
        .insert(rows as any)
        .onConflict(["date", "warehouse_name"])
        .merge({
            geo_name: knex.raw("EXCLUDED.geo_name"),
            box_delivery_base: knex.raw("EXCLUDED.box_delivery_base"),
            box_delivery_coef_expr: knex.raw("EXCLUDED.box_delivery_coef_expr"),
            box_delivery_liter: knex.raw("EXCLUDED.box_delivery_liter"),
            box_delivery_marketplace_base: knex.raw("EXCLUDED.box_delivery_marketplace_base"),
            box_delivery_marketplace_coef_expr: knex.raw("EXCLUDED.box_delivery_marketplace_coef_expr"),
            box_delivery_marketplace_liter: knex.raw("EXCLUDED.box_delivery_marketplace_liter"),
            box_storage_base: knex.raw("EXCLUDED.box_storage_base"),
            box_storage_coef_expr: knex.raw("EXCLUDED.box_storage_coef_expr"),
            box_storage_liter: knex.raw("EXCLUDED.box_storage_liter"),
            updated_at: knex.fn.now(),
        });

    return rows.length;
}

export async function selectTariffsForDateSorted(dateIso: string) {
    return knex("daily_box_tariffs")
        .select("*", knex.raw("COALESCE(box_delivery_coef_expr, box_delivery_marketplace_coef_expr) as effective_coef"))
        .where({ date: dateIso })
        .orderBy("effective_coef", "asc");
}
