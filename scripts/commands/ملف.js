const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

module.exports.config = {
  name: "ملفات",
  aliases: ["files", "ملف"],
  version: "1.0",
  author: "Hridoy",
  countDown: 5,
  adminOnly: true,
  description: "إدارة الملفات (إضافة / تعديل / حذف)",
  category: "Utility",
  guide: "{pn} add اسم الملف.js | {pn} edit اسم الملف.js محتوى | {pn} delete اسم الملف.js",
  usePrefix: true
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {

    // ===== حماية المطور =====
    if (senderID != "100081948980908") {
      return api.sendMessage(
        "❌ | هذا الأمر خاص بالمطور فقط.",
        threadID,
        messageID
      );
    }

    api.setMessageReaction("🕥", messageID, () => {}, true);

    const action = args[0];
    const fileName = args[1];

    if (!action || !fileName) {
      return api.sendMessage(
        "❌ | الاستخدام:\n\n" +
        "➤ إضافة ملف:\nfiles add test.js\n\n" +
        "➤ تعديل ملف:\nfiles edit test.js console.log('Hello');\n\n" +
        "➤ حذف ملف:\nfiles delete test.js",
        threadID,
        messageID
      );
    }

    const filePath = path.join(__dirname, fileName);

    // ===== إضافة ملف =====
    if (action === "add") {

      if (fs.existsSync(filePath)) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(
          `❌ | الملف ${fileName} موجود بالفعل.`,
          threadID,
          messageID
        );
      }

      fs.writeFileSync(filePath, "", "utf-8");

      api.setMessageReaction("✅", messageID, () => {}, true);

      api.sendMessage(
        `✅ | تم إنشاء الملف:\n${fileName}`,
        threadID,
        messageID
      );

      console.log(
        chalk.green(`[FILES] Created: ${fileName}`)
      );
    }

    // ===== تعديل ملف =====
    else if (action === "edit") {

      if (!fs.existsSync(filePath)) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(
          `❌ | الملف ${fileName} غير موجود.`,
          threadID,
          messageID
        );
      }

      const content = args.slice(2).join(" ");

      if (!content) {
        return api.sendMessage(
          "❌ | اكتب المحتوى الجديد للملف.",
          threadID,
          messageID
        );
      }

      fs.writeFileSync(filePath, content, "utf-8");

      api.setMessageReaction("✅", messageID, () => {}, true);

      api.sendMessage(
        `✅ | تم تعديل الملف:\n${fileName}`,
        threadID,
        messageID
      );

      console.log(
        chalk.yellow(`[FILES] Edited: ${fileName}`)
      );
    }

    // ===== حذف ملف =====
    else if (action === "delete") {

      if (!fs.existsSync(filePath)) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(
          `❌ | الملف ${fileName} غير موجود.`,
          threadID,
          messageID
        );
      }

      fs.unlinkSync(filePath);

      api.setMessageReaction("✅", messageID, () => {}, true);

      api.sendMessage(
        `✅ | تم حذف الملف:\n${fileName}`,
        threadID,
        messageID
      );

      console.log(
        chalk.red(`[FILES] Deleted: ${fileName}`)
      );
    }

    // ===== أمر غير معروف =====
    else {

      api.setMessageReaction("❌", messageID, () => {}, true);

      api.sendMessage(
        "❌ | العملية غير صحيحة.\nاستخدم: add / edit / delete",
        threadID,
        messageID
      );
    }

  } catch (error) {

    api.setMessageReaction("❌", messageID, () => {}, true);

    api.sendMessage(
      "❌ | حدث خطأ أثناء تنفيذ الأمر.",
      threadID,
      messageID
    );

    console.log(
      chalk.red(`[FILES ERROR] ${error.message}`)
    );
  }
};
