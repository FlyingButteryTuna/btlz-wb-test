import env from "#config/env/env.js";
/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    const envIds = env.TEST_SPREADSHEET_IDS || "";
    const ids = envIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    if (ids.length === 0) {
        throw new Error("TEST_SPREADSHEET_IDS must not be empty");
    }

    const rows = ids.map((id) => ({ spreadsheet_id: id }));

    return knex.transaction(async (trx) => {
        await trx("spreadsheets").insert(rows).onConflict(["spreadsheet_id"]).ignore();

        await trx("spreadsheets").whereNotIn("spreadsheet_id", ids).del();
    });
}
