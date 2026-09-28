// Set dummy environment variables for testing if not present
process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "mock_discord_token";
process.env.CLIENT_ID = process.env.CLIENT_ID || "mock_client_id";
process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "mock_deepseek_api_key";
process.env.GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || "mock_sheet_id";
process.env.GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY || "mock_private_key";

const assert = require("assert");
const contextReplyService = require("./src/services/contextReplyService");
const giphyService = require("./src/services/giphyService");
const { createContextAnalysisPrompt } = require("./src/services/prompt");

console.log("Starting test suite for contextual reply feature...");

// 1. Test Prompt Generation
console.log("Test 1: Testing createContextAnalysisPrompt...");
const prompt = createContextAnalysisPrompt({
  userMessage: "kamu bot yang lucu ya",
  username: "TestUser",
  referencedMessage: {
    author: "RoasterBot",
    content: "Muka lu kayak sendal jepit",
    isBot: true,
  },
  channelName: "general",
});
assert(typeof prompt === "string", "Prompt should be a string");
assert(prompt.includes("TestUser"), "Prompt should include username");
assert(prompt.includes("kamu bot yang lucu ya"), "Prompt should include user message");
assert(prompt.includes("RoasterBot"), "Prompt should include referenced message author");
console.log("Test 1 passed.");

// 2. Test Giphy Service Availability and Fallback
console.log("Test 2: Testing GiphyService fallback behavior...");
assert(typeof giphyService.isAvailable === "function", "isAvailable should be a function");
// Without GIPHY_API_KEY in environment, isAvailable should return false or handle null safely
const isAvailable = giphyService.isAvailable();
console.log(`Giphy isAvailable status: ${isAvailable}`);

