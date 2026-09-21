const axios = require('axios');

const GRAPH_API_BASE = 'https://graph.facebook.com';
const FB_HARDCODED_TOKEN = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
const PUZZLE_API_URL = 'https://nexalo-api.vercel.app/api/puzzle';

function getProfilePictureURL(userID, size = [512, 512]) {
  const [height, width] = size;
  return `${GRAPH_API_BASE}/${userID}/picture?width=${width}&height=${height}&access_token=${FB_HARDCODED_TOKEN}`;
}

module.exports.config = {
  name: "لغز",
  aliases: ["puzzle", "أحجية"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "تحويل صورتك أو صورة من تمنشنه إلى قطع أحجية (Puzzle) 🧩",
  category: "ترفيه",
  guide: "{pn} [عدد القطع] أو {pn} @منشن [عدد القطع]",
  usePrefix: true
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;

  try {
    // التحقق من عدد القطع
    const pieces = args[args.length - 1];
    if (!pieces || isNaN(pieces) || pieces <= 0) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ يرجى تحديد عدد القطع! مثال: {pn} 15", threadID, messageID);
    }

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
    const apiUrl = `${PUZZLE_API_URL}?image=${encodeURIComponent(profilePicUrl)}&pieces=${pieces}`;

    // طلب الصورة كـ Stream مباشر (أخف وأسرع)
    const response = await axios.get(apiUrl, {
      responseType: 'stream',
      timeout: 15000
    });

    const msg = {
      body: `🧩 تم تحويل صورة [ ${targetName} ] إلى ${pieces} قطعة بنجاح!`,
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
    console.error("[خطأ في أمر اللغز]", err.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(`⚠️ فشل صنع اللغز، تأكد من جودة الاتصال.`, threadID, messageID);
  }
};
