const { GiphyFetch } = require("@giphy/js-fetch-api");
const config = require("../config");

class GiphyService {
  constructor() {
    this.gf = null;

    if (config.giphy && config.giphy.apiKey) {
      try {
        this.gf = new GiphyFetch(config.giphy.apiKey);
      } catch (error) {
        console.error("GiphyService initialization error:", error.message || error);
        this.gf = null;
      }
    }
  }

  isAvailable() {
    return Boolean(this.gf);
  }

  async searchSticker(searchTerm) {
    if (!this.isAvailable() || !searchTerm || typeof searchTerm !== "string" || !searchTerm.trim()) {
      return null;
    }

    try {
      const response = await this.gf.search(searchTerm.trim(), {
        type: "stickers",
        limit: config.giphy?.limit || 10,
        rating: config.giphy?.rating || "pg-13",
      });

      const data = response?.data;
      if (!data || !Array.isArray(data) || data.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * data.length);
      const sticker = data[randomIndex];

      return (
        sticker?.images?.original?.url ||
        sticker?.images?.fixed_height?.url ||
        sticker?.url ||
        null
      );
    } catch (error) {
      console.error("GiphyService searchSticker error:", error.message || error);
      return null;
    }
  }

  async getRandomSticker(tag) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const response = await this.gf.random({
        type: "stickers",
        tag: tag || "funny",
      });

      const sticker = response?.data || response;
      if (!sticker) {
        return null;
      }

      return (
        sticker?.images?.original?.url ||
        sticker?.images?.fixed_height?.url ||
        sticker?.url ||
        null
      );
    } catch (error) {
      console.error("GiphyService getRandomSticker error:", error.message || error);
      return null;
    }
  }
}

module.exports = new GiphyService();
