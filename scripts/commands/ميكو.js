const fs = require('fs');
const path = require('path');
const axios = require('axios');

const AI_URL = process.env.AI_BASE_URL || 'https://api.openai.com/v1/chat/completions';
const GENERATED_DIR = path.join(__dirname, '..', '..', 'generated');
const COMMANDS_DIR = __dirname;
const MAX_REPLY_LENGTH = 18000;

module.exports.config = {
  name: 'ميكو',
  aliases: ['miko', 'ذكاء', 'ai'],
  version: '2.0.0',
  author: 'ماهر',
  countDown: 3,
  adminOnly: false,
  description: 'مساعد ميكو للحوار وتحليل الصور وتوليد وتركيب أوامر البوت',
  category: 'ai',
  guide: 'ميكو سؤالك | ميكو حلل هذه الصورة | ميكو أنشئ كود ... | ميكو ثبت أمر ...',
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
  const match = answer.match(new RegExp(fence + '([a-zA-Z0-9+#.-]*)\s*\n([\s\S]*?)' + fence));
  if (!match) return null;
  const extensions = {
    javascript: 'js', js: 'js', node: 'js', typescript: 'ts', ts: 'ts',
    python: 'py', py: 'py', html: 'html', css: 'css', json: 'json',
    bash: 'sh', shell: 'sh', sql: 'sql', java: 'java', php: 'php',
    c: 'c', cpp: 'cpp', csharp: 'cs', 'c#': 'cs', yaml: 'yml',
    markdown: 'md', md: 'md'
  };
  return { language: match[1] || 'txt', code: match[2].trim(), extension: extensions[(match[1] || '').toLowerCase()] || 'txt' };
}

