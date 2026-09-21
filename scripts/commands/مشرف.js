const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports.config = {
  name: "مشرف",
  aliases: ["vip", "المميزين"],
  version: "1.0",
  author: "سينكو",
  countDown: 5,
  adminOnly: false, 
  description: "إدارة قائمة الأعضاء المميزين (إضافة، حذف، عرض)",
  category: "إشراف",
  guide: "{pn} قائمة | {pn} @منشن | {pn} حذف @منشن",
  usePrefix: true,
};

module.exports.run = async function ({ api, event, args, config }) {
  const { threadID, messageID, mentions, senderID } = event;
  const vipFilePath = path.join(__dirname, '../../assets/vip.json');

  // التأكد من وجود المجلد والملف
  if (!fs.existsSync(path.join(__dirname, '../../assets'))) fs.mkdirSync(path.join(__dirname, '../../assets'), { recursive: true });
  if (!fs.existsSync(vipFilePath)) fs.writeFileSync(vipFilePath, JSON.stringify({ vips: [] }, null, 2));

  let vipData = JSON.parse(fs.readFileSync(vipFilePath, 'utf8'));

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    const isAdmin = config.adminUIDs.includes(senderID);
    const command = args[0];

    // 1. عرض القائمة
    if (command === "قائمة" || command === "list") {
      if (vipData.vips.length === 0) {
        return api.sendMessage("📜 لا يوجد أعضاء مميزين حالياً.", threadID, messageID);
      }

      let msgText = "[ قائمة الأعضاء المميزين ]\n\n";
      for (let i = 0; i < vipData.vips.length; i++) {
        msgText += `${i + 1}. الاسم: ${vipData.vips[i].name}\nID: ${vipData.vips[i].id}\n\n`;
      }

      const gifUrl = "https://i.ibb.co/84SnC93f/standard-1.gif";
      const gifStream = await axios.get(gifUrl, { responseType: 'stream' }).then(res => res.data);

      return api.sendMessage({ body: msgText, attachment: gifStream }, threadID, () => {
        api.setMessageReaction("👑", messageID, () => {}, true);
      }, messageID);
    }

    // 2. حذف عضو (للمطور فقط)
    if (command === "حذف" && Object.keys(mentions).length > 0) {
      if (!isAdmin) return api.sendMessage("⚠️ عذراً، هذا الأمر خاص بمطور البوت فقط.", threadID, messageID);

      const id = Object.keys(mentions)[0];
      const index = vipData.vips.findIndex(v => v.id === id);

      if (index === -1) return api.sendMessage("⚠️ هذا المستخدم ليس في القائمة أصلاً.", threadID, messageID);

      vipData.vips.splice(index, 1);
      fs.writeFileSync(vipFilePath, JSON.stringify(vipData, null, 2));
      return api.sendMessage("✅ تم إزالة العضو من قائمة المميزين.", threadID, messageID);
    }

    // 3. إضافة عضو (للمطور فقط)
    if (Object.keys(mentions).length > 0) {
      if (!isAdmin) return api.sendMessage("⚠️ عذراً، هذا الأمر خاص بمطور البوت فقط.", threadID, messageID);

      const id = Object.keys(mentions)[0];
      const name = mentions[id].replace(/@/g, '');

      if (vipData.vips.some(v => v.id === id)) return api.sendMessage("⚠️ هذا المستخدم موجود بالفعل في القائمة.", threadID, messageID);

      vipData.vips.push({ id, name });
      fs.writeFileSync(vipFilePath, JSON.stringify(vipData, null, 2));
      return api.sendMessage(`✅ تم إضافة [ ${name} ] إلى قائمة المميزين.`, threadID, messageID);
    }

    // دليل الاستخدام
    return api.sendMessage(`[ طريقة الاستخدام ]\n\n• عرض القائمة: {pn} قائمة\n• إضافة: {pn} @منشن\n• حذف: {pn} حذف @منشن`, threadID, messageID);

  } catch (error) {
    api.sendMessage("⚠️ حدث خطأ في النظام.", threadID, messageID);
    console.log(chalk.red(`[Vip Error] ${error.message}`));
  }
};
