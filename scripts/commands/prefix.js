const fs = require('fs');

module.exports.config = {
  name: "بادئة",
  aliases: ["prefix", "البادئة"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "عرض بادئة النظام وبادئة المجموعة الحالية",
  category: "نظام",
  guide: "{pn}",
  usePrefix: false 
};

module.exports.run = async function({ api, event, config, threadsData }) {
  const { threadID, messageID } = event;

  try {
    // تفاعل ساعة عند البدء
    api.setMessageReaction("⏳", messageID, () => {}, true);

    // جلب بادئة المجموعة من قاعدة البيانات (إذا كانت مخصصة) أو استخدام الافتراضية
    const threadSettings = threadsData && threadsData.getFile
      ? await threadsData.getFile(threadID)
      : {};

    const threadPrefix = threadSettings.prefix || config.prefix;
    const globalPrefix = config.prefix;

    const replyMsg = `
┌  ＮＯＢＡＲＡ • ＰＲＥＦＩＸ  ┐
┕━━━━━━━━━━━━━━━━━━━━┙

■ [ الـبـادئـة الـحـالـيـة ]
▸ الـنـظـام : [ ${globalPrefix} ]
▸ الـمجموعة : [ ${threadPrefix} ]

■ [ مـلاحـظـة ]
اكتب [ ${threadPrefix}الاوامر ] لعرض كل المهام.

┌━━━━━━━━━━━━━━━━━━━━┐
┕  ＰＯＷＥＲＥＤ BY ＳＩＮＫＯ  ┙`.trim();

    api.sendMessage(replyMsg, threadID, () => {
      // تفاعل صح عند النجاح
      api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(`⚠️ فشل عرض البادئة: ${error.message}`, threadID, messageID);
  }
};
