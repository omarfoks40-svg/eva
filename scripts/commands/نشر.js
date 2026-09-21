const moment = require('moment');

module.exports.config = {
  name: "نشر",
  aliases: ["noti", "تعميم"],
  version: "1.0",
  author: "سينكو",
  countDown: 10,
  adminOnly: true, // للمطور فقط
  description: "إرسال إشعار عام لكل المجموعات المشترك بها البوت",
  category: "إشراف",
  guide: "{pn} [نص الرسالة]",
  usePrefix: true
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args.length) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("⚠️ يرجى كتابة نص الرسالة التي تريد نشرها.", threadID, messageID);
  }

  const message = args.join(" ");

  try {
    // تفاعل ساعة عند بدء العملية الضخمة
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const threadList = await new Promise((resolve, reject) => {
      api.getThreadList(100, null, ["INBOX"], (err, list) => {
        if (err) reject(err);
        else resolve(list);
      });
    });

    const groupThreads = threadList.filter(thread => thread.isGroup);

    if (groupThreads.length === 0) {
      return api.sendMessage("⚠️ لا توجد مجموعات نشطة لإرسال النشر إليها.", threadID, messageID);
    }

    const notificationTime = moment().format("hh:mm A");
    const notificationDate = moment().format("YYYY-MM-DD");

    const notificationMessage = `
┌  ＮＯＢＡＲＡ • ＮＯＴＩＦＹ  ┐
┕━━━━━━━━━━━━━━━━━━━━┙

■ [ رسـالـة مـن الـمـطـور ]
▸ ${message}

■ [ تـفـاصـيـل ]
▸ الـوقـت : ${notificationTime}
▸ الـتـاريخ : ${notificationDate}
▸ الـمـصدر : سـيـنـكـو (SINKO)

┕━━━━━━━━━━━━━━━━━━━━┙`.trim();

    let successCount = 0;
    for (const group of groupThreads) {
      try {
        await new Promise((resolve) => {
          api.sendMessage(notificationMessage, group.threadID, (err) => {
            if (!err) successCount++;
            resolve();
          });
        });
      } catch (e) {
        console.error(`خطأ في الإرسال للمجموعة ${group.threadID}`);
      }
    }

    api.setMessageReaction("✅", messageID, () => {}, true);
    api.sendMessage(`✅ تم نشر الرسالة بنجاح في ${successCount} مجموعة!`, threadID, messageID);

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(`⚠️ فشل النشر: ${error.message}`, threadID, messageID);
    console.error(`[Noti Error] ${error.message}`);
  }
};
