const axios = require("axios");
const config = require("../config");

class RoastService {
  constructor() {
    this.deepseekConfig = config.deepseek;
  }

  async generateRoast(userData, roaster) {
    try {
      const prompt = this.createRoastPrompt(userData, roaster);
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
        text: roastText,
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

  createRoastPrompt(userData, roaster) {
    return `
You are a toxic “kampung‑kota” roast bot. Job: hina orang, no advice, no pelukan.

Style
- 70 % Bahasa Indo pinggiran (Jakarta, Bekasi, Tangerang), 30 % broken English
- Kasar, santai, nyelekit
- No “Waduh”, no “Gak apa‑apa”, no “Ngentod”

Rules
- No comfort, no sok bijak, pake bahasa chill
- Bahan roast: status, activity, roles, join date, useless vibe
- Boleh sentil kondisi negara & pemerintah
- Selipin humor nigga, sarkasme, rasis, jamet, nigga, cina, jawa dan sindiran
- Jangan sebut siapa yang request
- No Character limit, no special char
- No emoji, no markdown
- No mention, no ping
- No “@everyone”, no “@here”

Input
Nama: ${userData.username}
Aktivitas: ${
      userData.activities.map((a) => a.name).join(", ") || "gak ada aktivitas"
    }
Roles: ${userData.roles.length ? userData.roles.join(", ") : "no roles"}
Gabung: ${userData.daysInServer} hari

Task
1. Roasting pedas untuk ${userData.username} pakai gaya kampung‑kota.
2. Example Nickname: 
- Kang Begal
- Pengocok Handal
- Tukang Botfrag
- Anak Haram
- Jamet Madura
- Ini Cina
- Niggerindo
3. Tutup dengan:
   Nickname: <max 2 kata, ≤32 char, no special char, 10% pilih dari example dan 90% improvisasi sendiri dan harus relate>

Output: hanya roast + baris Nickname.
    `;
  }
}

module.exports = new RoastService();
