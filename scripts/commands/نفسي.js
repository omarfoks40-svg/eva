const chalk = require('chalk');
const axios = require('axios');

module.exports.config = {
  name: "دكتور",
  aliases: ["نفسي", "طبيب"],
  version: "1.0",
  author: "Wael",
  countDown: 5,
  adminOnly: false,
  description: "دكتور نفسي بالذكاء الاصطناعي",
  category: "الذكاء",
  guide: "{pn}",
  usePrefix: true
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  try {
    if (!global.doctorChat) global.doctorChat = {};

    global.doctorChat[senderID] = true;

    const questions = [
      "🩺 | كيف كان يومك اليوم؟",
      "🩺 | ما الشيء الذي يشغل بالك هذه الفترة؟",
      "🩺 | هل تشعر بالتوتر أحياناً؟",
      "🩺 | ما أكثر شيء يجعلك سعيداً؟",
      "🩺 | هل تنام بشكل جيد؟",
      "🩺 | ما أكثر شيء يزعجك مؤخراً؟",
      "🩺 | هل لديك شخص ترتاح بالحديث معه؟",
      "🩺 | كيف تصف حالتك النفسية اليوم؟",
      "🩺 | هل تشعر بالضغط من الدراسة أو الحياة؟",
      "🩺 | ما الشيء الذي تتمنى تغييره؟",
      "🩺 | هل تشعر بالوحدة أحياناً؟",
      "🩺 | ما أفضل ذكرى لديك؟",
      "🩺 | هل تثق بسهولة بالناس؟",
      "🩺 | ما الشيء الذي يجعلك تغضب؟",
      "🩺 | هل لديك هدف تسعى له؟",
      "🩺 | ما أكثر شيء تخاف منه؟",
      "🩺 | هل تحب قضاء الوقت وحدك؟",
      "🩺 | كيف تتعامل مع الحزن؟",
      "🩺 | هل تشعر أنك مفهوم من الآخرين؟",
      "🩺 | ما الشيء الذي يريحك نفسياً؟",
      "🩺 | هل لديك هواية تحبها؟",
      "🩺 | ما أكثر موقف أثر فيك؟",
      "🩺 | هل تعبر عن مشاعرك بسهولة؟",
      "🩺 | ما أكثر شيء يجعلك متوتراً؟",
      "🩺 | هل لديك ذكريات تزعجك؟",
      "🩺 | كيف تتصرف عندما تغضب؟",
      "🩺 | هل تهتم برأي الناس كثيراً؟",
      "🩺 | ما الشيء الذي يجعلك تبتسم؟",
      "🩺 | هل تحب التغيير أم الروتين؟",
      "🩺 | ما أكثر حلم تتمنى تحقيقه؟",
      "🩺 | هل سبق وشعرت بخيبة أمل؟",
      "🩺 | كيف تتعامل مع المشاكل؟",
      "🩺 | هل أنت راضٍ عن نفسك؟",
      "🩺 | ما الشيء الذي تتمنى سماعه دائماً؟",
      "🩺 | هل لديك خوف من المستقبل؟",
      "🩺 | ما أكثر شيء يمنحك طاقة إيجابية؟",
      "🩺 | هل تحب مشاركة أسرارك؟",
      "🩺 | كيف تقضي وقت فراغك؟",
      "🩺 | هل تشعر بالإرهاق النفسي؟",
      "🩺 | ما أكثر شيء تفتقده؟",
      "🩺 | هل تعتقد أنك قوي نفسياً؟",
      "🩺 | ما الشيء الذي يجعلك تشعر بالأمان؟",
      "🩺 | هل تحب التعرف على أشخاص جدد؟",
      "🩺 | ما أكثر شيء يجعلك حزيناً؟",
      "🩺 | هل لديك شخص تعتبره قدوة؟",
      "🩺 | كيف تتعامل مع القلق؟",
      "🩺 | هل تشعر أنك تحتاج راحة؟",
      "🩺 | ما الشيء الذي يجعلك فخوراً بنفسك؟",
      "🩺 | هل تتذكر أحلامك عندما تستيقظ؟",
      "🩺 | ما أكثر شيء تتمنى تغييره في حياتك؟",

      ...Array.from({ length: 150 }, (_, i) =>
        `🩺 | سؤال نفسي رقم ${i + 51}، كيف تشعر تجاه هذا الأمر؟`
      )
    ];

    const randomQuestion =
      questions[Math.floor(Math.random() * questions.length)];

    return api.sendMessage(
      `${randomQuestion}\n\n💬 | يمكنك الرد مباشرة وسأستمع إليك.`,
      threadID,
      messageID
    );

  } catch (err) {
    console.log(chalk.red(`[DOCTOR ERROR] ${err.message}`));

    return api.sendMessage(
      "⚠️ | حدث خطأ.",
      threadID,
      messageID
    );
  }
};

module.exports.handleReply = async function({ api, event }) {
  const { threadID, messageID, senderID, body } = event;

  try {
    if (!global.doctorChat || !global.doctorChat[senderID]) return;

    const prompt = `
أنت دكتور نفسي محترم ولطيف.
تحدث بالعربية بشكل هادئ ومريح.
قم بالرد على المستخدم ثم اسأله سؤالاً جديداً ليكمل الحديث.
لا تجعل الرد طويلاً جداً.

رسالة المستخدم:
${body}
`;

    const res = await axios.get(
      `https://jonell.ccprojects.gleeze.com/api/gptoss?prompt=${encodeURIComponent(prompt)}`
    );

    const reply =
      res.data.reply ||
      res.data.response ||
      res.data.result ||
      "🩺 | أفهمك، هل تريد التحدث أكثر عن هذا الشعور؟";

    return api.sendMessage(
      `🩺 | ${reply}`,
      threadID,
      messageID
    );

  } catch (err) {
    console.log(chalk.red(`[DOCTOR REPLY ERROR] ${err.message}`));
  }
};
