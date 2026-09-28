const modelService = require("./modelService");
const giphyService = require("./giphyService");
const config = require("../config");
const { createContextAnalysisPrompt, createReplyMentionPrompt, createCursePrompt } = require("./prompt");

// Standard fallback emoji mapping for emotional vibes
const EMOJI_MAP = {
  amused: "\u{1F602}",
  laugh: "\u{1F602}",
  roasted: "\u{1F480}",
  dead: "\u{1F480}",
  sarcastic: "\u{1F644}",
  eyeroll: "\u{1F644}",
  shocked: "\u{1F92F}",
  disbelief: "\u{1F92F}",
  clown: "\u{1F921}",
  salty: "\u{1F92C}",
  angry: "\u{1F92C}",
  fire: "\u{1F525}",
  burn: "\u{1F525}",
  chill: "\u{1F60E}",
  cool: "\u{1F60E}",
  skeptical: "\u{1F914}",
  thinking: "\u{1F914}",
  shrug: "\u{1F937}",
  whatever: "\u{1F937}",
};

function resolveEmoji(rawEmoji, emotion) {
  if (rawEmoji && typeof rawEmoji === "string" && rawEmoji.trim().length > 0) {
    // Trim and take the first emoji character sequence
    const trimmed = rawEmoji.trim();
    // Validate if it is not just plain alphabetic text
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(trimmed)) {
      return trimmed;
    }
  }

  const key = (emotion || "").toLowerCase().trim();
  for (const [tone, emoji] of Object.entries(EMOJI_MAP)) {
    if (key.includes(tone)) {
      return emoji;
    }
  }

  return "\u{1F525}";
}

const ANGRY_EMOTIONS = ["salty", "angry", "burn", "mad", "kesel", "triggered", "furious", "pissed", "rage"];

const UMPATAN_WORDS = [
  "bangsat", "anjing", "anjir", "anjay", "brengsek", "goblok", "tai", "kontol",
  "memek", "bajingan", "sialan", "keparat", "kampret", "jancok", "jancuk", "asu",
  "celeng", "cok", "ngentod", "ngentot", "babi", "tolol", "bodoh", "idiot",
  "setan", "iblis", "laknat", "kurang ajar", "fuck", "shit", "damn", "bitch",
  "asshole", "bastard", "motherfucker",
];

function containsUmpatan(text) {
  const lower = text.toLowerCase();
  return UMPATAN_WORDS.some((w) => lower.includes(w));
}

class ContextReplyService {
  constructor() {
    this.analysisModel = "proxycli";
    this.replyModel = "proxycli";
    this.curseModel = "deepseek";
  }

  async extractConversationContext(message, client) {
    let referencedMessage = null;

    if (message.reference && message.reference.messageId) {
      try {
        const ref = await message.channel.messages.fetch(message.reference.messageId);
        if (ref) {
          referencedMessage = {
            author: ref.author.username,
            content: ref.content,
            isBot: ref.author.id === client.user.id,
          };
        }
      } catch (err) {
        // Referenced message could be deleted or inaccessible
      }
    }

    const isBotMentioned = message.mentions.has(client.user.id);
    const isReplyToBot = Boolean(referencedMessage && referencedMessage.isBot);
    const shouldTrigger = isBotMentioned || isReplyToBot;

    // Clean user message by removing bot mention tags (<@ID> or <@!ID>)
    const mentionRegex = new RegExp(`<@!?${client.user.id}>`, "g");
    const cleanContent = message.content.replace(mentionRegex, "").trim();

    return {
      shouldTrigger,
      isBotMentioned,
      isReplyToBot,
      cleanContent: cleanContent || message.content.trim() || "(pesan kosong / lampiran)",
      referencedMessage,
      channelName: message.guild ? message.channel.name : "DM",
      username: message.author.username,
    };
  }

  selectModality(probabilities, isGiphyAvailable) {
    let pText = Number(probabilities?.text) || 0.33;
    let pSticker = Number(probabilities?.sticker) || 0.33;
    let pReaction = Number(probabilities?.reaction) || 0.34;

    if (!isGiphyAvailable) {
      pSticker = 0;
      const remainingTotal = pText + pReaction;
      if (remainingTotal > 0) {
        pText = pText / remainingTotal;
        pReaction = pReaction / remainingTotal;
      } else {
        pText = 0.5;
        pReaction = 0.5;
      }
    }

    const total = pText + pSticker + pReaction;
    const random = Math.random() * total;

    if (random < pText) {
      return "text";
    } else if (random < pText + pSticker) {
      return "sticker";
    } else {
      return "reaction";
    }
  }