function validateCommandSource(source) {
  if (!/module\.exports\.config/.test(source) || !/module\.exports\.run/.test(source)) {
    return 'الكود لا يطابق قالب أمر ميكو المطلوب (config و run).';
  }
  // الأوامر المولدة تستخدم api و event فقط؛ منع الوصول للملفات أو الشبكة أو التنفيذ الديناميكي.
  const blocked = /(?:require\s*\(|import\s|child_process|process\.|eval\s*\(|Function\s*\(|fetch\s*\(|axios|fs\.|execSync|spawn\s*\()/i;
  if (blocked.test(source)) return 'تم رفض الكود لأنه يحاول الوصول للنظام أو الشبكة أو تنفيذ نص ديناميكي.';
  if (source.length > 30000) return 'حجم الأمر أكبر من الحد المسموح.';
  return null;
}

function commandNameIsSafe(name) {
  return typeof name === 'string' && /^[\p{L}\p{N}_-]{1,32}$/u.test(name);
}

function installGeneratedCommand(source) {
  const validationError = validateCommandSource(source);
  if (validationError) throw new Error(validationError);

  const fileName = 'miko-generated-' + Date.now() + '.js';
  const filePath = path.join(COMMANDS_DIR, fileName);
  fs.writeFileSync(filePath, source + '\n', 'utf8');

  try {
    delete require.cache[require.resolve(filePath)];
    const command = require(filePath);
    const name = String(command?.config?.name || '').trim();
    if (!command?.config || typeof command.run !== 'function' || !commandNameIsSafe(name)) {
      throw new Error('الأمر لا يحتوي اسماً صالحاً أو دالة تشغيل صحيحة.');
    }
    const commands = global.commands;
    if (!commands || typeof commands.set !== 'function') throw new Error('نظام الأوامر غير جاهز.');
    const key = name.toLowerCase();
    if (commands.has(key)) throw new Error('يوجد أمر محمل بهذا الاسم مسبقاً.');
    commands.set(key, command);
    return { fileName, name };
  } catch (error) {
    try { fs.unlinkSync(filePath); } catch (_) {}
    throw error;
  }
}

module.exports.run = async function ({ api, event, args, config }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = String(event.senderID || '');
  const request = Array.isArray(args) ? args.join(' ').trim() : '';
  const image = getImageAttachment(event);
  const apiKey = process.env.OPENAI_API_KEY;
  const ownerID = String(config?.developerUID || config?.developerId || '61593972777711');
  const isAdmin = senderID === ownerID || (Array.isArray(config?.adminUIDs) && config.adminUIDs.map(String).includes(senderID));
  const wantsInstall = /(?:ثبت|ثبّت|أضف(?:ه)?\s+(?:إلى|ل(?:ـ|ل)?|في)\s+النظام|ركّب|install|register)\b/i.test(request);
  const wantsCode = wantsInstall || /(?:أنشئ|انشئ|اكتب|برمج|صمم|كود|code|create|generate)/i.test(request);

  if (!apiKey) {
    return api.sendMessage('⚠️ ميكو AI غير مفعّل بعد. أضف OPENAI_API_KEY إلى أسرار Render، ثم أعد تشغيل الخدمة.', threadID, messageID);
  }

  if (!request && !image) {
    return api.sendMessage('اكتب: ميكو سؤالك\nأو أرسل صورة مع كلمة ميكو\nولإنشاء أمر: ميكو ثبت أمر يرد على التحية', threadID, messageID);
  }

  if (wantsInstall && !isAdmin) {
    return api.sendMessage('🔒 تركيب أوامر جديدة متاح للمطور ماهر فقط. يمكنني شرح أو كتابة الكود لك دون تركيبه.', threadID, messageID);
  }

  const content = [{ type: 'text', text: request || 'حلل هذه الصورة بالتفصيل، واذكر ما يظهر فيها بوضوح.' }];
  if (image) content.push({ type: 'image_url', image_url: { url: image.url } });

  try {
    api.setMessageReaction('⏳', messageID, () => {}, true);
    const response = await axios.post(AI_URL, {
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      temperature: wantsCode ? 0.2 : 0.7,
      max_tokens: Number(process.env.AI_MAX_TOKENS || 5000),
      messages: [
        {
          role: 'system',
          content: 'أنت ميكو، مساعد عربي متقدم للمطور ماهر داخل بوت فيسبوك. افهم العربية واللهجات، أجب بوضوح، واذكر القيود بصدق. تستطيع تحليل الصور. عند طلب كود عادي: قدّم حلاً عملياً قابلاً للتشغيل داخل كتلة Markdown واحدة مع طريقة الاستخدام. عند طلب تركيب أمر للبوت: أنشئ JavaScript واحداً فقط بصيغة CommonJS، ويجب أن يحتوي module.exports.config و module.exports.run = async function ({ api, event, args, config })، ويعتمد على api و event فقط دون require أو fs أو network أو process أو eval أو تنفيذ تلقائي. لا تدّعِ أنك نفذت شيئاً إلا إذا أكد لك النظام ذلك.'
        },
        { role: 'user', content }
      ]
    }, { headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' }, timeout: 120000 });

    const answer = getAnswer(response.data) || 'لم أستطع استخراج إجابة من نموذج الذكاء الاصطناعي.';
    const code = wantsCode ? extractCode(answer) : null;
    let savedMessage = '';

    if (wantsInstall) {
      if (!code || !['javascript', 'js', 'node'].includes(code.language.toLowerCase())) {
        savedMessage = '\n\n⚠️ لم أجد كتلة JavaScript صالحة لتركيب الأمر. أعد الطلب مع وصف أوضح.';
      } else {
        const installed = installGeneratedCommand(code.code);
        savedMessage = '\n\n✅ تم تركيب الأمر «' + installed.name + '» وإضافته للنظام فوراً.\n📄 الملف: scripts/commands/' + installed.fileName;
      }
    } else if (code && isAdmin) {
      fs.mkdirSync(GENERATED_DIR, { recursive: true });
      const fileName = 'miko-' + Date.now() + '.' + code.extension;
      fs.writeFileSync(path.join(GENERATED_DIR, fileName), code.code, 'utf8');
      savedMessage = '\n\n✅ تم حفظ الكود في: generated/' + fileName + '\nلن يتم تشغيله تلقائياً حفاظاً على أمان البوت.';
    } else if (code && !isAdmin) {
      savedMessage = '\n\n🔒 أعرض الكود هنا فقط؛ حفظ الملفات وتركيب الأوامر متاحان للمطور ماهر.';
    }

    api.setMessageReaction('✅', messageID, () => {}, true);
    const output = answer.length > MAX_REPLY_LENGTH ? answer.slice(0, MAX_REPLY_LENGTH - 100) + '\n...[تم اختصار الرد]' : answer;
    return api.sendMessage('🤖 ميكو AI\n\n' + output + savedMessage, threadID, messageID);
  } catch (error) {
    api.setMessageReaction('❌', messageID, () => {}, true);
    const detail = error.response?.data?.error?.message || error.message || 'خطأ غير معروف';
    console.error('[MIKO AI ERROR]', detail);
    return api.sendMessage('❌ تعذر الوصول إلى ميكو AI الآن. تحقق من OPENAI_API_KEY وإعدادات النموذج، أو راجع سجل Render.', threadID, messageID);
  }
};