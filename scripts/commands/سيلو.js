const chalk = require('chalk');
const axios = require('axios');

module.exports.config = {
  name: "سيلو",
  aliases: ["اسيل", "سيلوو"],
  version: "1.0",
  author: "Wael",
  countDown: 5,
  adminOnly: false,
  description: "سيلو الذكي",
  category: "الذكاء",
  guide: "{pn} [رسالة]",
  usePrefix: true
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  try {
    if (!args.length) {
      return api.sendMessage(
        "سأحتل زيكولا من أجلك يا أسيل ❤️",
        threadID,
        messageID
      );
    }

    const userMessage = args.join(" ");

    const prompt = `
أنت سيلو.
إذا ذكر المستخدم اسم أسيل أو سيلو فأجب دائماً بطريقة لطيفة.
واعتبر أن جملتك المفضلة هي:
"سأحتل زيكولا من أجلك يا أسيل ❤️"

رسالة المستخدم:
${userMessage}
`;

    api.sendMessage("⏳ | جاري التفكير...", threadID);

    const res = await axios.get(
      `https://jonell.ccprojects.gleeze.com/api/gptoss?prompt=${encodeURIComponent(prompt)}`
    );

    let reply =
      res.data.reply ||
      res.data.response ||
      res.data.result ||
      "سأحتل زيكولا من أجلك يا أسيل ❤️";

    if (
      userMessage.toLowerCase().includes("سيلو") ||
      userMessage.includes("اسيل") ||
      userMessage.includes("أسيل")
    ) {
      reply = "سأحتل زيكولا من أجلك يا أسيل ❤️";
    }

    return api.sendMessage(
      `🤍 | ${reply}`,
      threadID,
      messageID
    );

  } catch (err) {
    console.log(chalk.red(`[SILO ERROR] ${err.message}`));

    return api.sendMessage(
      "⚠️ | حدث خطأ.",
      threadID,
      messageID
    );
  }
};
