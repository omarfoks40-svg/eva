module.exports = {
  config: {
    name: "help",
    aliases: ["الاوامر", "أوامر", "اوامر", "المساعدة"],
    version: "1.5.0",
    author: "Nobara Developer",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: "يعرض قائمة الأوامر أو تفاصيل أمر معين.",
    category: "system",
    guide: "{p}help [command]"
  },

  run: async ({ api, event, args, config }) => {
    const { threadID, messageID } = event;

    const prefix = config.prefix || "!";
    const allCommands = global.commands || new Map();

    if (allCommands.size === 0) {
      return api.sendMessage(
        "⚠️ لا توجد أوامر محملة حالياً.",
        threadID,
        messageID
      );
    }

    // عرض تفاصيل أمر معين
    if (args[0]) {
      const name = args[0].toLowerCase();

      const command =
        allCommands.get(name) ||
        [...allCommands.values()].find(cmd =>
          cmd.config?.aliases?.includes(name)
        );

      if (!command) {
        return api.sendMessage(
          `❌ الأمر "${name}" غير موجود.`,
          threadID,
          messageID
        );
      }

      const c = command.config;

      let msg = `✨ [ ${c.name.toUpperCase()} ] ✨\n\n`;
      msg += `📝 الوصف: ${c.description || "لا يوجد وصف"}\n`;
      msg += `🔄 الإصدار: ${c.version || "1.0.0"}\n`;
      msg += `⚙️ يحتاج بادئة: ${c.usePrefix ? "نعم" : "لا"}\n`;
      msg += `👑 الصلاحية: ${c.role || 0}\n`;

      if (c.aliases?.length) {
        msg += `🔗 بدائل: ${c.aliases.join(", ")}\n`;
      }

      msg += `📖 الاستخدام: ${c.guide ? c.guide.replace("{p}", prefix) : prefix + c.name}\n`;

      return api.sendMessage(msg, threadID, messageID);
    }

    // عرض كل الأوامر
    let list = [];

    allCommands.forEach(cmd => {
      list.push(`• ${cmd.config.name}`);
    });

    let msg = `═════════ HELP ═════════\n\n`;
    msg += `📊 عدد الأوامر: ${allCommands.size}\n`;
    msg += `⚡ البادئة: ${prefix}\n\n`;
    msg += `📜 الأوامر:\n${list.join("\n")}\n\n`;
    msg += `💡 اكتب: ${prefix}help [اسم الأمر]`;

    api.sendMessage(msg, threadID, messageID);
  }
};
