require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

(async () => {
  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();

    const sheetName = process.env.GUILDS_SHEET || "Guilds";
    const sheet = doc.sheetsByTitle[sheetName];

    if (!sheet) {
      console.log(`Sheet "${sheetName}" not found`);
      return;
    }

    const rows = await sheet.getRows();
    console.log("Current guilds in sheet:");
    rows.forEach((row) => {
      console.log(`- ${row.get("guild_name")} (ID: ${row.get("guild_id")})`);
    });
  } catch (err) {
    console.error("Error:", err);
  }
})();
