module.exports.config = {
  name: "ايدي",
  aliases: ["uid", "id"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "عرض معرف الحساب ورابط البروفايل",
  category: "نظام",
  guide: "{pn}",
  usePrefix: true
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const userInfo = await api.getUserInfo([senderID]);
    const userName = userInfo[senderID]?.name || "مستخدم";
    const profileLink = `https://www.facebook.com/${senderID}`;

    const msg = `
الاسم: ${userName}
الآيدي: ${senderID}
الرابط: ${profileLink}


    `.trim();

  api.sendMessage(msg, threadID, () => {
    api.setMessageReaction("✅", messageID, () => {}, true);
  }, messageID);

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("⚠️ حدث خطأ في جلب البيانات.", threadID, messageID);
  }
};
