const { OpenAI } = require("openai");
const axios = require("axios");
const config = require("../config");

class ModelService {
  constructor() {
    this.models = {
      deepseek: {
        client: axios,
        config: config.deepseek,
      },
    };
  }

  async generateResponse(modelName, prompt) {
    console.log("Generating response with model:", modelName);
    const model = this.models[modelName];
    if (!model) throw new Error(`Model ${modelName} not configured`);

    const response = await model.client.post(
      model.config.endpoint,
      {
        model: model.config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: model.config.temperature,
      },
      {
        headers: {
          Authorization: `Bearer ${model.config.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content;
  }
}

module.exports = new ModelService();
