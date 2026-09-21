const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const crypto = require('crypto');

module.exports = {
  name: "socialMediaDownloader",
  handle: async function({ api, event }) {
    const { threadID, messageID, body, senderID } = event;

    // منع البوت من الرد على نفسه أو الرسائل الفارغة
    if (senderID === api.getCurrentUserID() || !body) return;

    const urlMatch = body.match(/(https?:\/\/[^\s]+)/);
    if (!urlMatch) return;

    const url = urlMatch[0];
    
    // التحقق من المنصات المدعومة
    const supported = ["facebook.com", "fb.watch", "tiktok.com", "instagram.com", "youtu.be", "youtube.com", "twitter.com", "x.com"];
    if (!supported.some(p => url.includes(p))) return;

    try {
      // ⏳ تفاعل الانتظار عند بدء البحث
      api.setMessageReaction("⏳", messageID, () => {}, true);

      // الـ API المستقر والجديد
      const apiEndpoint = `https://noobs-api.top/dipto/alldl?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiEndpoint, { timeout: 30000 });
      const data = response.data;

      const videoUrl = data.result;
      const title = data.title || "فيديو";

      if (!videoUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return;
      }

      // تجهيز مسار الملف المؤقت
      const fileName = `nobara_${crypto.randomBytes(4).toString('hex')}.mp4`;
      const filePath = path.join(__dirname, '..', '..', fileName);
      const writer = fs.createWriteStream(filePath);

      const videoResponse = await axios({
        url: videoUrl,
        method: 'GET',
        responseType: 'stream',
        timeout: 120000
      });

      videoResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const stats = fs.statSync(filePath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      // التأكد من الحجم للمسنجر (85MB)
      if (stats.size > 85 * 1024 * 1024) {
        fs.unlinkSync(filePath);
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`┌  ＮＯＢＡＲＡ • ＳＩＺＥ  ┐\n┕━━━━━━━━━━━━━━━┙\n\n⚠️ الحجم كبير جداً: ${fileSizeMB} MB`, threadID, messageID);
      }

      const msg = {
        body: `┌  ＮＯＢＡＲＡ • ＤＯＮＥ  ┐\n┕━━━━━━━━━━━━━━━┙\n\n■ [ مـعـلـومـات الـفـيـديـو ]\n▸ العنوان: ${title}\n▸ الحجم: ${fileSizeMB} MB\n\n┌━━━━━━━━━━━━━━━┐\n┕  ＤＥＶ BY ＳＩＮＫＯ  ┙`,
        attachment: fs.createReadStream(filePath)
      };

      api.sendMessage(msg, threadID, (err) => {
        if (!err) {
          // ✅ تفاعل النجاح عند الإرسال
          api.setMessageReaction("✅", messageID, () => {}, true);
        }
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);

    } catch (error) {
      console.log(chalk.red(`[DL Error] ${error.message}`));
      // ❌ تفاعل الخطأ في حال فشل التحميل
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};
