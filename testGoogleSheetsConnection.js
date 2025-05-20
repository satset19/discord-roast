require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

(async () => {
  try {
    console.log("Initializing Google Sheets connection...");

    // Verify environment variables
    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !process.env.GOOGLE_PRIVATE_KEY ||
      !process.env.GOOGLE_SHEET_ID
    ) {
      throw new Error("Missing required Google Sheets credentials in .env");
    }

    // Initialize auth client
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Initialize spreadsheet
    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEET_ID,
      serviceAccountAuth
    );

    // Load document info
    await doc.loadInfo();
    console.log(`Success! Connected to spreadsheet: "${doc.title}"`);
    console.log(`Sheet count: ${doc.sheetsByIndex.length}`);
  } catch (err) {
    console.error("Google Sheets connection failed:");
    console.error("- Message:", err.message);
    console.error("- Stack:", err.stack.split("\n")[0]);

    if (err.errors) {
      console.error("- API Errors:", err.errors);
    }
  }
})();
