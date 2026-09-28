# Contextual Reply Feature Documentation

## Overview

The Contextual Reply feature enables the Discord bot to respond intelligently and contextually when users interact with it through mentions or message replies, rather than only generating static text roasts. The bot dynamically analyzes conversation history and emotional tone, then randomly selects between three response modalities:
1. Contextual Text Reply: In-character response generated via the DeepSeek chat completion model.
2. Contextual Giphy Sticker: Animated sticker fetched using the official Giphy SDK (@giphy/js-fetch-api) and sent as an inline file attachment.
3. Contextual Reaction: Unicode emoji reaction added directly to the user's triggering message.

---

## Trigger Mechanisms

The bot evaluates incoming messages in client.on("messageCreate") using the following criteria:

1. Direct Mention:
   - Evaluated via message.mentions.has(client.user.id).
   - Occurs when a user tags the bot directly (e.g. @bot apa kabar?).

2. Reply to Bot Message:
   - Evaluated via message.reference.messageId.
   - The bot fetches the referenced message and inspects author.id === client.user.id.
   - Triggers even if the user replies with mention pings turned off (@off).

3. Message Filtering:
   - Bot authors (message.author.bot), webhooks (message.webhookId), and system messages (message.system) are ignored.

---

## Modality Selection and Probabilities

By default, the bot balances the three modalities equally:
- Text: 33 percent (0.33)
- Sticker: 33 percent (0.33)
- Reaction: 34 percent (0.34)

The probabilities can be configured via environment variables:
- REPLY_PROBABILITY_TEXT
- REPLY_PROBABILITY_STICKER
- REPLY_PROBABILITY_REACTION

If GIPHY_API_KEY is not configured or unavailable, the sticker modality is automatically disabled (probability set to 0), and the probability is split equally (50 percent text, 50 percent reaction).

---

## Context Analysis and LLM Prompting

The service utilizes createContextAnalysisPrompt in src/services/prompt.js to instruct DeepSeek to return a structured JSON response:
- emotion: Detected emotional vibe (e.g. sarcastic, amused, roasted, shocked, salty, clown, chill, skeptical).
- emoji: A single standard Unicode emoji matching the emotion.
- stickerQuery: A 1-3 word English search keyword for Giphy stickers matching the context.
- textReply: A witty, contextual reply in the bot's persona (bilingual Indonesian-English, no markdown, no emojis).

This unified approach ensures that one model call provides all data needed for any selected modality and eliminates double-latency in case of fallbacks.

---

## Fallback Hierarchy

1. Sticker Modality Fallback:
   - If GIPHY_API_KEY is missing: automatically dispatches text reply.
   - If Giphy search returns zero stickers: logs warning and automatically falls back to text reply.
   - If sending file attachment fails (e.g. Discord network error): automatically falls back to text reply.

2. Reaction Modality Fallback:
   - If adding reaction throws an error (e.g. Discord missing AddReactions permission or invalid emoji): automatically falls back to text reply.

3. Text Modality Fallback:
   - If DeepSeek API fails or returns invalid JSON: falls back to safe default in-character text response.
