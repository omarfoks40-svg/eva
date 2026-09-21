const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const crypto = require('crypto');

const GRAPH_API_BASE = 'https://graph.facebook.com';
const FB_HARDCODED_TOKEN = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
const WELCOME_API_URL = 'https://nexalo-api.vercel.app/api/welcome-card';

function getProfilePictureURL(userID, size = [512, 512]) {
  const [height, width] = size;
  return `${GRAPH_API_BASE}/${userID}/picture?width=${width}&height=${height}&access_token=${FB_HARDCODED_TOKEN}`;
}

const welcomeQuotes = [
  "نورت المجموعة، نتمنى لك وقتاً ممتعاً!",
  "أهلاً بك في عالم التميز!",
  "انضمامك يسعدنا، كن مبدعاً معنا!",
  "نورتنا يا بطل، رحلة سعيدة!"
];

module.exports = {
  name: "انضمام",
  handle: async function({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;
    
    const threadID = event.threadID;
    const addedUsers = event.logMessageData.addedParticipants || [];

    try {
      const groupInfo = await new Promise((resolve, reject) => {
        api.getThreadInfo(threadID, (err, info) => {
          if (err) reject(err); else resolve(info);
        });
      });
      const groupName = groupInfo.threadName || "المجموعة";

      // --- حالة الإضافة الجماعية (أكثر من مستخدمين) ---
      if (addedUsers.length > 2) {
        let names = addedUsers.map(u => u.fullName).join(" ، ");
        let msg = `┌  ＮＯＢＡＲＡ • ＷＥＬＣＯＭＥ  ┐\n┕━━━━━━━━━━━━━━━┙\n\n🎉 أهلاً بكم جميعاً في [ ${groupName} ]\n\n■ [ الأعضاء الجدد ]\n▸ ${names}\n\nنورتوا المكان يا شباب، نتمنى لكم تفاعل جميل!\n\n┕  ⏳  ┙`;
        return api.sendMessage(msg, threadID);
      }

      // --- حالة الإضافة الفردية (ترحيب بالصور) ---
      for (const user of addedUsers) {
        const userID = user.userFbId;
        const userName = user.fullName || "مستخدم جديد";
        const profilePicUrl = getProfilePictureURL(userID);
        const randomQuote = welcomeQuotes[Math.floor(Math.random() * welcomeQuotes.length)];

        const apiUrl = `${WELCOME_API_URL}?image=${encodeURIComponent(profilePicUrl)}&username=${encodeURIComponent(userName)}&text=${encodeURIComponent(randomQuote)}`;

        const response = await axios.get(apiUrl, { responseType: 'stream', timeout: 15000 });

        const tempDir = path.join(__dirname, '..', '..', 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        
        const fileName = `welcome_${crypto.randomBytes(4).toString('hex')}.png`;
        const filePath = path.join(tempDir, fileName);

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        const msg = {
          body: `┌  ＮＯＢＡＲＡ • ＷＥＬＣＯＭＥ  ┐\n┕━━━━━━━━━━━━━━━┙\n\n🎉 أنرت المجموعة يا [ ${userName} ]\n🏠 في: ${groupName}\n\n『 ${randomQuote} 』\n\n┕  ＤＥＶ BY ＳＩＮＫＯ  ┙`,
          attachment: fs.createReadStream(filePath)
        };

        await api.sendMessage(msg, threadID);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

    } catch (error) {
      console.log(chalk.red(`[Welcome Error] ${error.message}`));
    }
  }
};
