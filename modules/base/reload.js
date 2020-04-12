module.exports.triggers = ["reload"];
module.exports.desc = "Reload a loaded module.";
module.exports.cooldown = 0;
module.exports.events = [];
module.exports.perms = ["managerOnly"];
module.exports.actions = function (source, type, trigger, body, obj) {
  reload = require("../../main.js").reload;
  modulesArr = require("../../main.js").modulesArr;
  if (!body || body.split(" ").length > 2) {return obj.channel.createMessage("<:cross:621336829601382421> | Please specify the module name, optionally followed by the action set name.");}
  var module = body.split(" ")[0];
  var actionSet;
  if (body.split(" ").length == 2) {actionSet = body.split(" ")[1];}
  if (!modulesArr[module]) {return obj.channel.createMessage("<:cross:621336829601382421> | That module does not exist. This is case-sensitive.");}
  if (actionSet && !modulesArr[module][actionSet]) {return obj.channel.createMessage("<:cross:621336829601382421> | That action set does not exist in that module. This is case-sensitive.");}
  if (!actionSet) {
    Object.keys(modulesArr[module]).forEach(ac => {
      modulesArr[module][ac] = reload("./modules/" + module + "/" + ac + ".js");
      console.log("Successfully reloaded " + ac + " in " + module + ".")
    });
    return obj.channel.createMessage("<:tick:621336801189167115> | Reloaded " + Object.keys(modulesArr[module]).map(set => {return "`" + set + "`"}).join(", ") + " in `" + module + "`.");
  }
  else {
    modulesArr[module][actionSet] = reload("./modules/" + module + "/" + actionSet + ".js");
    console.log("Successfully reloaded " + actionSet + " in " + module + ".")
    return obj.channel.createMessage("<:tick:621336801189167115> | Reloaded `" + actionSet + "` in `" + module + "`.");
  }
}
