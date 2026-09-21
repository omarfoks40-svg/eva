const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GRAPH_API_BASE = 'https://graph.facebook.com';
const FB_HARDCODED_TOKEN = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
const GAY_API_URL = 'https://nexalo-api.vercel.app/api/gay';

module.exports.config = {
  name: "قاي",
  aliases: ["gay", "قاي"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false,
  description: "وضع علم المثليين على صورة شخص تمنشنه 🌈",
  category: "ترفيه",
  guide: "{pn} @منشن",
  usePrefix: true
};

function getProfilePictureURL(userID, size = [512, 512]) {
  const [height, width] = size;
  return `${GRAPH_API_BASE}/${userID}/picture?width=${width}&height=${height}&access_token=${FB_HARDCODED_TOKEN}`;
}

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, mentions } = event;

  try {
    const mentionIDs = Object.keys(mentions);
    if (mentionIDs.length === 0) {
      return api.sendMessage("يا برو، لازم تمنشن شخص عشان نكشفه! 😭", threadID, messageID);
    }

    // تفاعل "ساعة" عند البدء
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const targetID = mentionIDs[0];
    const targetName = mentions[targetID];

    const imageURL = getProfilePictureURL(targetID);

    const response = await axios.get(GAY_API_URL, {
      params: {
        imageurl: imageURL,
      },
      timeout: 10000
    });

    if (response.data && response.data.status) {
      const gayImageURL = response.data.url;

      const fileName = `gay_${targetID}.png`;
      const filePath = path.join(__dirname, fileName);

      const imageResponse = await axios.get(gayImageURL, {
        responseType: 'stream',
        timeout: 10000
      });

      const writer = fs.createWriteStream(filePath);

      imageResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const msg = {
        body: `🌈 انظروا ماذا وجدت.. لقد تم كشفك يا: ${targetName} 😂`,
        attachment: fs.createReadStream(filePath),
        mentions: [
          {
            tag: targetName,
            id: targetID
          }
        ]
      };

      api.sendMessage(msg, threadID, (err) => {
        if (!err) {
          // تفاعل "صح" عند النجاح
          api.setMessageReaction("✅", messageID, () => {}, true);
        }

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, messageID);

    } else {
      throw new Error("استجابة السيرفر غير متوقعة");
    }

  } catch (error) {
    // تفاعل "خطأ" عند الفشل
    api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("[خطأ في أمر قاي]", error.message);
    api.sendMessage("⚠️ فشل معالجة الصورة، حاول مرة أخرى.", threadID, messageID);
  }
};
