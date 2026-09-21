const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "موافقة",
  aliases: ["approve", "approval"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "تشغيل أو إيقاف ميزة موافقة الأعضاء",
  category: "إدارة",
  guide: "{pn} تشغيل / ايقاف",
  usePrefix: true,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID, body } = event;

  try {

    api.setMessageReaction("⏳", messageID, () => {}, true);

    // معلومات المجموعة
    const threadInfo = await api.getThreadInfo(threadID);

    // التحقق من الأدمن
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

    // ملف التخزين
    const filePath = path.join(__dirname, "cache", "approval.json");

    // إنشاء الملف إذا غير موجود
    if (!fs.existsSync(path.join(__dirname, "cache"))) {
      fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }

    let data = JSON.parse(fs.readFileSync(filePath));

    // تشغيل
    if (body.includes("تشغيل")) {

      data[threadID] = true;

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      api.setMessageReaction("✅", messageID, () => {}, true);

      return api.sendMessage(
        "✅ تم تشغيل ميزة موافقة الأعضاء.",
        threadID,
        messageID
      );
    }

    // إيقاف
    if (body.includes("ايقاف")) {

      data[threadID] = false;

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      api.setMessageReaction("✅", messageID, () => {}, true);

      return api.sendMessage(
        "✅ تم إيقاف ميزة موافقة الأعضاء.",
        threadID,
        messageID
      );
    }

    // دليل الاستخدام
    return api.sendMessage(
      "📌 الاستخدام:\n• موافقة تشغيل\n• موافقة ايقاف",
      threadID,
      messageID
    );

  } catch (error) {

    console.log(chalk.red(`[APPROVAL ERROR] ${error.message}`));

    api.setMessageReaction("❌", messageID, () => {}, true);

    api.sendMessage(
      "⚠️ حدث خطأ في النظام.",
      threadID,
      messageID
    );
  }
};
