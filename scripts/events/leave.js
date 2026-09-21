const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const crypto = require('crypto');

const GRAPH_API_BASE = 'https://graph.facebook.com';
const FB_HARDCODED_TOKEN = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
const GOODBYE_API_URL = 'https://nexalo-api.vercel.app/api/goodbye-card';

function getProfilePictureURL(userID, size = [512, 512]) {
  const [height, width] = size;
  return `${GRAPH_API_BASE}/${userID}/picture?width=${width}&height=${height}&access_token=${FB_HARDCODED_TOKEN}`;
}

const shortQuotes = [
  "اجج والعب شتت بكرامه",
  "نتمنى لك كل التوفيق!",
  "مع السلامة، انتبه لنفسك!",
  "إلى اللقاء في وقت آخر!",
  "رحلة سعيدة يا غالي!",
  "كل التوفيق لك دائماً!",
  "نراك قريباً إن شاء الله!",
  "كان عب وصديق صالح"
];

module.exports = {
  name: "مغادرة",
  handle: async function({ api, event }) {
    // التأكد أن الحدث هو خروج عضو من المجموعة
    if (event.logMessageType !== "log:unsubscribe") return;
    
    const threadID = event.threadID;
    const leftUserID = event.logMessageData.leftParticipantFbId;

    try {
      const userInfo = await new Promise((resolve, reject) => {
        api.getUserInfo([leftUserID], (err, info) => {
          if (err) reject(err);
          else resolve(info);
        });
      });
      const userName = userInfo[leftUserID]?.name || "مستخدم غير معروف";
      const profilePicUrl = getProfilePictureURL(leftUserID);

      // اختيار مقولة عشوائية
      const randomQuote = shortQuotes[Math.floor(Math.random() * shortQuotes.length)];

      // بناء رابط الـ API
      const apiUrl = `${GOODBYE_API_URL}?image=${encodeURIComponent(profilePicUrl)}&username=${encodeURIComponent(userName)}&text=${encodeURIComponent(randomQuote)}`;

      // تحميل الصورة
      const response = await axios.get(apiUrl, { responseType: 'stream', timeout: 15000 });

      // تجهيز المجلد المؤقت
      const tempDir = path.join(__dirname, '..', '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const fileName = `goodbye_${crypto.randomBytes(4).toString('hex')}.png`;
      const filePath = path.join(tempDir, fileName);

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const stats = fs.statSync(filePath);
      if (stats.size === 0) throw new Error("الصورة فارغة");

      const msg = {
        body: `┌  ＮＯＢＡＲＡ • ＬＥＡＶＥ  ┐\n┕━━━━━━━━━━━━━━━┙\n\n👋 للأسف، غادر [ ${userName} ] المجموعة.\n\n『 ${randomQuote} 』\n\n┕  ＤＥＶ BY ＳＩＮＫＯ  ┙`,
        attachment: fs.createReadStream(filePath)
      };

      await api.sendMessage(msg, threadID);

      // حذف الملف المؤقت
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      
      console.log(chalk.cyan(`[خروج] ${userName} غادر المجموعة: ${threadID}`));
    } catch (error) {
      console.log(chalk.red(`[خطأ في حدث الخروج] ${error.message}`));
    }
  }
};
