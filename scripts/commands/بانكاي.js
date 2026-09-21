const chalk = require('chalk');

module.exports.config = {
  name: "بانكاي",
  aliases: ["kick", "طرد"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "طرد عضو باستخدام الرد أو التاغ",
  category: "إدارة",
  guide: "{pn} @منشن أو الرد على رسالة",
  usePrefix: true,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);

    // معلومات المجموعة
    const threadInfo = await api.getThreadInfo(threadID);

    // التحقق هل المستخدم أدمن
    const isAdmin = threadInfo.adminIDs.some(
      admin => admin.id == senderID
    );

    if (!isAdmin) {
      api.setMessageReaction("❌", messageID, () => {}, true);

      return api.sendMessage(
        "⚠️ هذا الأمر للأدمن فقط.",
        threadID,
        messageID
      );
    }

    let targetID;

    // بالطريقة الأولى: التاغ
    if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    // بالطريقة الثانية: الرد
    else if (messageReply) {
      targetID = messageReply.senderID;
    }

    // إذا ما حددش عضو
    else {
      api.setMessageReaction("❌", messageID, () => {}, true);

      return api.sendMessage(
        "⚠️ اعمل منشن أو رد على الشخص لطرده.",
        threadID,
        messageID
      );
    }

    // منع طرد الأدمن
    const targetIsAdmin = threadInfo.adminIDs.some(
      admin => admin.id == targetID
    );

    if (targetIsAdmin) {
      api.setMessageReaction("❌", messageID, () => {}, true);

      return api.sendMessage(
        "⚠️ ما تقدرش تطرد أدمن.",
        threadID,
        messageID
      );
    }

    // تنفيذ الطرد
    api.removeUserFromGroup(targetID, threadID, (err) => {
      if (err) {
        api.setMessageReaction("❌", messageID, () => {}, true);

        return api.sendMessage(
          "⚠️ ما قدرتش نطرد العضو.\nتأكد إن البوت أدمن.",
          threadID,
          messageID
        );
      }

      api.setMessageReaction("✅", messageID, () => {}, true);

      return api.sendMessage(
        "✅ تم طرد العضو.\n💃 لقد كان رقاصة.",
        threadID,
        messageID
      );
    });

  } catch (error) {
    console.log(chalk.red(`[Bankai Error] ${error.message}`));

    api.setMessageReaction("❌", messageID, () => {}, true);

    api.sendMessage(
      "⚠️ حدث خطأ في النظام.",
      threadID,
      messageID
    );
  }
};
