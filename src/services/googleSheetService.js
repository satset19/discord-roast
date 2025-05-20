const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
require("dotenv").config();

module.exports = {
  doc: null,

  async init() {
    try {
      if (!this.doc) {
        // Verify required environment variables
        if (
          !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
          !process.env.GOOGLE_PRIVATE_KEY ||
          !process.env.GOOGLE_SHEET_ID
        ) {
          throw new Error(
            "Missing Google Sheets credentials in environment variables"
          );
        }

        // Initialize auth client
        const serviceAccountAuth = new JWT({
          email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        // Initialize and load spreadsheet
        this.doc = new GoogleSpreadsheet(
          process.env.GOOGLE_SHEET_ID,
          serviceAccountAuth
        );
        await this.doc.loadInfo();
        console.log(`Connected to Google Sheet: "${this.doc.title}"`);
      }
      return this.doc;
    } catch (error) {
      console.error("Google Sheets initialization error:", error.message);
      throw error;
    }
  },

  async checkGuildExists(guildId) {
    if (!guildId) return false;

    try {
      await this.init();
      const sheetName = process.env.GUILDS_SHEET || "discord-roast-GUILD";
      let sheet = this.doc.sheetsByTitle[sheetName];

      if (!sheet) {
        // Create new guilds sheet with required headers
        sheet = await this.doc.addSheet({
          title: sheetName,
          headerValues: [
            "guild_id",
            "guild_name",
            "joined_at",
            "last_updated",
            "commands_deployed",
          ],
        });
        console.log(`Created new guild tracking sheet: ${sheetName}`);
      }

      const rows = await sheet.getRows();
      return rows.some((row) => row.get("guild_id") === guildId.toString());
    } catch (error) {
      console.error("Error checking guild existence:", error.message);
      return false;
    }
  },

  async checkCommandsDeployed(guildId) {
    if (!guildId) return false;
    try {
      await this.init();
      const sheetName = process.env.GUILDS_SHEET || "discord-roast-GUILD";
      const sheet = this.doc.sheetsByTitle[sheetName];
      if (!sheet) return false;

      const rows = await sheet.getRows();
      const guildRow = rows.find(
        (row) => row.get("guild_id") === guildId.toString()
      );
      return guildRow ? guildRow.get("commands_deployed") === "true" : false;
    } catch (error) {
      console.error("Error checking command deployment:", error.message);
      return false;
    }
  },

  async addGuildIfNotExists(guildId, guildName) {
    if (!guildId || !guildName) return false;

    try {
      // Double check guild doesn't exist
      const exists = await this.checkGuildExists(guildId);
      if (exists) {
        console.log(`Guild ${guildId} already exists - skipping add`);
        return false;
      }

      await this.init();
      let sheetName = process.env.GUILDS_SHEET || "Guilds";
      let sheet = this.doc.sheetsByTitle[sheetName];

      if (!sheet) {
        // Try default Sheet1 if no guilds sheet exists
        if (sheetName !== "Sheet1") {
          sheet = this.doc.sheetsByTitle["Sheet1"];
          if (sheet) {
            sheetName = "Sheet1";
          } else {
            // Create new guilds sheet
            sheet = await this.doc.addSheet({
              title: sheetName,
              headerValues: [
                "guild_id",
                "guild_name",
                "joined_at",
                "last_updated",
              ],
            });
            console.log(`Created new sheet: ${sheetName}`);
          }
        } else {
          console.error(`Sheet ${sheetName} not found`);
          return false;
        }
      }

      await sheet.addRow({
        guild_id: guildId.toString(),
        guild_name: guildName,
        joined_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error("Error adding guild:", error.message);
      return false;
    }
  },

  async updateCommandsDeployed(guildId, status) {
    try {
      await this.init();
      const sheetName = process.env.GUILDS_SHEET || "discord-roast-GUILD";
      const sheet = this.doc.sheetsByTitle[sheetName];
      if (!sheet) return false;

      const rows = await sheet.getRows();
      const guildRow = rows.find(
        (row) => row.get("guild_id") === guildId.toString()
      );

      if (guildRow) {
        guildRow.assign({
          commands_deployed: status ? "true" : "false",
          last_updated: new Date().toISOString(),
        });
        await guildRow.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating command deployment status:", error.message);
      return false;
    }
  },
};
