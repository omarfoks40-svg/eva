const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "ديون",
  aliases: ["ذكاء", "gpt", "بوت"],
  version: "1.0",
  author: "Wael",
  countDown: 5,
  adminOnly: false,
  description: "الذكاء الاصطناعي + صور بنترست",
  category: "الذكاء",
  guide: "{pn} [سؤال / pinterest كلمة]",
  usePrefix: true
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  try {
    if (!args.length) {
      return api.sendMessage(
        "❌ | اكتب سؤال أو:\nديون pinterest anime",
        threadID,
        messageID
      );
    }

    // نظام صور بنترست
    if (args[0].toLowerCase() === "pinterest") {
      const query = args.slice(1).join(" ");

      if (!query) {
        return api.sendMessage(
          "❌ | اكتب كلمة البحث.\nمثال:\nديون pinterest cat",
          threadID,
          messageID
        );
      }

      api.sendMessage("🖼️ | جاري البحث في بنترست...", threadID);

      const pin = await axios.get(
        `https://api.popcat.xyz/pinterest?q=${encodeURIComponent(query)}`
      );

      const images = pin.data;
      
      if (!images || images.length === 0) {
        return api.sendMessage(
          "❌ | لم يتم العثور على صور.",
          threadID,
          messageID
        );
      }

      const imgPath = path.join(__dirname, "cache", `pinterest_${Date.now()}.jpg`);

      const img = await axios.get(images[0], {
        responseType: "arraybuffer"
      });

      fs.writeFileSync(imgPath, Buffer.from(img.data));

      return api.sendMessage(
        {
          body: `🖼️ | نتيجة البحث عن: ${query}`,
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => fs.unlinkSync(imgPath),
        messageID
      );
    }

    // الذكاء الاصطناعي
    const prompt = args.join(" ");

    api.sendMessage("⏳ | جاري التفكير...", threadID);

    const res = await axios.get(
      `https://jonell.ccprojects.gleeze.com/api/gptoss?prompt=${encodeURIComponent(prompt)}`
    );

    const reply =
      res.data.reply ||
      res.data.response ||
      res.data.result ||
      "❌ | لم يتم العثور على رد.";

    return api.sendMessage(
      `🤖 | ${reply}`,
      threadID,
      messageID
    );

  } catch (err) {
    console.log(chalk.red(`[AI ERROR] ${err.message}`));

    return api.sendMessage(
      "⚠️ | حدث خطأ أثناء التنفيذ.",
      threadID,
      messageID
    );
  }
};
