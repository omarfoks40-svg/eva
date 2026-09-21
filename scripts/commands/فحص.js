module.exports = {
  config: {
    name: "فحص",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Wael",
    description: "فحص الأوامر المسجلة",
    commandCategory: "النظام",
    usages: "",
    cooldowns: 5
  },
  run: async function ({ api, event }) {
    const { commands } = global.client;
    return api.sendMessage(`📊 عدد الأوامر المسجلة في البوت حالياً: ${commands.size}`, event.threadID);
  }
};
