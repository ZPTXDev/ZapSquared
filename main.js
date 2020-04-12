const Eris = require('eris');
const Store = require('data-store');
const settings = new Store({ path: 'settings.json' });
var reload = require('require-reload')(require);
var fs = require('fs');
var bot = new Eris(settings.get("token"));
var modulesArr = {};
var cooldowns = {};
var mgrList = [];
var ready = false;

function roundTo(n, digits) {
    var negative = false;
    if (digits === undefined) {digits = 0;}
    if (n < 0) {negative = true; n = n * -1;}
    var multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    n = (Math.round(n) / multiplicator).toFixed(digits);
    if (negative) {n = (n * -1).toFixed(digits);}
    if (digits == 0) {n = parseInt(n, 10);}
    return n;
}
function msToTime(ms) {
  days = 0;
  hours = 0;
  minutes = 0;
  seconds = 0;
  preseconds = ms/1000;
  while (preseconds > 59) {minutes = minutes+1; preseconds = preseconds-60;}
  if (preseconds < 60) {
    while (minutes > 59) {hours = hours+1; minutes = minutes-60;}
    if (minutes < 60) {
      while (hours > 23) {days = days+1; hours = hours-24;}
      if (hours < 24) {
        seconds = roundTo(preseconds, 0);
        if (days == 1) {daysString = "day";}
        else {daysString = "days";}
        if (hours == 1) {hoursString = "hr";}
        else {hoursString = "hrs";}
        if (minutes == 1) {minutesString = "min";}
        else {minutesString = "mins";}
        if (seconds == 1) {secondsString = "sec";}
        else {secondsString = "secs";}
        array = [];
        if (days > 0) {array.push(days + " " + daysString + ",");}
        if (hours > 0) {array.push(hours + " " + hoursString + ",");}
        if (minutes > 0) {array.push(minutes + " " + minutesString + ",");}
        if (seconds > 0) {array.push(seconds + " " + secondsString + ",");}
        final = array.join(" ");
        if (final == "") {return "<1 sec"}
        return final.slice(0, -1);
      }
    }
  }
}

initialTime = new Date().getTime();
console.log("");
console.log("        ,/");
console.log("      ,'/        ______          /\\ ___");
console.log("    ,' /        |___  /         |/\\|__ \\");
console.log("  ,'  /_____,      / / __ _ _ __      ) |");
console.log(".'____    ,'      / / / _` | '_ \\    / /");
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

module.exports.reload = reload;
module.exports.bot = bot;
module.exports.settings = settings;
module.exports.modulesArr = modulesArr;
module.exports.mgrList = mgrList;
module.exports.roundTo = roundTo;
module.exports.msToTime = msToTime;

console.log("Loading modules...");

registeredTriggers = {};
fs.readdir("modules", {withFileTypes: true}, (err, files) => {
  files.forEach(f => {
    if (!f.isDirectory()) {console.log("[!] Caught a file (" + f.name + ") in the modules folder. I won't load this, but shouldn't it be in a subfolder?");}
    else if (f.name.includes(" ")) {console.log("[!] Spaces in module names can cause issues. I won't load " + f.name + ".");}
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
            else if (!require("./modules/" + f.name + "/" + sf.name).triggers || !require("./modules/" + f.name + "/" + sf.name).desc || !require("./modules/" + f.name + "/" + sf.name).events || !require("./modules/" + f.name + "/" + sf.name).perms || !require("./modules/" + f.name + "/" + sf.name).actions || !require("./modules/" + f.name + "/" + sf.name).cooldown && require("./modules/" + f.name + "/" + sf.name).cooldown != 0) {
              console.log("[!] " + sf.name + " (in " + f.name + ") doesn't look like a ZapSquared file (or it could be missing something). I'll ignore it for now.");
            }
            else if (sf.name.includes(" ")) {console.log("[!] Spaces in action set names can cause issues. I won't load " + sf.name + " (in " + f.name + ").");}
            else {
              modulesArr[f.name][sf.name.slice(0, -3)] = reload("./modules/" + f.name + "/" + sf.name);
              modulesArr[f.name][sf.name.slice(0, -3)].triggers.forEach(t => {
                if (!registeredTriggers[t]) {registeredTriggers[t] = [];}
                else {
                  timesCount = registeredTriggers[t].length + 1;
                  console.log("[!] Saw trigger " + t + " " + timesCount + " times (in " + sf.name.slice(0, -3) + ", part of " + f.name + "). I'll only register the first trigger, so this trigger will be ignored.");
                }
                registeredTriggers[t].push({module: f.name, actionSet: sf.name.slice(0, -3)});
              });
              if (modulesArr[f.name][sf.name.slice(0, -3)].events.includes("preReady")) {
                console.log("Action Set: " + sf.name.slice(0, -3) + " (" + f.name + ") | Event: preReady");
                modulesArr[f.name][sf.name.slice(0, -3)].actions(null, "event", "preReady", null, null);
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
  if (!ready) {
    console.log("\nLogged in to Discord as " + bot.user.username + "#" + bot.user.discriminator + " (" + bot.user.id + ")");
    console.log("Connected to " + bot.guilds.size + " guilds and " + bot.users.size + " users");
    managers = settings.get("managers");
    failedMgrLoad = [];
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
    ready = true;
  }
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("ready")) {
        console.log("Action Set: " + ac + " (" + ma + ") | Event: ready");
        modulesArr[ma][ac].actions(null, "event", "ready", null, null);
      }
    });
  });
});

