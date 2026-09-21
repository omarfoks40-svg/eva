const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports.config = {
  name: "ازرق",
  aliases: ["blue", "صور_في_اي_بي"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false, 
  description: "إرسال صور من مكتبة بلو (للمطورين والـ VIP فقط)",
  category: "وسائط",
  guide: "{pn} - يحضر صورة عشوائية للأعضاء المميزين",
  usePrefix: true,
};

module.exports.run = async function ({ api, event, config }) {
  const { threadID, messageID, senderID } = event;

  // مسار ملف الـ VIP
  const vipFilePath = path.join(__dirname, '../../assets/vip.json');

  let vipData = { vips: [] };
  if (!fs.existsSync(vipFilePath)) {
    fs.writeFileSync(vipFilePath, JSON.stringify(vipData, null, 2));
    console.log(chalk.green(`[نظام بلو] تم إنشاء ملف vip.json في: ${vipFilePath}`));
  } else {
    try {
      const fileContent = fs.readFileSync(vipFilePath, 'utf8');
      vipData = JSON.parse(fileContent);
    } catch (err) {
      console.log(chalk.red(`[خطأ بلو] فشل في قراءة ملف VIP: ${err.message}`));
      vipData = { vips: [] };
    }
  }

  try {
    // تفاعل "ساعة" عند البدء
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const isAdmin = config.adminUIDs.includes(senderID);
    const isVip = vipData.vips.some(vip => vip.id === senderID);

    // التحقق من الصلاحيات
    if (!isAdmin && !isVip) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        "⚠️ هذا الأمر مخصص فقط للمطورين وأعضاء الـ VIP.",
        threadID,
        messageID
      );
    }

    const apiUrl = "https://nexalo-api.vercel.app/api/ba";
    const imageResponse = await axios.get(apiUrl, {
      responseType: 'stream',
      timeout: 15000 
    });

    const contentType = imageResponse.headers['content-type'];
    const fileExtension = contentType.includes('gif') ? '.gif' : contentType.includes('png') ? '.png' : '.jpg';
    const fileName = `blue_${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
    const filePath = path.join(__dirname, fileName);

    const writer = fs.createWriteStream(filePath);
    imageResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const msg = {
      body: "🔵 تفضل، تم جلب الصورة بنجاح! 🔵",
      attachment: fs.createReadStream(filePath)
    };

    api.sendMessage(msg, threadID, () => {
      // تفاعل "صح" عند النجاح
      api.setMessageReaction("✅", messageID, () => {}, true);
      
      // حذف الملف المؤقت بعد الإرسال
      fs.unlink(filePath, (err) => {
        if (err) console.log(chalk.red(`[خطأ] فشل حذف الملف: ${err.message}`));
      });
    }, messageID);

  } catch (error) {
    // تفاعل "خطأ" عند الفشل
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(
      "⚠️ حدث خطأ أثناء جلب الصورة، تأكد من الاتصال وحاول لاحقاً.",
      threadID,
      messageID
    );
    console.log(chalk.red(`[خطأ بلو] ${error.message}`));
  }
};
