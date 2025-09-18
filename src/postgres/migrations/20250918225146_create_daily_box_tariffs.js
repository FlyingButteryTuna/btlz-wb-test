/** @param {import("knex").Knex} knex */
export async function up(knex) {
    await knex.schema.createTable("daily_box_tariffs", (t) => {
        t.date("date").notNullable();
        t.text("warehouse_name").notNullable();
        t.text("geo_name").notNullable();

        t.decimal("box_delivery_base", 12, 4);
        t.decimal("box_delivery_coef_expr", 12, 4);
        t.decimal("box_delivery_liter", 12, 4);

        t.decimal("box_delivery_marketplace_base", 12, 4);
        t.decimal("box_delivery_marketplace_coef_expr", 12, 4);
        t.decimal("box_delivery_marketplace_liter", 12, 4);

        t.decimal("box_storage_base", 12, 4);
        t.decimal("box_storage_coef_expr", 12, 4);
        t.decimal("box_storage_liter", 12, 4);

        t.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());

        t.primary(["date", "warehouse_name"]);
        t.index(["date"]);
    });
}

/** @param {import("knex").Knex} knex */
export async function down(knex) {
    await knex.schema.dropTable("daily_box_tariffs");
}
