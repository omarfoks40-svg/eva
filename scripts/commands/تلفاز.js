const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GRAPH_API_BASE = 'https://graph.facebook.com';
const FB_HARDCODED_TOKEN = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
const BTV_API_URL = 'https://nexalo-api.vercel.app/api/tv';

function getProfilePictureURL(userID, size = [512, 512]) {
  const [height, width] = size;
  return `${GRAPH_API_BASE}/${userID}/picture?width=${width}&height=${height}&access_token=${FB_HARDCODED_TOKEN}`;
}

module.exports.config = {
  name: "تلفاز",
  aliases: ["btv", "تلفزيون"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "وضع صورتك الشخصية أو صورة من تمنشنه داخل إطار تلفاز 📺",
  category: "ترفيه",
  guide: "{pn} - لوضع صورتك\n{pn} @منشن - لوضع صورة الشخص المختار",
  usePrefix: true
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID, mentions } = event;
  let filePath;

  try {
    // التفاعل بساعة رملية عند البدء
    api.setMessageReaction("⏳", messageID, () => {}, true);

    let targetID = senderID;
    let targetName = "";

    const mentionIDs = Object.keys(mentions);
    if (mentionIDs.length > 0) {
      targetID = mentionIDs[0];
      targetName = mentions[targetID].replace('@', '').trim();
    }

    if (!targetName) {
      const userInfo = await api.getUserInfo(targetID);
      targetName = userInfo[targetID]?.name || "المستخدم";
    }

    const profilePicUrl = getProfilePictureURL(targetID);
    const apiUrl = `${BTV_API_URL}?image=${encodeURIComponent(profilePicUrl)}`;

    const tempDir = path.join(__dirname, '..', '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const fileName = `btv_${crypto.randomBytes(8).toString('hex')}.png`;
    filePath = path.join(tempDir, fileName);

    const response = await axios.get(apiUrl, {
      responseType: 'stream',
      timeout: 10000
    });

    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error("استجابة السيرفر ليست صورة.");
    }

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const msg = {
      body: `📺 تم تجهيز صورتك على التلفاز يا ${targetName}!`,
      attachment: fs.createReadStream(filePath)
    };

    if (mentionIDs.length > 0) {
      msg.mentions = [{ tag: `@${targetName}`, id: targetID }];
    }

    api.sendMessage(msg, threadID, (err) => {
      if (!err) {
        // التفاعل بعلامة صح عند النجاح
        api.setMessageReaction("✅", messageID, () => {}, true);
      }
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (err) {
    // التفاعل بعلامة خطأ عند الفشل
    api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("[خطأ في أمر التلفاز]", err.message);
    api.sendMessage(`⚠️ حدث خطأ: ${err.message}`, threadID, messageID);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
};
