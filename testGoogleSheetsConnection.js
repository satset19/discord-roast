require("dotenv").config();
const googleSheetService = require("./src/services/googleSheetService");

(async () => {
  try {
    console.log("=== Testing Google Sheets Connection ===");

    // Test basic connection
    await googleSheetService.init();
    console.log("✅ Basic connection successful");

    // Test guild addition
    const testGuildId = "TEST_" + Date.now();
    const testGuildName = "Test Guild " + new Date().toISOString();

    console.log("\nTesting guild addition...");
    const added = await googleSheetService.addGuildIfNotExists(
      testGuildId,
      testGuildName
    );
    console.log(
      added ? "✅ Guild added successfully" : "❌ Failed to add guild"
    );

    if (added) {
      // Verify guild exists
      console.log("\nVerifying guild exists...");
      const exists = await googleSheetService.checkGuildExists(testGuildId);
      console.log(exists ? "✅ Guild found in sheet" : "❌ Guild not found");

      // Cleanup test data
      console.log("\nCleaning up test data...");
      const sheetName = process.env.GUILDS_SHEET || "Guilds";
      const sheet = googleSheetService.doc.sheetsByTitle[sheetName];
      const rows = await sheet.getRows();
      const testRow = rows.find((row) => row.get("guild_id") === testGuildId);

      if (testRow) {
        await testRow.delete();
        console.log("✅ Test guild removed");
      } else {
        console.log("ℹ️ No test guild to remove");
      }
    }

    console.log("\n=== All tests completed ===");
  } catch (err) {
    console.error("\n❌ Test failed:");
    console.error("- Message:", err.message);
    console.error("- Stack:", err.stack.split("\n")[0]);

    if (err.errors) {
      console.error("- API Errors:", err.errors);
    }
    process.exit(1);
  }
})();