bot.on("connect", id => {
  console.log("Shard " + id + " connecting.");
});

bot.on("shardDisconnect", (err, id) => {
  console.log("Shard " + id + " disconnected.");
});

bot.on("shardPreReady", id => {
  console.log("Shard " + id + " pre-ready.");
});

bot.on("shardReady", id => {
  console.log("Shard " + id + " ready.");
});

bot.on("shardResume", id => {
  console.log("Shard " + id + " resumed.");
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
      console.log("Action Set: " + actionSet + " (" + module + ") | Command: " + cmd + " | User: " + msg.author.username + "#" + msg.author.discriminator + " (" + msg.author.id + ")" + `${!msg.member ? "" : " | Guild: " + msg.channel.guild.name + " (" + msg.channel.guild.id + ")"}`);
      perms = action.perms;
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
      if (permsNeeded.includes("managerOnly") && !settings.get("managers").includes(msg.author.id)) {permsMissing.push("managerOnly");}
      if (permsNeeded.includes("dmOnly") && msg.member) {permsMissing.push("dmOnly");}
      else if (permsNeeded.length > 0 && !msg.member) {permsMissing.push("guildOnly");}
      else if (permsNeeded.length > 0 && msg.member) {
        permsNeeded.forEach(pn => {
          if (pn != "managerOnly" && pn != "guildOnly" && !msg.member.permission.has(pn)) {permsMissing.push(pn);}
        });
      }
      if (permsMissing.length == 1) {str = "permission";}
      else {str = "permissions";}
      if (permsMissing.includes("managerOnly") && !settings.get("managers").includes(msg.author.id)) {
        msg.channel.createMessage("<:cross:621336829601382421> | You need to be a **Manager** to use that.");
      }
      else if (permsMissing.length > 0 && !settings.get("managers").includes(msg.author.id) || permsMissing.includes("dmOnly") || permsMissing.includes("guildOnly")) {
        msg.channel.createMessage("<:cross:621336829601382421> | You are missing the " + permsMissing.map(pm => "`" + pm + "`").join(", ") + " " + str + ".");
        if ((permsMissing.includes("dmOnly") || permsMissing.includes("guildOnly")) && settings.get("managers").includes(msg.author.id)) {
          msg.channel.createMessage("<:cross:621336829601382421> | Could not bypass missing `" + permsMissing[0] + "` permission as this could potentially cause a crash.");
        }
      }
      else {
        if (permsMissing.length > 0 && settings.get("managers").includes(msg.author.id)) {
          msg.channel.createMessage("<:orange:697688190219452496> | You bypassed the permission check for " + str + ": " + permsMissing.map(pm => "`" + pm + "`").join(", "));
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
          calc = roundTo((cooldowns[msg.author.id].find(c => c.module == module && c.actionSet == actionSet).expires - new Date().getTime()) / 1000, 1);
          msg.channel.createMessage("<:cross:621336829601382421> | This command is on cooldown for another **" + calc + "** seconds.");
        }
      }
    }
  }
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("messageCreate")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: messageCreate | User: " + msg.author.username + "#" + msg.author.discriminator + " (" + msg.author.id + ")" + `${!msg.member ? "" : " | Guild: " + msg.channel.guild.name + " (" + msg.channel.guild.id + ")"}`);
        modulesArr[ma][ac].actions(`${msg.member ? "guild" : "dm"}`, "event", "messageCreate", null, msg);
      }
    });
  });
});

bot.on("channelCreate", channel => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("channelCreate")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: channelCreate | Guild: " + channel.guild.name + " (" + channel.guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "channelCreate", null, channel);
      }
    });
  });
});

bot.on("channelDelete", channel => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("channelDelete")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: channelDelete | Guild: " + channel.guild.name + " (" + channel.guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "channelDelete", null, channel);
      }
    });
  });
});

bot.on("channelPinUpdate", (channel, timestamp, oldTimestamp) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("channelPinUpdate")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: channelPinUpdate | Guild: " + channel.guild.name + " (" + channel.guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "channelPinUpdate", null, {channel: channel, timestamp: timestamp, oldTimestamp: oldTimestamp});
      }
    });
  });
});

