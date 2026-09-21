const axios = require('axios');

const GRAPH_API_BASE = 'https://graph.facebook.com';
const FB_HARDCODED_TOKEN = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
const LOVE_API_URL = 'https://nexalo-api.vercel.app/api/lovev1';

module.exports.config = {
  name: "حب",
  aliases: ["love", "رومانسية"],
  version: "1.3",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "صنع صورة رومانسية تجمعك مع شخص تمنشنه 💖",
  category: "ترفيه",
  guide: "{pn} @منشن",
  usePrefix: true
};

function getProfilePictureURL(userID, size = [512, 512]) {
  const [height, width] = size;
  return `${GRAPH_API_BASE}/${userID}/picture?width=${width}&height=${height}&access_token=${FB_HARDCODED_TOKEN}`;
}

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID, mentions } = event;

  try {
    const mentionIDs = Object.keys(mentions);

    if (mentionIDs.length === 0) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ يا برو، منشن الشخص اللي بتحبه أولاً! 💖", threadID, messageID);
    }

    const targetID = mentionIDs[0];
    const targetName = mentions[targetID].replace('@', '').trim();

    if (targetID === senderID) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ هل تحاول حب نفسك؟ يا لك من نرجسي! 💀", threadID, messageID);
    }

    // تفاعل الانتظار
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const senderPic = getProfilePictureURL(senderID);
    const targetPic = getProfilePictureURL(targetID);

    // طلب الصورة كـ Stream مباشر (الأخف برمجياً)
    const response = await axios.get(LOVE_API_URL, {
      params: {
        image1: senderPic,
        image2: targetPic
      },
      responseType: 'stream',
      timeout: 15000
    });

    const msg = {
      body: `❤️ انظروا إلى هذا الثنائي الرائع: @${targetName} !`,
      attachment: response.data,
      mentions: [{ tag: `@${targetName}`, id: targetID }]
    };

    api.sendMessage(msg, threadID, (err) => {
      if (!err) {
        api.setMessageReaction("❤️", messageID, () => {}, true);
      }
    }, messageID);

  } catch (err) {
    console.error("[خطأ في أمر الحب]", err.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("⚠️ فشل صنع صورة الحب، قد يكون السيرفر مشغولاً.", threadID, messageID);
  }
};
