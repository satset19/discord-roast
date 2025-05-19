const axios = require("axios");
const config = require("../config");

class RoastService {
  constructor() {
    this.deepseekConfig = config.deepseek;
  }

  async generateRoast(userData, roaster, topic = null) {
    console.log("Generating roast with roaster:", roaster, "and topic:", topic);
    try {
      const prompt = this.createRoastPrompt(userData, roaster, topic);
      const response = await axios.post(
        this.deepseekConfig.endpoint,
        {
          model: this.deepseekConfig.model,
          messages: [{ role: "user", content: prompt }],
          temperature: this.deepseekConfig.temperature,
        },
        {
          headers: {
            Authorization: `Bearer ${this.deepseekConfig.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      const responseText = response.data.choices[0].message.content;
      // Check if response contains a nickname suggestion (format: "Nickname: xxx")
      const nicknameMatch = responseText.match(/Nickname:\s*(.+)/i);
      const roastText = responseText.replace(/Nickname:\s*.+/i, "").trim();

      // console.log("Roast response:", roastText);
      console.log(
        "Nickname suggestion:",
        nicknameMatch ? nicknameMatch[1] : null
      );

      return {
        text: `<@${userData.userId}> ${roastText}`,
        nickname: nicknameMatch ? nicknameMatch[1] : null,
      };
    } catch (error) {
      console.error("DeepSeek API error:", error);
      return {
        text: "Maaf, aku sedang tidak bisa membuat roast. Coba lagi nanti ya!",
        nickname: null,
      };
    }
  }

  createRoastPrompt(userData, roaster, topic) {
    return `
You are a toxic kampung-kota roast bot. Job: roast people hard, no advice, no hugs.
Style: Rough, casual, and sharp. No "Waduh", no "Gak apa-apa", no "Ngentod".

Rules:
- Bahasa 60% English
- 40% Jaksel-style
- keep it chill
- No comfort, no preaching
- Roast based on status, activity, roles, join date, useless vibes
- Can include jabs about government and country
- Insert edgy humor with nigga, sarcasm, racial and cultural jabs (jamet, cina, jawa, nigga)
- Don’t mention who requested
- No character limits, no special characters
- No emojis, no markdown
- No mentions or pings
- No "@everyone" or "@here"

Input:
Nama: ${userData.username}
Aktivitas: ${
      userData.activities.map((a) => a.name).join(", ") || "gak ada aktivitas"
    }
Roles: ${userData.roles.length ? userData.roles.join(", ") : "no roles"}
Gabung: ${userData.daysInServer} hari

Task:
Roast ${userData.username} ${
      topic ? `hard about ${topic}` : roaster ? `about ${roaster}` : "brutally"
    } in Jaksel style. ${
      topic
        ? `Focus 80% on ${topic} specifically`
        : roaster
        ? `Focus 60% on ${roaster}`
        : ""
    }

${topic ? `MAIN TOPIC: ${topic}\n` : ""}Example Nicknames (10% usage):
- Kang Begal
- Pengocok Handal
- Tukang Botfrag
- Anak Haram
- Jamet Madura
- Ini Cina
- Niggerindo

End with:
Nickname: max 2 words, ≤32 characters, no special chars, 90% own improv related to roast.

Output: only roast text plus a line with Nickname.
`;
  }
}

module.exports = new RoastService();