bot.on("channelUpdate", (channel, oldChannel) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("channelUpdate")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: channelUpdate | Guild: " + channel.guild.name + " (" + channel.guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "channelUpdate", null, {channel: channel, oldChannel: oldChannel});
      }
    });
  });
});

bot.on("guildAvailable", guild => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildAvailable")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildAvailable | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildAvailable", null, guild);
      }
    });
  });
});

bot.on("guildBanAdd", (guild, user) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildBanAdd")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildBanAdd | User: " + user.username + "#" + user.discriminator + " (" + user.id + ") | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildBanAdd", null, {guild: guild, user: user});
      }
    });
  });
});

bot.on("guildBanRemove", (guild, user) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildBanRemove")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildBanRemove | User: " + user.username + "#" + user.discriminator + " (" + user.id + ") | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildBanRemove", null, {guild: guild, user: user});
      }
    });
  });
});

bot.on("guildCreate", guild => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildCreate")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildCreate | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildCreate", null, guild);
      }
    });
  });
});

bot.on("guildDelete", guild => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildDelete")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildDelete | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildDelete", null, guild);
      }
    });
  });
});

bot.on("guildEmojisUpdate", (guild, emojis, oldEmojis) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildEmojisUpdate")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildEmojisUpdate | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildEmojisUpdate", null, {guild: guild, emojis: emojis, oldEmojis: oldEmojis});
      }
    });
  });
});

bot.on("guildMemberAdd", (guild, member) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildMemberAdd")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildMemberAdd | User: " + member.username + "#" + member.discriminator + " (" + member.id + ") | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildMemberAdd", null, {guild: guild, member: member});
      }
    });
  });
});

bot.on("guildMemberChunk", (guild, members) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildMemberChunk")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildMemberChunk | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildMemberChunk", null, {guild: guild, members: members});
      }
    });
  });
});

bot.on("guildMemberRemove", (guild, member) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildMemberRemove")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildMemberRemove | User: " + `${member.username ? member.username + "#" + member.discriminator : "?"}` + " (" + member.id + ") | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildMemberRemove", null, {guild: guild, member: member});
      }
    });
  });
});

bot.on("guildMemberUpdate", (guild, member, oldMember) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildMemberUpdate")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildMemberUpdate | User: " + member.username + "#" + member.discriminator + " (" + member.id + ") | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildMemberUpdate", null, {guild: guild, member: member, oldMember: oldMember});
      }
    });
  });
});

bot.on("guildRoleCreate", (guild, role) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildRoleCreate")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildRoleCreate | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildRoleCreate", null, {guild: guild, role: role});
      }
    });
  });
});

bot.on("guildRoleDelete", (guild, role) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildRoleDelete")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildRoleDelete | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildRoleDelete", null, {guild: guild, role: role});
      }
    });
  });
});

bot.on("guildRoleUpdate", (guild, role, oldRole) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildRoleUpdate")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildRoleUpdate | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildRoleUpdate", null, {guild: guild, role: role, oldRole: oldRole});
      }
    });
  });
});

bot.on("guildUnavailable", guild => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildUnavailable")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildUnavailable | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildUnavailable", null, guild);
      }
    });
  });
});

bot.on("guildUpdate", (guild, oldGuild) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("guildUpdate")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: guildUpdate | Guild: " + guild.name + " (" + guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "guildUpdate", null, {guild: guild, oldGuild: oldGuild});
      }
    });
  });
});

bot.on("messageDelete", msg => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("messageDelete")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: messageDelete | User: " + msg.author.username + "#" + msg.author.discriminator + " (" + msg.author.id + ") | Guild: " + msg.channel.guild.name + " (" + msg.channel.guild.id + ")");
        modulesArr[ma][ac].actions(`${msg.channel.type == 1 ? "dm" : "guild"}`, "event", "messageDelete", null, msg);
      }
    });
  });
});

bot.on("messageDelete", msg => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("messageDelete")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: messageDelete | User: " + msg.author.username + "#" + msg.author.discriminator + " (" + msg.author.id + ") | Guild: " + msg.channel.guild.name + " (" + msg.channel.guild.id + ")");
        modulesArr[ma][ac].actions(`${msg.channel.type == 1 ? "dm" : "guild"}`, "event", "messageDelete", null, msg);
      }
    });
  });
});

bot.on("messageDeleteBulk", msgs => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("messageDeleteBulk")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: messageDeleteBulk | Guild: " + msg.channel.guild.name + " (" + msg.channel.guild.id + ")");
        modulesArr[ma][ac].actions(`${msgs[0].channel.type == 1 ? "dm" : "guild"}`, "event", "messageDeleteBulk", null, msgs);
      }
    });
  });
});

