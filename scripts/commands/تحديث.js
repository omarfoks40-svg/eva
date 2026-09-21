const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const moment = require('moment');
const chalk = require('chalk');
const execPromise = util.promisify(exec);

module.exports.config = {
  name: "تحديث",
  aliases: ["update", "ترقية"],
  version: "1.1",
  author: "سينكو",
  countDown: 10,
  adminOnly: true,
  description: "التحقق من وجود تحديثات للبوت من مستودع GitHub",
  category: "أدمن",
  guide: "{pn} للتحقق أو {pn} install للتثبيت",
  usePrefix: true
};

module.exports.run = async function({ api, event, args, config }) {
  const { threadID, messageID } = event;
  const repoURL = 'https://api.github.com/repos/1dev-hridoy/Messenger-NexaloSIM-Bot/commits/main';

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage("جاري التحقق من وجود تحديثات جديدة...", threadID);

    const { data: lastCommit } = await axios.get(repoURL);
    const commitSha = lastCommit.sha;
    const commitMsg = lastCommit.commit.message;
    const commitDate = moment(lastCommit.commit.author.date).format("YYYY-MM-DD HH:mm");

    if (!args[0]) {
      const info = `
[ معلومات التحديث ]
الرسالة: ${commitMsg}
التاريخ: ${commitDate}
الآيدي: ${commitSha.substring(0, 7)}

لتثبيت التحديث، اكتب: ${config.prefix}تحديث install`.trim();
      return api.sendMessage(info, threadID, messageID);
    }

    if (args[0].toLowerCase() === "install") {
      api.sendMessage("جاري بدء عملية التحديث والتثبيت، انتظر قليلاً...", threadID);

      // نسخة احتياطية من appState
      const appStatePath = path.join(process.cwd(), 'appState.json');
      const backupPath = path.join(process.cwd(), `appState_backup.json`);
      if (fs.existsSync(appStatePath)) {
        fs.copyFileSync(appStatePath, backupPath);
      }

      // تنفيذ أوامر Git
      await execPromise("git fetch --all");
      await execPromise("git reset --hard origin/main");
      
      api.sendMessage("تم تحديث الكود المصدري. جاري تثبيت المكتبات (npm install)...", threadID);
      
      await execPromise("npm install");

      // استعادة appState
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, appStatePath);
        fs.unlinkSync(backupPath);
      }

      api.sendMessage("تم التحديث بنجاح! جاري إعادة تشغيل البوت الآن...", threadID, () => {
        process.exit(1); // إعادة التشغيل تعتمد على الـ Monitor (مثل PM2 أو Render)
      });
    }
  } catch (error) {
    console.error(chalk.red(`[Update Error] ${error.message}`));
    api.sendMessage(`⚠️ حدث خطأ أثناء التحديث: ${error.message}`, threadID, messageID);
  }
};
