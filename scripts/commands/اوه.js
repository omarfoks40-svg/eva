const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "اوه",
  aliases: ["omg", "اندهش"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "تشغيل فيديو رد الفعل (OMG)",
  category: "ترفيه",
  guide: "{pn}",
  usePrefix: false // سيعمل بمجرد كتابة الكلمة
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    // تفاعل ساعة عند بدء القراءة من الملفات
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const videoPath = path.join(__dirname, '..', '..', 'assets', 'omg.mp4');

    if (!fs.existsSync(videoPath)) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ لم يتم العثور على ملف الفيديو في مجلد assets.", threadID, messageID);
    }

    const msg = {
      body: "🤨😱 !!",
      attachment: fs.createReadStream(videoPath)
    };

    api.sendMessage(msg, threadID, () => {
      // تفاعل صح عند نجاح الإرسال
      api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

    console.log(chalk.cyan(`[فيديو] تم إرسال فيديو OMG بواسطة سينكو في المجموعة: ${threadID}`));
  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("⚠️ فشل تشغيل الفيديو، تأكد من وجوده في المسار الصحيح.", threadID, messageID);
    console.log(chalk.red(`[خطأ فيديو] ${error.message}`));
  }
};
