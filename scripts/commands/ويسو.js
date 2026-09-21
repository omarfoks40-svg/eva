const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports.config = {
  name: "ويسو",
  aliases: ["ai", "ذكاء"],
  version: "1.3",
  author: "سينكو",
  countDown: 2,
  adminOnly: false,
  description: "ذكاء اصطناعي سريع جداً",
  category: "ai",
  guide: "{pn} [سؤال]",
  usePrefix: true,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const query = args.join(" ");

  try {
    if (!query) {
      return api.sendMessage(
        "⚠️ اكتب حاجة باش نجاوبك.",
        threadID,
        messageID
      );
    }

    api.setMessageReaction("⏳", messageID, () => {}, true);

    const res = await axios.get(
      `https://text.pollinations.ai/${encodeURIComponent(query)}?model=openai`
    );

    const respond = res.data;

    api.sendMessage(
      respond,
      threadID,
      (err, info) => {
        if (err) return;

        api.setMessageReaction("✅", messageID, () => {}, true);

        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID
        });
      },
      messageID
    );

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);

    api.sendMessage(
      "⚠️ صرا مشكل في الـ API.",
      threadID,
      messageID
    );

    console.log(chalk.red(`[AI ERROR] ${error.message}`));
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  try {
    if (senderID != handleReply.author) return;

    api.setMessageReaction("⏳", messageID, () => {}, true);

    const res = await axios.get(
      `https://text.pollinations.ai/${encodeURIComponent(body)}?model=openai`
    );

    const respond = res.data;

    api.sendMessage(
      respond,
      threadID,
      (err, info) => {
        if (err) return;

        api.setMessageReaction("✅", messageID, () => {}, true);

        global.client.handleReply.push({
          name: "ويسو",
          messageID: info.messageID,
          author: senderID
        });
      },
      messageID
    );

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);

    api.sendMessage(
      "⚠️ حدث خطأ أثناء الرد.",
      threadID,
      messageID
    );

    console.log(chalk.red(`[HANDLE REPLY ERROR] ${error.message}`));
  }
};
