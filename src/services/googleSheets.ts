import { google } from "googleapis";

function auth() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!clientEmail || !rawKey) {
        throw new Error("Google credentials are not set (GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY)");
    }

    const privateKey = rawKey.includes("\\n") ? rawKey.replace("/\\n/g", "/n") : rawKey;

    return new google.auth.JWT(clientEmail, undefined, privateKey, ["https://www.googleapis.com/auth/spreadsheets"]);
}

export function sheetsClient() {
    return google.sheets({ version: "v4", auth: auth() });
}

export async function writeTraffis(spreadsheetId: string, values: any[]) {
    const sheets = sheetsClient();
    try {
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: "stocks_coefs!A:Z",
        });
    } catch {}

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "stocks_coefs!A1",
        valueInputOption: "RAW",
        requestBody: { values },
    });
}
