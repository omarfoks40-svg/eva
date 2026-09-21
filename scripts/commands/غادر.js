const chalk = require('chalk');

module.exports.config = {
  name: "غادر",
  aliases: ["leave", "exit"],
  version: "1.0",
  author: "Hridoy",
  countDown: 5,
  adminOnly: false,
  description: "جعل البوت يغادر المجموعة",
  category: "Utility",
  guide: "{pn}",
  usePrefix: true
};

module.exports.run = async function({ api, event, args, config }) {
  const { threadID, messageID, senderID } = event;

  const developerID = "100081948980908";

  try {

    if (senderID != developerID) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        "❌ | هذا الأمر خاص بالمطور فقط.",
        threadID,
        messageID
      );
    }

    api.setMessageReaction("🕥", messageID, () => {}, true);

    api.sendMessage(
      "👋 | جاري مغادرة المجموعة...",
      threadID,
      async () => {
        api.setMessageReaction("✅", messageID, () => {}, true);

        await api.removeUserFromGroup(
          api.getCurrentUserID(),
          threadID
        );
      },
      messageID
    );

    console.log(
      chalk.cyan(
        `[Leave Command] Bot left ThreadID: ${threadID}`
      )
    );

  } catch (error) {

    api.setMessageReaction("❌", messageID, () => {}, true);

    api.sendMessage(
      "❌ | حدث خطأ أثناء محاولة مغادرة المجموعة.",
      threadID,
      messageID
    );

    console.log(
      chalk.red(
        `[Leave Error] ${error.message}`
      )
    );
  }
};
