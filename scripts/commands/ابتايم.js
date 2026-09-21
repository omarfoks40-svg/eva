const os = require('os');
const chalk = require('chalk');

module.exports.config = {
  name: "ابتايم",
  aliases: ["ابتايم", "up", "السيرفر"],
  version: "1.5",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "عرض إحصائيات السيرفر ووقت التشغيل في ريندر",
  category: "نظام",
  guide: "{pn}",
  usePrefix: true
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);

    // حساب وقت التشغيل (Uptime)
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    // حساب الذاكرة (Memory)
    const usedMemory = process.memoryUsage().rss / 1024 / 1024;
    const totalMemory = os.totalmem() / 1024 / 1024;
    
    // معلومات النظام
    const platform = os.platform();
    const arch = os.arch();
    const cpuModel = os.cpus()[0].model;
    const ping = Date.now() - event.timestamp;

    const response = `
[ إحصائيات بوت نوبارا ]

• وقت التشغيل: ${days} يوم، ${hours} ساعة، ${minutes} دقيقة
• سرعة الاستجابة: ${ping}ms
• الذاكرة المستخدمة: ${usedMemory.toFixed(2)} MB
• إجمالي ذاكرة ريندر: ${totalMemory.toFixed(0)} MB

• نظام التشغيل: ${platform} (${arch})
• المعالج: ${cpuModel}
• الحالة: متصل ونشط ⚡

مطور النظام: سينكو
    `.trim();

    api.sendMessage(response, threadID, () => {
      api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

    console.log(chalk.green(`[Uptime] تم العرض بواسطة سينكو | ${days}d ${hours}h`));

  } catch (error) {
    console.log(chalk.red(`[Error] ${error.message}`));
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("⚠️ فشل جلب إحصائيات السيرفر.", threadID, messageID);
  }
};
