const fs = require('fs');
const path = require('path');
const axios = require('axios');

const AI_URL = process.env.AI_BASE_URL || 'https://api.openai.com/v1/chat/completions';
const GENERATED_DIR = path.join(__dirname, '..', '..', 'generated');

module.exports.config = {
  name: 'ميكو',
  aliases: ['miko', 'ذكاء', 'ai'],
  version: '1.0.0',
  author: 'ماهر',
  countDown: 3,
  adminOnly: false,
  description: 'مساعد ميكو للحوارات وتحليل الصور وتوليد الأكواد',
  category: 'ai',
  guide: 'ميكو سؤالك | ميكو حلل هذه الصورة | ميكو أنشئ كود ...',
  usePrefix: false
};

function getAnswer(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) return content.map(item => item.text || '').join('');
  return String(content || '').trim();
}

function getImageAttachment(event) {
  const direct = Array.isArray(event.attachments) ? event.attachments : [];
  const reply = Array.isArray(event.messageReply?.attachments) ? event.messageReply.attachments : [];
  return [...direct, ...reply].find(item => item && ['photo', 'image'].includes(item.type) && item.url);
}

function extractCode(answer) {
  const fence = String.fromCharCode(96).repeat(3);
  const match = answer.match(new RegExp(fence + '([a-zA-Z0-9+#.-]*)\\s*\\n([\\s\\S]*?)' + fence));
  if (!match) return null;
  const extensions = {
    javascript: 'js', js: 'js', node: 'js', typescript: 'ts', ts: 'ts',
    python: 'py', py: 'py', html: 'html', css: 'css', json: 'json',
    bash: 'sh', shell: 'sh', sql: 'sql', java: 'java', php: 'php',
    c: 'c', cpp: 'cpp', csharp: 'cs', 'c#': 'cs', yaml: 'yml',
    markdown: 'md', md: 'md'
  };
  return { language: match[1] || 'txt', code: match[2], extension: extensions[(match[1] || '').toLowerCase()] || 'txt' };
}

module.exports.run = async function ({ api, event, args, config }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = String(event.senderID || '');
  const request = Array.isArray(args) ? args.join(' ').trim() : '';
  const image = getImageAttachment(event);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return api.sendMessage('⚠️ ميكو AI غير مفعّل بعد. أضف OPENAI_API_KEY إلى أسرار Render.', threadID, messageID);
  }

  if (!request && !image) {
    return api.sendMessage('اكتب: ميكو سؤالك\\nأو أرسل صورة مع كلمة ميكو\\nولإنشاء ملف: ميكو أنشئ كود JavaScript لفعل كذا', threadID, messageID);
  }

  const wantsCode = /(?:أنشئ|انشئ|اكتب|برمج|صمم|كود|code|create|generate)/i.test(request);
  const content = [{ type: 'text', text: request || 'حلل هذه الصورة بالتفصيل، واذكر ما يظهر فيها بوضوح.' }];
  if (image) content.push({ type: 'image_url', image_url: { url: image.url } });

  try {
    api.setMessageReaction('⏳', messageID, () => {}, true);
    const response = await axios.post(AI_URL, {
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      temperature: wantsCode ? 0.2 : 0.7,
      max_tokens: Number(process.env.AI_MAX_TOKENS || 4000),
      messages: [
        {
          role: 'system',
          content: 'أنت ميكو، مساعد ذكي عربي للمطور ماهر. أجب بوضوح وباختصار مفيد. تستطيع تحليل الصور وشرحها. عند طلب كود، صمّم حلاً عملياً قابلاً للتشغيل، واصنع ملفاً واحداً واضحاً داخل كتلة Markdown واحدة مع ذكر طريقة التشغيل. لا تدّعِ أنك نفذت الكود ولا تنفذ أي كود مولّد تلقائياً.'
        },
        { role: 'user', content }
      ]
    }, { headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' }, timeout: 120000 });

    const answer = getAnswer(response.data) || 'لم أستطع استخراج إجابة من نموذج الذكاء الاصطناعي.';
    const code = wantsCode ? extractCode(answer) : null;
    const ownerID = String(config?.developerUID || config?.developerId || '61593972777711');
    const canSave = senderID === ownerID || (Array.isArray(config?.adminUIDs) && config.adminUIDs.map(String).includes(senderID));
    let savedMessage = '';

    if (code && canSave) {
      fs.mkdirSync(GENERATED_DIR, { recursive: true });
      const fileName = 'miko-' + Date.now() + '.' + code.extension;
      fs.writeFileSync(path.join(GENERATED_DIR, fileName), code.code, 'utf8');
      savedMessage = '\\n\\n✅ تم حفظ الكود في: generated/' + fileName + '\\nلن يتم تشغيله تلقائياً حفاظاً على أمان البوت.';
    } else if (code && !canSave) {
      savedMessage = '\\n\\n🔒 أعرض الكود هنا فقط؛ حفظ الملفات متاح للمطور ماهر.';
    }

    api.setMessageReaction('✅', messageID, () => {}, true);
    const output = answer.length > 18000 ? answer.slice(0, 17900) + '\\n...[تم اختصار الرد]' : answer;
    return api.sendMessage('🤖 ميكو AI\\n\\n' + output + savedMessage, threadID, messageID);
  } catch (error) {
    api.setMessageReaction('❌', messageID, () => {}, true);
    const detail = error.response?.data?.error?.message || error.message || 'خطأ غير معروف';
    console.error('[MIKO AI ERROR]', detail);
    return api.sendMessage('❌ تعذر الوصول إلى ميكو AI الآن. تحقق من OPENAI_API_KEY وإعدادات النموذج.', threadID, messageID);
  }
};