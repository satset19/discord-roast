const modelService = require("./modelService");
const config = require("../config");
const { createRoastPrompt, createReplyMentionPrompt } = require("./prompt");

// Local logger function
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

class RoastService {
  constructor() {
    // Use deepseek as default model
    this.model = "deepseek";
    if (!config[this.model]) {
      throw new Error(`Model ${this.model} not configured in config.js`);
    }
    log(`RoastService initialized with model: ${this.model}`);
  }

  setModel(model) {
    if (!config[model]) throw new Error(`Model ${model} not configured`);
    this.model = model;
  }

  async generateRoast(userData, roaster, topic = null, botWasMentioned) {
    console.log("Generating roast with roaster:", roaster, "and topic:", topic);
    console.log("User data:", userData);
    try {
      if (botWasMentioned) {
        // If bot was mentioned, use the reply mention prompt
        const prompt = createReplyMentionPrompt(userData, roaster, topic);
        const responseText = await modelService.generateResponse(
          this.model,
          prompt
        );
        return {
          text: responseText,
          nickname: null,
        };
      }
      // Force using deepseek model
      const prompt = createRoastPrompt(userData, roaster, topic);
      const responseText = await modelService.generateResponse(
        this.model,
        prompt
      );
      // Check if response contains a nickname suggestion (format: "Nickname: xxx")
      const nicknameMatch = responseText.match(/Nickname:\s*(.+)/i);
      const roastText = responseText.replace(/Nickname:\s*.+/i, "").trim();

      // console.log("Roast response:", roastText);
      console.log(
        "Nickname suggestion:",
        nicknameMatch ? nicknameMatch[1] : null
      );

      return {
        text: roastText,
        nickname: nicknameMatch ? nicknameMatch[1] : null,
      };
    } catch (error) {
      console.error("Model API error:", error);
      return {
        text: "Maaf, aku sedang tidak bisa membuat roast. Coba lagi nanti ya! dari service",
        nickname: null,
      };
    }
  }
}

module.exports = new RoastService();