  async analyzeContext(contextData) {
    const prompt = createContextAnalysisPrompt({
      userMessage: contextData.cleanContent,
      username: contextData.username,
      referencedMessage: contextData.referencedMessage,
      channelName: contextData.channelName,
    });

    try {
      const responseText = await modelService.generateResponse(this.analysisModel, prompt);

      // Clean possible markdown code fences (```json ... ```)
      const cleanJson = responseText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      const parsed = JSON.parse(cleanJson);

      return {
        emotion: parsed.emotion || "roast",
        emoji: resolveEmoji(parsed.emoji, parsed.emotion),
        stickerQuery: parsed.stickerQuery || parsed.emotion || "roast",
        textReply: parsed.textReply || "Santai bro, jangan ngegas.",
      };
    } catch (error) {
      console.error("Context analysis JSON parsing error:", error.message || error);
      return {
        emotion: "roast",
        emoji: "\u{1F525}",
        stickerQuery: "roast",
        textReply: "Santai bro, jangan ngegas.",
      };
    }
  }

  async handleMessage(message, client) {
    if (message.author.bot || message.webhookId || message.system) {
      return false;
    }

    try {
      const context = await this.extractConversationContext(message, client);
      if (!context.shouldTrigger) {
        return false;
      }

      console.log(`[ContextReply] Triggered by ${context.username} in #${context.channelName} (mention: ${context.isBotMentioned}, replyToBot: ${context.isReplyToBot})`);

      const modality = this.selectModality(
        config.contextReply?.probabilities,
        giphyService.isAvailable()
      );

      console.log(`[ContextReply] Selected modality: ${modality}`);

      const analysis = await this.analyzeContext(context);

      const hasUmpatan = containsUmpatan(context.cleanContent);
      const isAngry = hasUmpatan || ANGRY_EMOTIONS.some((e) => analysis.emotion.toLowerCase().includes(e));
      console.log(`[ContextReply] Emotion: ${analysis.emotion} | Umpatan: ${hasUmpatan} | Angry: ${isAngry}`);

      const finalModality = isAngry
        ? this.selectModality({ text: 0.9, sticker: 0.05, reaction: 0.05 }, giphyService.isAvailable())
        : modality;
      console.log(`[ContextReply] Final modality: ${finalModality} (angry: ${isAngry})`);

      if (finalModality === "sticker") {
        const stickerUrl = await giphyService.searchSticker(analysis.stickerQuery);
        if (stickerUrl) {
          try {
            await message.reply({
              files: [{ attachment: stickerUrl, name: "sticker.gif" }],
            });
            console.log(`[ContextReply] Sent sticker: ${stickerUrl}`);
            return true;
          } catch (stickerSendError) {
            console.error("[ContextReply] Failed to send sticker file attachment, falling back to text:", stickerSendError.message);
          }
        } else {
          console.log("[ContextReply] No sticker found for query:", analysis.stickerQuery, "- falling back to text");
        }
        // Fallback to text
        await message.reply(analysis.textReply || "Santai bro.");
        return true;
      }

      if (finalModality === "reaction") {
        try {
          await message.react(analysis.emoji);
          console.log(`[ContextReply] Reacted with emoji: ${analysis.emoji}`);
          return true;
        } catch (reactionError) {
          console.error("[ContextReply] Failed to react, falling back to text:", reactionError.message);
          await message.reply(analysis.textReply || "Santai bro.");
          return true;
        }
      }

      // Default: text modality
      let textReply;
      if (isAngry) {
        console.log(`[ContextReply] Generating curse response via deepseek`);
        textReply = await modelService.generateResponse(
          this.curseModel,
          createCursePrompt({ userMessage: context.cleanContent, username: context.username })
        );
      } else {
        console.log(`[ContextReply] Generating goodguy response via proxycli`);
        textReply = await modelService.generateResponse(
          this.replyModel,
          createReplyMentionPrompt(null, null, context.cleanContent)
        );
      }
      await message.reply(textReply || analysis.textReply);
      console.log(`[ContextReply] Sent text reply`);
      return true;
    } catch (error) {
      console.error("[ContextReply] Error handling message:", error.message || error);
      return false;
    }
  }
}

module.exports = new ContextReplyService();
