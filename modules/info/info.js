module.exports.triggers = ["info", "about"];
module.exports.desc = "Info and statistics.";
module.exports.cooldown = 3;
module.exports.events = [];
module.exports.perms = [];
module.exports.actions = function (source, type, trigger, body, obj) {
  bot = require("../../main.js").bot;
  modulesArr = require("../../main.js").modulesArr;
  mgrList = require("../../main.js").mgrList;
  roundTo = require("../../main.js").roundTo;
  msToTime = require("../../main.js").msToTime;
  if (type == "command") {
    if (trigger == "info" || trigger == "about") {
      total = 0;
      bot.guilds.map(g => g.memberCount).forEach(a => total = total + a);
      ctotal = 0;
      bot.guilds.map(g => g.channels.size).forEach(a => ctotal = ctotal + a);
      modulesLoaded = Object.keys(modulesArr).length;
      actionSetsLoaded = 0;
      Object.keys(modulesArr).forEach(ma => {
        Object.keys(modulesArr[ma]).forEach(ac => {
          actionSetsLoaded++;
        });
      });
      obj.channel.createMessage({
        embed: {
          description: "```        ,/\n      ,'/        ______          /\\ ___\n    ,' /        |___  /         |/\\|__ \\\n  ,'  /_____,      / / __ _ _ __      ) |\n.'____    ,'      / / / _` | '_ \\    / /\n     /  ,'       / /_| (_| | |_) |  / /_\n    / ,'        /_____\\__,_| .__/  |____|\n   /,'                     | |\n  /'                       |_|```",
          fields: [
            {
              name: "What's ZapSquared?",
              value: "ZapSquared is the successor to Zap."
            },
            {
              name: "Who should I contact if there are issues?",
              value: "ZapSquared is made by [zapteryx](https://zapteryx.com). The issue tracker is available [here](https://github.com/zapteryx/ZapSquared/issues).\nThe manager(s) for this instance of ZapSquared are:\n" + mgrList.join(", ")
            },
            {
              name: "Statistics",
              value: "**RAM Usage**: " + roundTo(process.memoryUsage().heapUsed / 1024 / 1024, 2).toString() + " MB\n**Uptime**: " + msToTime(process.uptime() * 1000) + "\n**Servers**: " + bot.guilds.size + "\n**Users**: " + total + " (" + bot.users.size + " cached)\n**Channels**: " + ctotal + "\n**Modules Loaded**: " + modulesLoaded + " (" + actionSetsLoaded + " action sets)"
            }
          ],
          color: 15844367
        }
      });
    }
  }
}
