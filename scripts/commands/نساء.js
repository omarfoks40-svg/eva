const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "نساء",
  aliases: ["women", "☕"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "تشغيل فيديو Women الشهير ☕",
  category: "ترفيه",
  guide: "{pn}",
  usePrefix: false // سيعمل بمجرد كتابة الكلمة
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    // تفاعل ساعة عند البدء
    api.setMessageReaction("⏳", messageID, () => {}, true);

    // المسار للوصول لملف الفيديو في مجلد assets
    const videoPath = path.join(__dirname, '..', '..', 'assets', 'women.mp4');

    if (!fs.existsSync(videoPath)) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ لم يتم العثور على ملف women.mp4 في مجلد assets.", threadID, messageID);
    }

    const msg = {
      body: "Women ☕",
      attachment: fs.createReadStream(videoPath)
    };

    api.sendMessage(msg, threadID, () => {
      // تفاعل الضحك عند نجاح الإرسال
      api.setMessageReaction("☕", messageID, () => {}, true);
    }, messageID);

    console.log(chalk.cyan(`[فيديو] تم تشغيل فيديو Women بواسطة سينكو | المجموعة: ${threadID}`));
  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("⚠️ فشل تشغيل الفيديو، تأكد من وجود الملف في المسار الصحيح.", threadID, messageID);
    console.log(chalk.red(`[خطأ فيديو] ${error.message}`));
  }
};
