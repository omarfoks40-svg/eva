const chalk = require('chalk');

module.exports.config = {
  name: "ping",
  aliases: ["pong", "latency"],
  version: "1.0",
  author: "Hridoy", 
  countDown: 5,
  adminOnly: false,
  description: "Check the bot's response time",
  category: "Utility",
  guide: "{pn}",
  usePrefix: true
};

module.exports.run = async function({ api, event, args, config }) {
  const { threadID, messageID, timestamp } = event;

  try {

    api.setMessageReaction("🕥", messageID, () => {}, true);

    const startTime = timestamp;
    const endTime = Date.now();
    const latency = endTime - startTime;

    const response = `Pong! Latency: ${latency}ms`;
    api.sendMessage(response, threadID, () => {

      api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

    console.log(chalk.cyan(`[Ping Command] Latency: ${latency}ms | ThreadID: ${threadID}`));
  } catch (error) {

    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("An error occurred while processing the ping command.", threadID, messageID);
    console.log(chalk.red(`[Ping Error] ${error.message}`));
  }
};