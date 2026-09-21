const axios = require('axios');

const GRAPH_API_BASE = 'https://graph.facebook.com';
const FB_HARDCODED_TOKEN = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
const KISS_API_URL = 'https://nexalo-api.vercel.app/api/kiss';

module.exports.config = {
  name: "قبلة",
  aliases: ["kiss", "بوسة"],
  version: "1.1",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "صنع صورة رومانسية بين شخصين 💋",
  category: "ترفيه",
  guide: "{pn} @منشن أو {pn} @منشن1 @منشن2",
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
      return api.sendMessage("⚠️ منشن شخص أولاً يا وحيد 😭", threadID, messageID);
    }

    // تفاعل الانتظار
    api.setMessageReaction("⏳", messageID, () => {}, true);

    let image1, image2, messageBody;

    if (mentionIDs.length === 1) {
      const targetID = mentionIDs[0];
      if (targetID === senderID) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("⚠️ هل تحاول تقبيل نفسك؟ يا لك من غريب أطوار 💀", threadID, messageID);
      }
      image1 = getProfilePictureURL(targetID);
      image2 = getProfilePictureURL(senderID);
      messageBody = `💋 أوه، لقد حصل ${mentions[targetID]} على قبلة منك! 😍`;

    } else if (mentionIDs.length === 2) {
      const [id1, id2] = mentionIDs;
      image1 = getProfilePictureURL(id2);
      image2 = getProfilePictureURL(id1);
      messageBody = `💋 انظروا! ${mentions[id1]} قام بتقبيل ${mentions[id2]} 😍`;

    } else {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ يا إلهي! لا يمكنني معالجة كل هذه القبلات، منشن شخص أو اثنين فقط 😩", threadID, messageID);
    }

    // طلب الصورة من API
    const response = await axios.get(KISS_API_URL, {
      params: { image1, image2 },
      timeout: 10000
    });

    if (response.data && response.data.status) {
      const kissImageURL = response.data.url;

      // إرسال الصورة كـ Stream مباشر (أخف طريقة على السيرفر)
      const imageStream = await axios.get(kissImageURL, { responseType: 'stream' }).then(res => res.data);

      const msg = {
        body: messageBody,
        attachment: imageStream,
        mentions: mentionIDs.map(id => ({ tag: mentions[id], id }))
      };

      api.sendMessage(msg, threadID, () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
      }, messageID);

    } else {
      throw new Error("استجابة غير صالحة من السيرفر");
    }

  } catch (err) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("[خطأ في أمر قبلة]", err.message);
    api.sendMessage("⚠️ حدث خطأ أثناء معالجة الصورة.", threadID, messageID);
  }
};