bot.on("messageReactionAdd", (msg, emoji, userID) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("messageReactionAdd")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: messageReactionAdd | Guild: " + msg.channel.guild.name + " (" + msg.channel.guild.id + ")");
        modulesArr[ma][ac].actions(`${msg.channel.type == 1 ? "dm" : "guild"}`, "event", "messageReactionAdd", null, {msg: msg, emoji: emoji, userID: userID});
      }
    });
  });
});

bot.on("messageReactionRemove", (msg, emoji, userID) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("messageReactionRemove")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: messageReactionRemove | Guild: " + msg.channel.guild.name + " (" + msg.channel.guild.id + ")");
        modulesArr[ma][ac].actions(`${msg.channel.type == 1 ? "dm" : "guild"}`, "event", "messageReactionRemove", null, {msg: msg, emoji: emoji, userID: userID});
      }
    });
  });
});

bot.on("messageReactionRemoveAll", msg => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("messageReactionRemoveAll")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: messageReactionRemoveAll | Guild: " + msg.channel.guild.name + " (" + msg.channel.guild.id + ")");
        modulesArr[ma][ac].actions(`${msg.channel.type == 1 ? "dm" : "guild"}`, "event", "messageReactionRemoveAll", null, msg);
      }
    });
  });
});

bot.on("messageUpdate", (msg, oldMsg) => {
  if (oldMsg != oldMsg) {
    console.log("Discarded messageUpdate event because oldMsg is null.");
  }
  else {
    Object.keys(modulesArr).forEach(ma => {
      Object.keys(modulesArr[ma]).forEach(ac => {
        if (modulesArr[ma][ac].events.includes("messageUpdate")) {
          console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: messageUpdate | User: " + msg.author.username + "#" + msg.author.discriminator + " (" + msg.author.id + ") | Guild: " + msg.channel.guild.name + " (" + msg.channel.guild.id + ")");
          modulesArr[ma][ac].actions(`${msg.member == 1 ? "guild" : "dm"}`, "event", "messageUpdate", null, {msg: msg, oldMsg: oldMsg});
        }
      });
    });
  }
});

bot.on("messageReactionRemoveAll", msg => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("messageReactionRemoveAll")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: messageReactionRemoveAll | Guild: " + msg.channel.guild.name + " (" + msg.channel.guild.id + ")");
        modulesArr[ma][ac].actions(`${msg.channel.type == 1 ? "dm" : "guild"}`, "event", "messageReactionRemoveAll", null, msg);
      }
    });
  });
});

bot.on("typingStart", (channel, user) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("typingStart")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: typingStart | Guild: " + channel.guild.name + " (" + channel.guild.id + ")");
        modulesArr[ma][ac].actions(`${channel.type == 1 ? "dm" : "guild"}`, "event", "typingStart", null, {channel: channel, user: user});
      }
    });
  });
});

bot.on("unavailableGuildCreate", guild => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("unavailableGuildCreate")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: unavailableGuildCreate");
        modulesArr[ma][ac].actions("guild", "event", "unavailableGuildCreate", null, guild);
      }
    });
  });
});

bot.on("voiceChannelJoin", (member, newChannel) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("voiceChannelJoin")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: voiceChannelJoin | User: " + member.username + "#" + member.discriminator + " (" + member.id + ") | Guild: " + member.guild.name + " (" + member.guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "voiceChannelJoin", null, {member: member, newChannel: newChannel});
      }
    });
  });
});

bot.on("voiceChannelLeave", (member, oldChannel) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("voiceChannelLeave")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: voiceChannelLeave | User: " + member.username + "#" + member.discriminator + " (" + member.id + ") | Guild: " + member.guild.name + " (" + member.guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "voiceChannelLeave", null, {member: member, oldChannel: oldChannel});
      }
    });
  });
});

bot.on("voiceChannelSwitch", (member, newChannel, oldChannel) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("voiceChannelSwitch")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: voiceChannelSwitch | User: " + member.username + "#" + member.discriminator + " (" + member.id + ") | Guild: " + member.guild.name + " (" + member.guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "voiceChannelSwitch", null, {member: member, newChannel: newChannel, oldChannel: oldChannel});
      }
    });
  });
});

bot.on("voiceStateUpdate", (member, oldState) => {
  Object.keys(modulesArr).forEach(ma => {
    Object.keys(modulesArr[ma]).forEach(ac => {
      if (modulesArr[ma][ac].events.includes("voiceStateUpdate")) {
        console.log("Action Set: " + ac.slice(0, -3) + " (" + ma + ") | Event: voiceStateUpdate | User: " + member.username + "#" + member.discriminator + " (" + member.id + ") | Guild: " + member.guild.name + " (" + member.guild.id + ")");
        modulesArr[ma][ac].actions("guild", "event", "voiceStateUpdate", null, {member: member, oldState: oldState});
      }
    });
  });
});

bot.connect();
