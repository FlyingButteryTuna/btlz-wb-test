/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    const envIds = process.env.TEST_SPREADSHEET_IDS || "";
    const ids = envIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const rows = ids.map((id) => ({ spreadsheet_id: id }));
    await knex("spreadsheets").insert(rows).onConflict(["spreadsheet_id"]).ignore();
}
