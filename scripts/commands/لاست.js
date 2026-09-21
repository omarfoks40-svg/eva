const chalk = require('chalk');

module.exports.config = {
  name: "لاست",
  aliases: ["list", "groups"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "عرض قائمة المجموعات والخروج منها",
  category: "المطور",
  guide: "{pn}",
  usePrefix: true,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  try {

    // ايدي المطور
    const adminUID = "100081948980908";

    if (senderID != adminUID) {
      return api.sendMessage(
        "⚠️ هذا الأمر خاص بالمطور فقط.",
        threadID,
        messageID
      );
    }

    api.setMessageReaction("⏳", messageID, () => {}, true);

    // جلب كل المجموعات
    const inbox = await api.getThreadList(100, null, ["INBOX"]);

    const groupList = inbox.filter(
      group => group.isGroup == true
    );

    if (groupList.length == 0) {
      return api.sendMessage(
        "⚠️ البوت ليس داخل أي مجموعة.",
        threadID,
        messageID
      );
    }

    let msg = "📋 | قائمة المجموعات\n\n";

    groupList.forEach((group, index) => {
      msg += `${index + 1}. ${group.name || "بدون اسم"}\n`;
      msg += `🆔 ${group.threadID}\n\n`;
    });

    msg += "📌 رد برقم المجموعة ليخرج البوت منها.";

    api.sendMessage(
      msg,
      threadID,
      (err, info) => {

        global.client.handleReply.push({
          name: this.config.name,
          author: senderID,
          messageID: info.messageID,
          groups: groupList
        });

        api.setMessageReaction("✅", messageID, () => {}, true);

      },
      messageID
    );

  } catch (error) {

    console.log(chalk.red(`[LIST ERROR] ${error.message}`));

    api.setMessageReaction("❌", messageID, () => {}, true);

    api.sendMessage(
      "⚠️ حدث خطأ في النظام.",
      threadID,
      messageID
    );
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  try {

    if (senderID != handleReply.author) return;

    const index = parseInt(body);

    if (isNaN(index)) {
      return api.sendMessage(
        "⚠️ اكتب رقم صحيح.",
        threadID,
        messageID
      );
    }

    const selectedGroup = handleReply.groups[index - 1];

    if (!selectedGroup) {
      return api.sendMessage(
        "⚠️ هذا الرقم غير موجود.",
        threadID,
        messageID
      );
    }

    api.setMessageReaction("⏳", messageID, () => {}, true);

    // خروج البوت من المجموعة
    api.removeUserFromGroup(
      api.getCurrentUserID(),
      selectedGroup.threadID,
      (err) => {

        if (err) {

          api.setMessageReaction("❌", messageID, () => {}, true);

          return api.sendMessage(
            "⚠️ ما قدرتش نخرج من المجموعة.",
            threadID,
            messageID
          );
        }

        api.setMessageReaction("✅", messageID, () => {}, true);

        return api.sendMessage(
          `✅ تم خروج البوت من:\n${selectedGroup.name}`,
          threadID,
          messageID
        );
      }
    );

  } catch (error) {

    console.log(chalk.red(`[HANDLE REPLY ERROR] ${error.message}`));

    api.setMessageReaction("❌", messageID, () => {}, true);

    api.sendMessage(
      "⚠️ حدث خطأ أثناء التنفيذ.",
      threadID,
      messageID
    );
  }
};
