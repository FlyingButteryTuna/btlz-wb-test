import knex, { migrate, seed } from "#postgres/knex.js";
import { startServer } from "#server.js";

await migrate.latest();
await seed.run();

console.log("All migrations and seeds have been run");

startServer().catch((e) => {
    console.error("fatal bootstrap error:", e);
    process.exit(1);
});
