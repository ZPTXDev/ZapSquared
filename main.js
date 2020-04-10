const Eris = require('eris');
const Store = require('data-store');
const settings = new Store({ path: 'settings.json' });
var reload = require('require-reload')(require);
var fs = require('fs');
var bot = new Eris(settings.get("token"));
var modulesArr = {};
var cooldowns = {};

initialTime = new Date().getTime();
console.log("");
console.log("        ,/");
console.log("      ,'/        ______          /\\ ___");
console.log("    ,' /        |___  /         |/\\|__ \\");
console.log("  ,'  /_____,      / / __ _ _ __      ) |");
console.log(".'____    ,'      / / / _` | '_ \    / /");
console.log("     /  ,'       / /_| (_| | |_) |  / /_");
console.log("    / ,'        /_____\\__,_| .__/  |____|");
console.log("   /,'                     | |");
console.log("  /'                       |_|");
console.log("\nStarting ZapSquared...");
console.log("Doing some safety checks...");

if (!settings.get("token") || settings.get("token") == "Paste token here") {
  settings.set("token", "Paste token here");
  console.log("\n--------------------\nBefore ZapSquared can run, you'll need to provide a bot token in the settings.json file.\nNeed help? Visit https://s.zptx.icu/zapdiscord.\n--------------------");
  process.exit(1);
}

if (!settings.get("managers") || typeof settings.get("managers") != "object" || settings.get("managers")[0] == "Paste ID here") {
  settings.set("managers", ["Paste ID here"]);
  console.log("\n--------------------\nBefore ZapSquared can run, you'll need to provide your user ID in the settings.json file.\nNeed help? Visit https://s.zptx.icu/zapdiscord.\n--------------------");
  process.exit(1);
}

if (!settings.get("prefix")) {
  settings.set("prefix", "z/");
  console.log("[!] Prefix was automatically set to 'z/'. To change it, edit it in settings.json.");
}

if (settings.get("prefix").includes(" ")) {
  settings.set("prefix", "z/");
  console.log("[!] Spaces aren't supported in the prefix. I've automatically reset it to 'z/'.");
}

module.exports.bot = bot;
module.exports.settings = settings;
module.exports.modulesArr = modulesArr;

console.log("Loading modules...");

fs.readdir("modules", {withFileTypes: true}, (err, files) => {
  files.forEach(f => {
    if (!f.isDirectory()) {console.log("[!] Caught a file (" + f.name + ") in the modules folder. I won't load this, but shouldn't it be in a subfolder?");}
    else {
      modulesArr[f.name] = [];
      fs.readdir("modules/" + f.name, {withFileTypes: true}, (err, subfiles) => {
        subfiles.forEach(sf => {
          if (!sf.isFile()) {console.log("[!] Caught a non-file (" + sf.name + ") in the '" + f.name + "' module folder. I'll ignore it, but be careful where you leave your stuff!");}
          else {
            nameSplit = sf.name.split(".");
            ext = nameSplit[nameSplit.length - 1];
            if (ext != "js") {
              console.log("[!] Caught a non-JS file (" + sf.name + ") in the '" + f.name + "' module folder. I'll ignore it, but be careful where you leave your stuff!");
            }
            else if (!require("./modules/" + f.name + "/" + sf.name).triggers || !require("./modules/" + f.name + "/" + sf.name).desc || !require("./modules/" + f.name + "/" + sf.name).events || !require("./modules/" + f.name + "/" + sf.name).perms || !require("./modules/" + f.name + "/" + sf.name).actions || !require("./modules/" + f.name + "/" + sf.name).cooldown) {
              console.log("[!] " + sf.name + " (in " + f.name + ") doesn't look like a ZapSquared file (or it could be missing something). I'll ignore it for now.");
            }
            else {
              modulesArr[f.name][sf.name] = reload("./modules/" + f.name + "/" + sf.name);
              if (modulesArr[f.name][sf.name].events.includes("preready")) {
                console.log("Action Set: " + sf.name.slice(0, -3) + " (" + f.name + ") | Event: preready");
                modulesArr[f.name][sf.name].actions(null, "event", "preready", null, null);
              }
            }
          }
        });
      });
    }
  });
});

console.log("Connecting to Discord...");

bot.on("ready", () => {
  console.log("\nLogged in to Discord as " + bot.user.username + "#" + bot.user.discriminator + " (" + bot.user.id + ")");
  console.log("Connected to " + bot.guilds.size + " guilds and " + bot.users.size + " users");
  managers = settings.get("managers");
  failedMgrLoad = [];
  mgrList = [];
  managers.forEach(manager => {
    if (!bot.users.get(manager)) {
      failedMgrLoad.push(manager);
    }
    else {
      mgrList.push(bot.users.get(manager).username + "#" + bot.users.get(manager).discriminator + " (" + manager + ")");
    }
  });
  if (mgrList.length == 0) {mgrList.push("None");}
  console.log("Managers: " + mgrList.join(", "));
  console.log("Modules (" + Object.keys(modulesArr).length + "): " + Object.keys(modulesArr).map(module => {return module + " (" + Object.keys(modulesArr[module]).length + ")"}).join(", "));
  console.log("Invite Link: https://discordapp.com/oauth2/authorize?client_id=" + bot.user.id + "&scope=bot&permissions=8");
  if (mgrList[0] == "None") {
    settings.set("managers", ["Paste ID here"]);
    console.log("\n--------------------\nThe user ID you provided in settings.json is incorrect, or I'm unable to find you in a mutual server (this can happen if you didn't add me to a server with you).\nNeed help? Visit https://s.zptx.icu/zapdiscord.\n--------------------");
    process.exit(1);
  }
  if (failedMgrLoad.length > 0) {
    console.log("[!] One or more manager IDs are incorrect (or I'm not in a mutual server with them): " + failedMgrLoad.join(", ") + "\n");
  }
  timeTaken = (new Date().getTime() - initialTime) / 1000;
  console.log("\nReady! ("+ timeTaken +"s)");
  bot.options.defaultImageFormat = "png";
});

