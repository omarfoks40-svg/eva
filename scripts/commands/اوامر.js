const CATEGORY_LABELS = {
  ai: { title: 'الذكاء الاصطناعي', aliases: ['ai', 'ذكاء', 'ذكاء اصطناعي'], icon: '🧠' },
  system: { title: 'النظام', aliases: ['system', 'نظام'], icon: '⚙️' },
  utility: { title: 'الأدوات', aliases: ['utility', 'utilities', 'ادوات', 'أدوات'], icon: '🧰' },
  fun: { title: 'الترفيه والألعاب', aliases: ['fun', 'games', 'العاب', 'ألعاب', 'ترفيه'], icon: '🎮' },
  media: { title: 'الوسائط', aliases: ['media', 'ميديا', 'وسائط'], icon: '🎵' },
  admin: { title: 'الإدارة', aliases: ['admin', 'ادارة', 'إدارة'], icon: '👑' },
  other: { title: 'أوامر أخرى', aliases: ['other', 'اخرى', 'أخرى'], icon: '📦' }
};

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function commandUsage(command, prefix) {
  const c = command.config || {};
  const needsPrefix = c.usePrefix === true;
  const marker = needsPrefix ? prefix : '';
  return (c.guide || marker + c.name)
    .replaceAll('{p}', marker)
    .replaceAll('{pn}', marker + c.name);
}

function getCategories(allCommands) {
  const grouped = new Map();
  for (const command of allCommands.values()) {
    const raw = normalize(command.config?.category) || 'other';
    const key = CATEGORY_LABELS[raw] ? raw : 'other';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(command);
  }
  const preferred = ['ai', 'system', 'utility', 'fun', 'media', 'admin', 'other'];
  return [...grouped.entries()]
    .sort((a, b) => preferred.indexOf(a[0]) - preferred.indexOf(b[0]))
    .map(([key, commands]) => ({ key, commands: commands.sort((a, b) => String(a.config.name).localeCompare(String(b.config.name), 'ar')) }));
}

function categoryForSelection(categories, selection) {
  const normalized = normalize(selection);
  if (/^\\d+$/.test(normalized)) return categories[Number(normalized) - 1] || null;
  return categories.find((category) => {
    const info = CATEGORY_LABELS[category.key];
    return category.key === normalized || normalize(info.title) === normalized || info.aliases.some(alias => normalize(alias) === normalized);
  }) || null;
}

module.exports = {
  config: {
    name: 'help',
    aliases: ['الاوامر', 'أوامر', 'اوامر', 'المساعدة', 'menu', 'قائمة'],
    version: '2.0.0',
    author: 'ماهر',
    countDown: 3,
    role: 0,
    usePrefix: false,
    description: 'قائمة أوامر ميكو مقسمة إلى أقسام تفاعلية.',
    category: 'system',
    guide: 'اوامر [رقم أو اسم القسم أو اسم الأمر]'
  },

  run: async ({ api, event, args, config }) => {
    const { threadID, messageID } = event;
    const prefix = config.prefix || '.';
    const allCommands = global.commands || new Map();
    const categories = getCategories(allCommands);
    const selection = args.join(' ').trim();

    if (allCommands.size === 0) {
      return api.sendMessage('⚠️ لا توجد أوامر محملة حالياً.', threadID, messageID);
    }

    if (selection) {
      const category = categoryForSelection(categories, selection);
      if (category) {
        const info = CATEGORY_LABELS[category.key];
        const lines = category.commands.map((command, index) => {
          const c = command.config;
          const aliases = c.aliases?.length ? ' [' + c.aliases.join(', ') + ']' : '';
          return (index + 1) + '. ' + c.name + aliases + '\\n   ↳ ' + (c.description || 'بدون وصف') + '\\n   ↳ الاستخدام: ' + commandUsage(command, prefix);
        });
        return api.sendMessage(info.icon + ' قسم ' + info.title + '\\n\\n' + lines.join('\\n\\n') + '\\n\\nاكتب: اوامر للعودة إلى الأقسام.', threadID, messageID);
      }

      const normalized = normalize(selection);
      const command = allCommands.get(normalized) || [...allCommands.values()].find(item => item.config?.aliases?.map(normalize).includes(normalized));
      if (command) {
        const c = command.config;
        return api.sendMessage('✨ ' + c.name + '\\n\\n📝 ' + (c.description || 'بدون وصف') + '\\n📖 الاستخدام: ' + commandUsage(command, prefix) + '\\n🔗 البدائل: ' + (c.aliases?.join(', ') || 'لا يوجد'), threadID, messageID);
      }

      return api.sendMessage('❌ لم أجد هذا القسم أو الأمر. اكتب اوامر لعرض أرقام الأقسام.', threadID, messageID);
    }

    const menu = categories.map((category, index) => {
      const info = CATEGORY_LABELS[category.key];
      return (index + 1) + ') ' + info.icon + ' ' + info.title + ' — ' + category.commands.length + ' أمر';
    }).join('\\n');

    const message = '╭━━━〔 🤖 ميكو الرسمي 〕━━━╮\\n' +
      '👑 المطور: ماهر\\n' +
      '╰━━━━━━━━━━━━━━━━━━━━╯\\n\\n' +
      'اختر القسم بكتابة رقمه أو اسمه بدون بادئة:\\n\\n' + menu + '\\n\\n' +
      'مثال: اوامر 1 أو help ذكاء\\n' +
      'عدد الأوامر: ' + allCommands.size;
    return api.sendMessage(message, threadID, messageID);
  }
};