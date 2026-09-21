const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const fca = require('ws3-fca');
const express = require('express');

// --- تحميل الإعدادات ---
const CONFIG_PATH = path.join(__dirname, 'config.json');
const globalConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

function loadAppState() {
  const raw = process.env.APPSTATE_JSON || (process.env.APPSTATE_JSON_BASE64
    ? Buffer.from(process.env.APPSTATE_JSON_BASE64, 'base64').toString('utf8')
    : '');

  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new Error('APPSTATE_JSON is not valid JSON: ' + error.message);
    }
  }

  const legacyPath = path.join(__dirname, 'appState.json');
  if (fs.existsSync(legacyPath)) {
    console.warn('[Security] Using local appState.json. Move it to APPSTATE_JSON and never commit it.');
    return JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
  }

  throw new Error('Missing APPSTATE_JSON. Add the Facebook app state as a Render secret.');
}

const appState = loadAppState();

const app = express();
const PORT = process.env.PORT || 28140;

// سيرفر الاستمرارية (ضروري جداً لريندر عشان ما يطفي)
app.get('/', (req, res) => res.status(200).send('ＭＩＫＯ • ＯＮＬＩＮＥ ⚡'));
app.listen(PORT, () => console.log(chalk.cyan(`[Server] Web Server is running on port ${PORT}`)));

const commands = new Map();
const events = new Map();
global.commands = commands;
global.events = events;
const commandsDir = path.join(__dirname, 'scripts', 'commands');
const eventsDir = path.join(__dirname, 'scripts', 'events');

const abstractBox = chalk.hex('#55FFFF')('═══════════════✨ＭＩＫＯ✨═══════════════');

// --- تحميل الأوامر والأحداث ---
fs.readdirSync(commandsDir).forEach(file => {
  if (file.endsWith('.js')) {
    const command = require(path.join(commandsDir, file));
    commands.set(command.config.name.toLowerCase(), command);
    console.log(chalk.green(`✨ Loaded Command: ${command.config.name}`));
  }
});

if (fs.existsSync(eventsDir)) {
  fs.readdirSync(eventsDir).forEach(file => {
    if (file.endsWith('.js')) {
      const eventHandler = require(path.join(eventsDir, file));
      events.set(eventHandler.name.toLowerCase(), eventHandler);
      console.log(chalk.magenta(`✨ Loaded Event: ${eventHandler.name}`));
    }
  });
}

// --- تشغيل البوت ---
fca({ appState }, (err, api) => {
  if (err) return console.error(chalk.red('🔥 Login Failed! Check AppState.'));

  console.log(chalk.cyan(`🌟 ${globalConfig.botName} جاهز للعمل على ريندر! 🌟`));

  api.listenMqtt((err, event) => {
    if (err || !event) return;

    // 1. معالجة الرسائل
    if (event.type === 'message') {
      const { body, senderID, threadID, messageID } = event;

      // طباعة اللوج الفخم (عربي في الكونسول)
      api.getUserInfo(senderID, (err, info) => {
        const name = info?.[senderID]?.name || 'Unknown';
        console.log(abstractBox);
        console.log(chalk.cyan(`👤 العضو: ${name}\n💬 الرسالة: ${body || '[مرفق]'}\n🧵 المجموعة: ${threadID}`));
        console.log(abstractBox);
      });

      // تشغيل المحمل التلقائي (تأكد أن الاسم هو socialMediaDownloader)
      const autoDL = events.get('socialmediadownloader');
      if (autoDL) autoDL.handle({ api, event });

      const hasAttachments = Array.isArray(event.attachments) && event.attachments.length > 0;
      if (!body && !hasAttachments) return;
      const msgLower = String(body || '').toLowerCase().trim();
      const prefix = globalConfig.prefix;

      // استدعاء ميكو مباشرة: ميكو حلل الصورة / ميكو أنشئ كود
      const mikoInvocation = msgLower.match(/^(ميكو|miko|ذكاء|ai)(?:\s+([\s\S]*))?$/i);
      if (mikoInvocation) {
        const mikoCommand = commands.get('ميكو');
        if (mikoCommand) {
          const directArgs = mikoInvocation[2] ? mikoInvocation[2].trim().split(/\s+/) : [];
          return mikoCommand.run({ api, event, args: directArgs, config: globalConfig });
        }
      }

      // صورة بلا نص: أرسلها إلى ميكو للتحليل
      if (!body && hasAttachments) {
        const mikoCommand = commands.get('ميكو');
        if (mikoCommand) return mikoCommand.run({ api, event, args: [], config: globalConfig });
        return;
      }

      // كل الأوامر تقبل اسمها أو بديلها بدون بادئة، مع تمرير بقية النص كوسائط
      const noPrefixEntry = [...commands.values()].map(command => {
        const names = [command.config.name, ...(command.config.aliases || [])].map(name => String(name).toLowerCase());
        const matchedName = names.find(name => msgLower === name || msgLower.startsWith(name + ' '));
        return matchedName ? { command, matchedName } : null;
      }).find(Boolean);

      if (noPrefixEntry) {
        const { command, matchedName } = noPrefixEntry;
        const rest = msgLower.slice(matchedName.length).trim();
        const args = rest ? rest.split(/\s+/) : [];
        if (command.config.adminOnly && !globalConfig.adminUIDs.map(String).includes(String(senderID))) {
          return api.sendMessage('❌ هذا الأمر خاص بالمطور ماهر.', threadID, messageID);
        }
        return command.run({ api, event, args, config: globalConfig });
      }

      // أوامر بالبادئة
      if (body.startsWith(prefix)) {
        const args = body.slice(prefix.length).trim().split(/\s+/);
        const cmdName = args.shift().toLowerCase();
        const command = commands.get(cmdName) || [...commands.values()].find(c => c.config.aliases?.includes(cmdName));

        if (command) {
          if (command.config.adminOnly && !globalConfig.adminUIDs.includes(senderID)) {
            return api.sendMessage("انغلع يا فلاح", threadID, messageID);
          }
          command.run({ api, event, args, config: globalConfig });
        }
      }
    }

    // 2. معالجة أحداث المجموعات (انضمام ومغادرة)
    if (event.type === 'event') {
      if (event.logMessageType === 'log:subscribe') {
        const join = events.get('join') || events.get('انضمام');
        if (join) join.handle({ api, event });
      }
      if (event.logMessageType === 'log:unsubscribe') {
        const leave = events.get('leave') || events.get('مغادرة');
        if (leave) leave.handle({ api, event });
      }
    }
  });
});
