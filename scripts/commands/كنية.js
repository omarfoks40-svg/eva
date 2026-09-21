const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// توليد كنية عشوائية
function generateNickname() {
  const names = [
    "🔥 عضو نشط",
    "⚡ محارب",
    "☕ عضو هادئ",
    "🛡️ محمي",
    "🎭 عضو مجهول",
    "💎 VIP عضو",
    "🚀 سوبر عضو",
    "🌟 مميز"
  ];
  return names[Math.floor(Math.random() * names.length)];
}

module.exports.config = {
  name: "كنية",
  aliases: ["nickname", "رتب", "rank"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: true,
  description: "تغيير كنية جميع الأعضاء كل 5 ثواني",
  category: "حماية",
  guide: "{pn}",
  usePrefix: false
};

// تشغيل / إيقاف النظام
module.exports.run = async function ({ api, event }) {
  if (!global.nicknameSpam) global.nicknameSpam = false;

  global.nicknameSpam = !global.nicknameSpam;

  return api.sendMessage(
    `✅ تم ${global.nicknameSpam ? "تشغيل" : "إيقاف"} نظام تغيير الكنية كل 5 ثواني`,
    event.threadID
  );
};

// النظام التلقائي
setInterval(async () => {
  if (!global.nicknameSpam) return;

  try {
    const allThreads = global.db?.allThreadData || [];

    for (const thread of allThreads) {
      const threadID = thread.threadID;

      try {
        const info = await api.getThreadInfo(threadID);

        for (const user of info.userInfo) {
          const nickname = generateNickname();

          api.changeNickname(nickname, threadID, user.id);
        }

        console.log(chalk.green(`[كنية] تم التحديث في ${threadID}`));
      } catch (err) {
        console.log(chalk.red(`[خطأ مجموعة] ${err.message}`));
      }
    }
  } catch (e) {
    console.log(chalk.red(`[خطأ عام] ${e.message}`));
  }
}, 5000);
