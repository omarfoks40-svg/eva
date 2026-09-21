const chalk = require('chalk');

module.exports.config = {
  name: "معلومات",
  aliases: ["info", "admin", "سيرفر"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "عرض معلومات البوت والمطور الحقيقي",
  category: "نظام",
  guide: "{pn}",
  usePrefix: true
};

module.exports.run = async function({ api, event, config }) {
  const { threadID, messageID } = event;

  try {
    // تفاعل البدء
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const currentDate = new Date();
    // تنسيق التاريخ والوقت للسودان
    const dateStr = currentDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = currentDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });

    const response = `
┌  ＮＯＢＡＲＡ • ＩＮＦＯ  ┐
┕━━━━━━━━━━━━━━━━━━━━┙

■ [ مـعـلـومـات الـمـطـور ]
▸ الـمـطور : سـيـنـكـو (SINKO)
▸ الـعـمـر : ١٧ عـام
▸ الـدولـة : الـسـودان 🇸🇩
▸ الـتخصص : Node.js Developer

■ [ حـالـة الـنـظـام ]
▸ اسـم الـبوت : ${config.botName || "نـوبـارا"}
▸ الـبـادئة : [ ${config.prefix} ]
▸ الـتـاريخ : ${dateStr}
▸ الـوقـت : ${timeStr}

■ [ الـتـواصـل ]
▸ فـيسبوك : https://www.facebook.com/profile.php?id=61588108307572
▸ تـليجرام : @sinko_dev

┌━━━━━━━━━━━━━━━━━━━━┐
┕  ＰＯＷＥＲＥＤ BY ＳＩＮＫＯ  ┙`.trim();

    api.sendMessage(response, threadID, () => {
      // تفاعل النجاح
      api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

    console.log(chalk.cyan(`[Info] Info displayed by Sinko | Thread: ${threadID}`));
  } catch (error) {
    console.log(chalk.red(`[Info Failed] ${error.message}`));
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("⚠️ فشل جلب معلومات المطور، حاول لاحقاً!", threadID, messageID);
  }
};