(async () => {
  const result = await giphyService.searchSticker("test");
  if (!isAvailable) {
    assert(result === null, "searchSticker should return null when Giphy is not available");
  }
  console.log("Test 2 passed.");

  // 3. Test Modality Random Selection Distribution
  console.log("Test 3: Testing Modality Selection Distribution (10,000 iterations)...");

  // Case A: Giphy available (probabilities: 0.33, 0.33, 0.34)
  const countsWithGiphy = { text: 0, sticker: 0, reaction: 0 };
  const iterations = 10000;
  for (let i = 0; i < iterations; i++) {
    const modality = contextReplyService.selectModality(
      { text: 0.33, sticker: 0.33, reaction: 0.34 },
      true
    );
    countsWithGiphy[modality]++;
  }
  console.log("Distribution with Giphy:", countsWithGiphy);
  assert(countsWithGiphy.text > 2800 && countsWithGiphy.text < 3800, "Text distribution within expected range");
  assert(countsWithGiphy.sticker > 2800 && countsWithGiphy.sticker < 3800, "Sticker distribution within expected range");
  assert(countsWithGiphy.reaction > 2900 && countsWithGiphy.reaction < 3900, "Reaction distribution within expected range");

  // Case B: Giphy unavailable (should distribute 50% text, 50% reaction, 0% sticker)
  const countsWithoutGiphy = { text: 0, sticker: 0, reaction: 0 };
  for (let i = 0; i < iterations; i++) {
    const modality = contextReplyService.selectModality(
      { text: 0.33, sticker: 0.33, reaction: 0.34 },
      false
    );
    countsWithoutGiphy[modality]++;
  }
  console.log("Distribution without Giphy:", countsWithoutGiphy);
  assert(countsWithoutGiphy.sticker === 0, "Sticker must be 0 when Giphy is unavailable");
  assert(countsWithoutGiphy.text > 4500 && countsWithoutGiphy.text < 5500, "Text should be around 50%");
  assert(countsWithoutGiphy.reaction > 4500 && countsWithoutGiphy.reaction < 5500, "Reaction should be around 50%");
  console.log("Test 3 passed.");

  // 4. Test Conversation Context Extraction
  console.log("Test 4: Testing extractConversationContext...");
  const mockClient = {
    user: { id: "BOT_ID_123" },
  };

  // 4a. Direct mention
  const mockMentionMsg = {
    author: { username: "Alice", bot: false },
    content: "<@BOT_ID_123> halo bot",
    mentions: {
      has: (id) => id === "BOT_ID_123",
    },
    reference: null,
    guild: { name: "TestGuild" },
    channel: { name: "general" },
  };
  const ctxMention = await contextReplyService.extractConversationContext(mockMentionMsg, mockClient);
  assert.strictEqual(ctxMention.shouldTrigger, true, "Direct mention should trigger");
  assert.strictEqual(ctxMention.isBotMentioned, true, "isBotMentioned should be true");
  assert.strictEqual(ctxMention.cleanContent, "halo bot", "cleanContent should strip bot mention tag");

  // 4b. Reply to bot message with mention ping off
  const mockReplyMsg = {
    author: { username: "Bob", bot: false },
    content: "kamu ngeselin deh",
    mentions: {
      has: () => false,
    },
    reference: { messageId: "PREV_MSG_456" },
    guild: { name: "TestGuild" },
    channel: {
      name: "general",
      messages: {
        fetch: async (id) => {
          if (id === "PREV_MSG_456") {
            return {
              author: { id: "BOT_ID_123", username: "RoasterBot" },
              content: "Diam kamu bocil",
            };
          }
          return null;
        },
      },
    },
  };
  const ctxReply = await contextReplyService.extractConversationContext(mockReplyMsg, mockClient);
  assert.strictEqual(ctxReply.shouldTrigger, true, "Reply to bot should trigger even without mention");
  assert.strictEqual(ctxReply.isReplyToBot, true, "isReplyToBot should be true");
  assert.strictEqual(ctxReply.referencedMessage.author, "RoasterBot", "Should extract referenced author");
  assert.strictEqual(ctxReply.referencedMessage.isBot, true, "Referenced message should be recognized as bot");

  // 4c. Non-trigger message (regular user chat, no mention, no reply to bot)
  const mockRegularMsg = {
    author: { username: "Charlie", bot: false },
    content: "siapa mau main game malam ini?",
    mentions: {
      has: () => false,
    },
    reference: null,
    guild: { name: "TestGuild" },
    channel: { name: "general" },
  };
  const ctxRegular = await contextReplyService.extractConversationContext(mockRegularMsg, mockClient);
  assert.strictEqual(ctxRegular.shouldTrigger, false, "Regular message should not trigger");
  console.log("Test 4 passed.");

  // 5. Test Fallback Execution in handleMessage
  console.log("Test 5: Testing handleMessage execution and fallbacks...");

  // Mock message to test reaction fallback (when message.react fails)
  let replyCalled = false;
  let replyContent = null;
  const mockFailReactionMsg = {
    author: { username: "Dave", bot: false },
    webhookId: null,
    system: false,
    content: "<@BOT_ID_123> tes reaksi gagal",
    mentions: {
      has: (id) => id === "BOT_ID_123",
    },
    reference: null,
    guild: { name: "TestGuild" },
    channel: { name: "general" },
    react: async () => {
      throw new Error("Missing Permissions for AddReactions");
    },
    reply: async (payload) => {
      replyCalled = true;
      replyContent = payload;
    },
  };

  // Force modality selection to "reaction"
  const originalSelectModality = contextReplyService.selectModality;
  contextReplyService.selectModality = () => "reaction";

  // Mock analyzeContext to avoid external DeepSeek API call during test
  const originalAnalyze = contextReplyService.analyzeContext;
  contextReplyService.analyzeContext = async () => ({
    emotion: "sarcastic",
    emoji: "\u{1F644}",
    stickerQuery: "eye roll",
    textReply: "Fallback text reply berhasil.",
  });

  const handledReaction = await contextReplyService.handleMessage(mockFailReactionMsg, mockClient);
  assert.strictEqual(handledReaction, true, "handleMessage should succeed");
  assert.strictEqual(replyCalled, true, "message.reply should be called when reaction fails");
  assert.strictEqual(replyContent, "Fallback text reply berhasil.", "Should receive fallback text");

  // Force modality selection to "sticker" with mock Giphy returning null (fallback test)
  replyCalled = false;
  replyContent = null;
  contextReplyService.selectModality = () => "sticker";

  const handledSticker = await contextReplyService.handleMessage(mockFailReactionMsg, mockClient);
  assert.strictEqual(handledSticker, true, "handleMessage should succeed");
  assert.strictEqual(replyCalled, true, "message.reply should be called when sticker search returns null");
  assert.strictEqual(replyContent, "Fallback text reply berhasil.", "Should receive fallback text");

  // Restore mocks
  contextReplyService.selectModality = originalSelectModality;
  contextReplyService.analyzeContext = originalAnalyze;
  console.log("Test 5 passed.");

  console.log("ALL TESTS COMPLETED SUCCESSFULLY.");
})();
