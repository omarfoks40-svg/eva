const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

if (!global.ابلين_mode) {
  global.ابلين_mode = {};
}

const GEMINI_KEYS = [
  'ضع_المفاتيح_هنا'
];

let keyIndex = 0;

module.exports.config = {
  name: "ابلين",
  aliases: ["بوت"],
  version: "25.7.0",
  author: "SINKO",
  countDown: 1,
  adminOnly: false,
  description: "ذكاء اصطناعي سوداني",
  category: "ai",
  guide: "{pn} [سؤال] | اون | اوف",
  usePrefix: false,
};

module.exports.run = async function ({ api, event, args }) {

  const { threadID, messageID, senderID } = event;
  const query = args.join(" ").trim();

  try {

    const isDev =
      senderID === "100081948980908" ||
      senderID === "100079668997780";

    // تشغيل وضع الصوت
    if (query === "اون") {

      global.ابلين_mode[threadID] = "voice_only";

      return api.sendMessage(
        "أبشر.. وضع الصوت 🎤 حيشتغل هسة.",
        threadID,
        messageID
      );
    }

    // إيقاف وضع الصوت
    if (query === "اوف") {

      global.ابلين_mode[threadID] = "text_only";

      return api.sendMessage(
        "خلاص.. قلبنا نص 🤐.",
        threadID,
        messageID
      );
    }

    // إرسال ستيكر لو ما في كلام
    if (!query) {

      const stickers = [
        "422806808355567",
        "422806995022215",
        "422807215022193",
        "144885579253456",
        "395015337517600"
      ];

      return api.sendMessage(
        {
          sticker:
            stickers[Math.floor(Math.random() * stickers.length)]
        },
        threadID,
        messageID
      );
    }

    api.setMessageReaction(
      isDev ? "✨" : "🐬",
      messageID,
      () => {},
      true
    );

    const response = await askGemini(query);

    const currentMode =
      global.ابلين_mode[threadID] || "text_only";

    // وضع الصوت
    if (currentMode === "voice_only") {

      return handleVoice(api, event, response);
    }

    // وضع النص
    return api.sendMessage(
      response,
      threadID,
      (err, info) => {

        if (err) return;

        pushReply(info.messageID, senderID);

        api.setMessageReaction(
          "✅",
          messageID,
          () => {},
          true
        );
      },
      messageID
    );

  } catch (error) {

    console.log(
      chalk.red(`[ABLEEN ERROR] ${error.message}`)
    );

    api.setMessageReaction(
      "❌",
      messageID,
      () => {},
      true
    );

    return api.sendMessage(
      "السيرفر كبس هسة يا بابا، جرب تاني 🐱",
      threadID,
      messageID
    );
  }
};

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {

  const { threadID, messageID, senderID, body } = event;

  try {

    if (handleReply.author != senderID) return;

    const isDev =
      senderID === "61588108307572" ||
      senderID === "100079668997780";

    api.setMessageReaction(
      isDev ? "✨" : "🐬",
      messageID,
      () => {},
      true
    );

    const response = await askGemini(body);

    const currentMode =
      global.ابلين_mode[threadID] || "text_only";

    // وضع الصوت
    if (currentMode === "voice_only") {

      return handleVoice(api, event, response);
    }

    // وضع النص
    return api.sendMessage(
      response,
      threadID,
      (err, info) => {

        if (err) return;

        pushReply(info.messageID, senderID);

        api.setMessageReaction(
          "✅",
          messageID,
          () => {},
          true
        );
      },
      messageID
    );

  } catch (error) {

    console.log(
      chalk.red(`[HANDLE REPLY ERROR] ${error.message}`)
    );

    api.setMessageReaction(
      "❌",
      messageID,
      () => {},
      true
    );
  }
};

// =======================
// Gemini Request
// =======================

async function askGemini(query) {

  const key =
    GEMINI_KEYS[keyIndex % GEMINI_KEYS.length];

  keyIndex++;

  const systemPrompt = `
أنتِ "إبلين"، فتاة سودانية راقية، مهذبة، ولطيفة جداً في كلامك.
لغتك عامية سودانية مهذبة.
لو المستخدم أساء الأدب كوني مستفزة بأسلوب راقي.
مع المطور كوني لطيفة جداً.
`;

  try {

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        system_instruction: {
          parts: [
            {
              text: systemPrompt
            }
          ]
        },

        contents: [
          {
            role: "user",
            parts: [
              {
                text: query
              }
            ]
          }
        ],

        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 500
        }
      }
    );

    return (
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "حصل خطأ في الاتصال 🤕"
    );

  } catch (error) {

    console.log(
      chalk.red(
        `[GEMINI ERROR] ${
          error.response?.data || error.message
        }`
      )
    );

    throw error;
  }
}

// =======================
// Voice Handler
// =======================

async function handleVoice(api, event, text) {

  const audioPath = path.resolve(
    __dirname,
    "cache",
    `${event.messageID}.mp3`
  );

  try {

    const { data } = await axios.get(
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ar&client=tw-ob`,
      {
        responseType: "arraybuffer"
      }
    );

    fs.ensureDirSync(
      path.join(__dirname, "cache")
    );

    fs.writeFileSync(
      audioPath,
      Buffer.from(data, "utf-8")
    );

    return api.sendMessage(
      {
        attachment:
          fs.createReadStream(audioPath)
      },
      event.threadID,
      (err, info) => {

        if (!err) {
          pushReply(
            info.messageID,
            event.senderID
          );
        }

        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      },
      event.messageID
    );

  } catch (error) {

    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }

    return api.sendMessage(
      text,
      event.threadID,
      event.messageID
    );
  }
}

// =======================
// Push Reply
// =======================

function pushReply(messageID, author) {

  if (!global.client.handleReply) {
    global.client.handleReply = [];
  }

  global.client.handleReply.push({
    name: "ابلين",
    messageID,
    author
  });
}
