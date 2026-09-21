const axios = require('axios');

const GRAPH_API_BASE = 'https://graph.facebook.com';
const FB_HARDCODED_TOKEN = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
const SKY_API_URL = 'https://nexalo-api.vercel.app/api/sky-blend';

function getProfilePictureURL(userID, size = [512, 512]) {
  const [height, width] = size;
  return `${GRAPH_API_BASE}/${userID}/picture?width=${width}&height=${height}&access_token=${FB_HARDCODED_TOKEN}`;
}

module.exports.config = {
  name: "سماء",
  aliases: ["sky", "مجرة"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "دمج صورتك أو صورة من تمنشنه مع منظر السماء النجمي 🌌",
  category: "ترفيه",
  guide: "{pn} أو {pn} @منشن",
  usePrefix: true
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID, mentions } = event;

  try {
    // تفاعل "ساعة" عند البدء
    api.setMessageReaction("⏳", messageID, () => {}, true);

    let targetID = senderID;
    let targetName = "أنت";

    const mentionIDs = Object.keys(mentions);
    if (mentionIDs.length > 0) {
      targetID = mentionIDs[0];
      targetName = mentions[targetID].replace('@', '').trim();
    }

    const profilePicUrl = getProfilePictureURL(targetID);
    const apiUrl = `${SKY_API_URL}?imageUrl=${encodeURIComponent(profilePicUrl)}&blendMode=overlay&opacity=0.7`;

    // طلب الصورة كـ Stream مباشر (أخف وأسرع بدون حفظ ملفات)
    const response = await axios.get(apiUrl, {
      responseType: 'stream',
      timeout: 15000
    });

    const msg = {
      body: `🌌 تم دمج صورة [ ${targetName} ] مع السماء بنجاح!`,
      attachment: response.data
    };

    if (mentionIDs.length > 0) {
      msg.mentions = [{ tag: `@${targetName}`, id: targetID }];
    }

    api.sendMessage(msg, threadID, () => {
      // تفاعل "صح" عند النجاح
      api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

  } catch (err) {
    console.error("[خطأ في أمر السماء]", err.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(`⚠️ فشل معالجة الصورة، حاول مرة أخرى لاحقاً.`, threadID, messageID);
  }
};
