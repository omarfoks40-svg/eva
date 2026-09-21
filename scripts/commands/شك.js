const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "شك",
  aliases: ["sus", "مريب"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "تشغيل صوت الشك المريب (SUS) 🤨",
  category: "ترفيه",
  guide: "{pn}",
  usePrefix: false // سيعمل بمجرد كتابة الكلمة
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    // تفاعل ساعة عند البدء
    api.setMessageReaction("⏳", messageID, () => {}, true);

    // الوصول لمجلد assets (تأكد من وجود الملف هناك باسم sus.mp3)
    const audioPath = path.join(__dirname, '..', '..', 'assets', 'sus.mp3');

    if (!fs.existsSync(audioPath)) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ لم يتم العثور على ملف الصوت في مجلد assets.", threadID, messageID);
    }

    const msg = {
      body: "🤨 صوت مريب تم تفعيله!",
      attachment: fs.createReadStream(audioPath)
    };

    api.sendMessage(msg, threadID, () => {
      // تفاعل "الشك" عند نجاح الإرسال
      api.setMessageReaction("🦧", messageID, () => {}, true);
    }, messageID);

    console.log(chalk.cyan(`[صوت] تم تشغيل صوت SUS بواسطة سينكو | المجموعة: ${threadID}`));
  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("⚠️ فشل تشغيل الصوت، تأكد من وجوده في المسار الصحيح.", threadID, messageID);
    console.log(chalk.red(`[خطأ صوت] ${error.message}`));
  }
};
