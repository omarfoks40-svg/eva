const fs = require('fs');
const path = require('path');
const mikoAI = require('../../services/miko-api');
const GENERATED_DIR = path.join(__dirname, '..', '..', 'generated');
const COMMANDS_DIR = __dirname;
const MAX_REPLY_LENGTH = 18000;

module.exports.config = {
  name: 'ميكو', aliases: ['miko', 'ذكاء', 'ai'], version: '3.0.0', author: 'ماهر', countDown: 3,
  adminOnly: false, description: 'واجهة ميكو الخاصة للحوار والصور وتوليد وتركيب أوامر البوت', category: 'ai',
  guide: 'ميكو سؤالك | ميكو حلل هذه الصورة | ميكو أنشئ كود ... | ميكو ثبت أمر ...', usePrefix: false
};
function getImageAttachment(event) {
  const direct = Array.isArray(event.attachments) ? event.attachments : [];
  const reply = Array.isArray(event.messageReply?.attachments) ? event.messageReply.attachments : [];
  return [...direct, ...reply].find(item => item && ['photo', 'image'].includes(item.type) && item.url);
}
function extractCode(answer) {
  const fence = String.fromCharCode(96).repeat(3);
  const match = answer.match(new RegExp(fence + '([a-zA-Z0-9+#.-]*)\s*\n([\s\S]*?)' + fence));
  if (!match) return null;
  const extensions = { javascript: 'js', js: 'js', node: 'js', typescript: 'ts', ts: 'ts', python: 'py', py: 'py', html: 'html', css: 'css', json: 'json', bash: 'sh', shell: 'sh', sql: 'sql', java: 'java', php: 'php', yaml: 'yml', markdown: 'md', md: 'md' };
  const language = match[1] || 'txt';
  return { language, code: match[2].trim(), extension: extensions[language.toLowerCase()] || 'txt' };
}
function validateCommandSource(source) {
  if (!/module\.exports\.config/.test(source) || !/module\.exports\.run/.test(source)) return 'الكود لا يطابق قالب أمر ميكو المطلوب.';
  if (/(?:require\s*\(|import\s|child_process|process\.|eval\s*\(|Function\s*\(|fetch\s*\(|axios|fs\.|execSync|spawn\s*\()/i.test(source)) return 'تم رفض الكود لأنه يحاول الوصول للنظام أو الشبكة أو تنفيذ نص ديناميكي.';
  if (source.length > 30000) return 'حجم الأمر أكبر من الحد المسموح.';
  return null;
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
    if (!command?.config || typeof command.run !== 'function' || !/^[\p{L}\p{N}_-]{1,32}$/u.test(name)) throw new Error('الأمر لا يحتوي اسماً صالحاً أو دالة تشغيل صحيحة.');
    if (!global.commands || typeof global.commands.set !== 'function') throw new Error('نظام الأوامر غير جاهز.');
    const key = name.toLowerCase();
    if (global.commands.has(key)) throw new Error('يوجد أمر محمل بهذا الاسم مسبقاً.');
    global.commands.set(key, command);
    return { fileName, name };
  } catch (error) { try { fs.unlinkSync(filePath); } catch (_) {} throw error; }
}
module.exports.run = async function ({ api, event, args, config }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = String(event.senderID || '');
  const request = Array.isArray(args) ? args.join(' ').trim() : '';
  const image = getImageAttachment(event);
  const ownerID = String(config?.developerUID || config?.developerId || '61593972777711');
  const isAdmin = senderID === ownerID || (Array.isArray(config?.adminUIDs) && config.adminUIDs.map(String).includes(senderID));
  const wantsInstall = /(?:ثبت|ثبّت|ركّب|install|register)\b/i.test(request);
  const wantsCode = wantsInstall || /(?:أنشئ|انشئ|اكتب|برمج|صمم|كود|code|create|generate)/i.test(request);
  if (!request && !image) return api.sendMessage('اكتب: ميكو سؤالك\nأو أرسل صورة مع كلمة ميكو\nولإنشاء أمر: ميكو ثبت أمر يرد على التحية', threadID, messageID);
  if (wantsInstall && !isAdmin) return api.sendMessage('🔒 تركيب أوامر جديدة متاح للمطور ماهر فقط.', threadID, messageID);
  const content = [{ type: 'text', text: request || 'حلل هذه الصورة بالتفصيل، واذكر ما يظهر فيها بوضوح.' }];
  if (image) content.push({ type: 'image_url', image_url: { url: image.url } });
  try {
    api.setMessageReaction('⏳', messageID, () => {}, true);
    const data = await mikoAI.chat({ temperature: wantsCode ? 0.2 : 0.7, maxTokens: 5000, messages: [
      { role: 'system', content: 'أنت ميكو، ذكاء اصطناعي عربي خاص داخل بوت فيسبوك للمطور ماهر. افهم العربية واللهجات وأجب بوضوح. حلل الصور. عند طلب كود عادي قدم حلاً عملياً داخل كتلة Markdown واحدة. عند طلب تركيب أمر أنشئ JavaScript بصيغة CommonJS يحتوي module.exports.config و module.exports.run = async function ({ api, event, args, config }) ويعتمد على api و event فقط دون require أو fs أو network أو process أو eval.' },
      { role: 'user', content }
    ] });
    const answer = mikoAI.getAnswer(data) || 'لم أستطع استخراج إجابة من نموذج الذكاء الاصطناعي.';
    const code = wantsCode ? extractCode(answer) : null;
    let savedMessage = '';
    if (wantsInstall) {
      if (!code || !['javascript', 'js', 'node'].includes(code.language.toLowerCase())) savedMessage = '\n\n⚠️ لم أجد كتلة JavaScript صالحة لتركيب الأمر.';
      else { const installed = installGeneratedCommand(code.code); savedMessage = '\n\n✅ تم تركيب الأمر «' + installed.name + '» وإضافته للنظام فوراً.\n📄 scripts/commands/' + installed.fileName; }
    } else if (code && isAdmin) {
      fs.mkdirSync(GENERATED_DIR, { recursive: true });
      const fileName = 'miko-' + Date.now() + '.' + code.extension;
      fs.writeFileSync(path.join(GENERATED_DIR, fileName), code.code, 'utf8');
      savedMessage = '\n\n✅ تم حفظ الكود في: generated/' + fileName + '\nلن يتم تشغيله تلقائياً.';
    } else if (code) savedMessage = '\n\n🔒 أعرض الكود فقط؛ الحفظ والتركيب متاحان للمطور ماهر.';
    api.setMessageReaction('✅', messageID, () => {}, true);
    const output = answer.length > MAX_REPLY_LENGTH ? answer.slice(0, MAX_REPLY_LENGTH - 100) + '\n...[تم اختصار الرد]' : answer;
    return api.sendMessage('🤖 ميكو AI\n\n' + output + savedMessage, threadID, messageID);
  } catch (error) {
    api.setMessageReaction('❌', messageID, () => {}, true);
    console.error('[MIKO AI ERROR]', error.response?.data || error.message);
    return api.sendMessage('❌ ميكو غير متاح حالياً. تحقق من MIKO_API_KEY أو OPENAI_API_KEY في Render ثم أعد تشغيل الخدمة.', threadID, messageID);
  }
};