bot.on("messageCreate", msg => {
  text = msg.content.split(" ");
  prefix = settings.get("prefix");
  if (text[0].startsWith(prefix) && !msg.author.bot) {
    cmd = text[0].substring(prefix.length);
    if (!text[1]) {body = "";}
    else {body = msg.content.substring(text[0].length + 1);}
    exists = false;
    Object.keys(modulesArr).forEach(k => {
      Object.keys(modulesArr[k]).forEach(c => {
        if (modulesArr[k][c].triggers.some(t => t === cmd)) {exists = true; module = k; actionSet = c; action = modulesArr[k][c];}
      });
    });
    if (exists) {
      if (!msg.member) {
        console.log("Action Set: " + actionSet.slice(0, -3) + " (" + module + ") | Command: " + cmd + " | User: " + msg.author.username + "#" + msg.author.discriminator + " (" + msg.author.id + ")");
      }
      else {
        console.log("Action Set: " + actionSet.slice(0, -3) + " (" + module + ") | Command: " + cmd + " | User: " + msg.author.username + "#" + msg.author.discriminator + " (" + msg.author.id + ") | Guild: " + msg.channel.guild.name + " (" + msg.channel.guild.id + ")");
      }
      perms = action.perms;
      if (perms.includes("managerOnly")) {
        managerOnly = true;
      }
      else {managerOnly = false;}
      perms.splice(perms.indexOf("managerOnly"), 1);
      if (perms.includes("dmOnly")) {
        permsNeeded = ["dmOnly"];
      }
      else if (perms.length > 0) {
        permsNeeded = perms;
      }
      else {
        permsNeeded = [];
      }
      permsMissing = [];
      if (permsNeeded.includes("dmOnly") && msg.member) {permsMissing.push("`dmOnly`");}
      else if (permsNeeded.length > 0 && !msg.member) {permsMissing.push("`guildOnly`");}
      else if (permsNeeded.length > 0 && msg.member) {
        permsNeeded.forEach(pn => {
          if (pn != "guildOnly" && !msg.member.permission.has(pn)) {permsMissing.push("`" + pn + "`");}
        });
      }
      if (permsMissing.length == 1) {str = "permission";}
      else {str = "permissions";}
      if (managerOnly && !settings.get("managers").includes(msg.author.id)) {
        msg.channel.createMessage("<:cross:621336829601382421> | You need to be a **Manager** to use that.");
      }
      else if (permsMissing.length > 0 && !settings.get("managers").includes(msg.author.id)) {
        msg.channel.createMessage("<:cross:621336829601382421> | You are missing the " + permsMissing.join(", ") + " " + str + ".");
      }
      else {
        if (permsMissing.length > 0 && settings.get("managers").includes(msg.author.id)) {
          msg.channel.createMessage("<:orange:697688190219452496> | You bypassed the permission check for " + str + ": " + permsMissing.join(", "));
        }
        if (!cooldowns[msg.author.id]) {cooldowns[msg.author.id] = [];}
        if (!cooldowns[msg.author.id].find(c => c.module == module && c.actionSet == actionSet) || settings.get("managers").includes(msg.author.id)) {
          if (cooldowns[msg.author.id].find(c => c.module == module && c.actionSet == actionSet) && settings.get("managers").includes(msg.author.id)) {
            msg.channel.createMessage("<:orange:697688190219452496> | You bypassed the cooldown check.");
          }
          action.actions(`${msg.member ? "guild" : "dm"}`, "command", cmd, body, msg);
          if (action.cooldown > 0) {
            cooldowns[msg.author.id].push({module: module, actionSet: actionSet, expires: new Date().getTime() + action.cooldown * 1000, timeout: setTimeout(() => {cooldowns[msg.author.id].splice(cooldowns[msg.author.id].indexOf(cooldowns[msg.author.id].find(c => c.module == module && c.actionSet == actionSet)), 1);}, action.cooldown * 1000, module, actionSet)});
          }
        }
        else {
          calc = (cooldowns[msg.author.id].find(c => c.module == module && c.actionSet == actionSet).expires - new Date().getTime()) / 1000;
          msg.channel.createMessage("<:cross:621336829601382421> | This command is on cooldown for another **" + calc + "** seconds.");
        }
      }
    }
  }
});

bot.on("error", err => {
  console.log("An error occurred:\n" + err);
});

bot.connect();
