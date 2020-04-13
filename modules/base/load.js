module.exports.triggers = ["load"];
module.exports.desc = "Load a module.";
module.exports.cooldown = 0;
module.exports.events = [];
module.exports.perms = ["managerOnly"];
module.exports.actions = function (source, type, trigger, body, obj) {
  fs = require("../../main.js").fs;
  reload = require("../../main.js").reload;
  modulesArr = require("../../main.js").modulesArr;
  registeredTriggers = require("../../main.js").registeredTriggers;
  if (!body || body.split(" ").length > 2) {return obj.channel.createMessage("<:cross:621336829601382421> | Please specify the module name, optionally followed by the action set name.");}
  var module = body.split(" ")[0];
  var actionSet;
  if (body.split(" ").length == 2) {actionSet = body.split(" ")[1];}
  if (actionSet && modulesArr[module][actionSet]) {return obj.channel.createMessage("<:cross:621336829601382421> | That action set is already loaded. Try reloading it instead.");}
  if (!actionSet) {
    if (modulesArr[module]) {
      loadedActionSets = [];
      failedActionSets = [];
      multiTrigger = [];
      preReadyWarn = [];
      // already loaded module, so iterate through files to check for any ACs that haven't been loaded
      fs.readdir("./modules/" + module, {withFileTypes: true}, (err, subfiles) => {
        if (err) {
          console.log("[!] An error occurred while reading the " + module + " folder:\n" + err);
          return obj.channel.createMessage("<:cross:621336829601382421> | An error occurred while reading the " + module + " folder. Check your console for more information.");
        }
        else {
          subfiles.forEach(sf => {
            if (!Object.keys(modulesArr[module]).map(fileName => fileName + ".js").includes(sf.name)) {
              if (!sf.isFile()) {failedActionSets.push({fileName: sf.name, reason: "Non-file"});}
              else {
                nameSplit = sf.name.split(".");
                ext = nameSplit[nameSplit.length - 1];
                if (ext != "js") {
                  failedActionSets.push({fileName: sf.name, reason: "Non-JS file"});
                }
                else if (!require("../" + module + "/" + sf.name).triggers || !require("../" + module + "/" + sf.name).desc || !require("../" + module + "/" + sf.name).events || !require("../" + module + "/"+ sf.name).perms || !require("../" + module + "/" + sf.name).actions || !require("../" + module + "/" + sf.name).cooldown && require("../" + module + "/" + sf.name).cooldown != 0) {
                  failedActionSets.push({fileName: sf.name, reason: "Not ZapSquared file (or related)"});
                }
                else if (sf.name.includes(" ")) {
                  failedActionSets.push({fileName: sf.name, reason: "Space in name"});
                }
                else {
                  modulesArr[module][sf.name.slice(0, -3)] = reload("./modules/" + module + "/" + sf.name);
                  loadedActionSets.push(sf.name.slice(0, -3));
                  modulesArr[module][sf.name.slice(0, -3)].triggers.forEach(t => {
                    if (!registeredTriggers[t]) {registeredTriggers[t] = [];}
                    else {
                      timesCount = registeredTriggers[t].length + 1;
                      multiTrigger.push({fileName: sf.name.slice(0, -3), trigger: t, timesCount: timesCount});
                    }
                    registeredTriggers[t].push({module: module, actionSet: sf.name.slice(0, -3)});
                  });
                  if (modulesArr[module][sf.name.slice(0, -3)].events.includes("preReady")) {
                    preReadyWarn.push(sf.name.slice(0, -3));
                    console.log("Action Set: " + sf.name.slice(0, -3) + " (" + module + ") | Event: preReady");
                    modulesArr[module][sf.name.slice(0, -3)].actions(null, "event", "preReady", null, null);
                  }
                }
              }
            }
          });
          composedMsg = [];
          if (loadedActionSets.length > 0) {
            composedMsg.push("<:tick:621336801189167115> | Loaded " + loadedActionSets.map(las => "`" + las + "`").join(", ") + " successfully.");
          }
          if (failedActionSets.length > 0) {
            composedMsg.push("<:cross:621336829601382421> | Failed to load " + failedActionSets.map(fas => "`" + fas.fileName + " (" + fas.reason + ")`").join(", ") + ".");
          }
          if (multiTrigger.length > 0) {
            composedMsg.push("<:orange:697688190219452496> | Saw triggers " + multiTrigger.map(mt => "`" + mt.trigger + " (in " + mt.fileName + ", " + mt.timesCount + " times now)`").join(", ") + ". Repeated triggers will not get registered.");
          }
          if (preReadyWarn.length > 0) {
            composedMsg.push("<:orange:697688190219452496> | Action sets " + preReadyWarn.map(prw => "`" + prw + "`").join(", ") + " use the preReady event. I've fired the preReady event for these loaded action sets, but this can cause issues. Please restart the bot if you encounter any issues.");
          }
          if (composedMsg.length > 0) {obj.channel.createMessage(composedMsg.join("\n"));}
          else {obj.channel.createMessage("<:cross:621336829601382421> | There's nothing to load.");}
        }
      });
    }
    else {
      loadedActionSets = [];
      failedActionSets = [];
      multiTrigger = [];
      preReadyWarn = [];
      // load all ACs in module
      fs.readdir("./modules/" + module, {withFileTypes: true}, (err, subfiles) => {
        if (err) {
          console.log("[!] An error occurred while reading the " + module + " folder:\n" + err);
          return obj.channel.createMessage("<:cross:621336829601382421> | An error occurred while reading the " + module + " folder. Check your console for more information.");
        }
        else {
          modulesArr[module] = [];
          subfiles.forEach(sf => {
            if (!sf.isFile()) {failedActionSets.push({fileName: sf.name, reason: "Non-file"});}
            else {
              nameSplit = sf.name.split(".");
              ext = nameSplit[nameSplit.length - 1];
              if (ext != "js") {
                failedActionSets.push({fileName: sf.name, reason: "Non-JS file"});
              }
              else if (!require("../" + module + "/" + sf.name).triggers || !require("../" + module + "/" + sf.name).desc || !require("../" + module + "/" + sf.name).events || !require("../" + module + "/"+ sf.name).perms || !require("../" + module + "/" + sf.name).actions || !require("../" + module + "/" + sf.name).cooldown && require("../" + module + "/" + sf.name).cooldown != 0) {
                failedActionSets.push({fileName: sf.name, reason: "Not ZapSquared file (or related)"});
              }
              else if (sf.name.includes(" ")) {
                failedActionSets.push({fileName: sf.name, reason: "Space in name"});
              }
              else {
                modulesArr[module][sf.name.slice(0, -3)] = reload("./modules/" + module + "/" + sf.name);
                loadedActionSets.push(sf.name.slice(0, -3));
                modulesArr[module][sf.name.slice(0, -3)].triggers.forEach(t => {
                  if (!registeredTriggers[t]) {registeredTriggers[t] = [];}
                  else {
                    timesCount = registeredTriggers[t].length + 1;
                    multiTrigger.push({fileName: sf.name.slice(0, -3), trigger: t, timesCount: timesCount});
                  }
                  registeredTriggers[t].push({module: module, actionSet: sf.name.slice(0, -3)});
                });
                if (modulesArr[module][sf.name.slice(0, -3)].events.includes("preReady")) {
                  preReadyWarn.push(sf.name.slice(0, -3));
                  console.log("Action Set: " + sf.name.slice(0, -3) + " (" + module + ") | Event: preReady");
                  modulesArr[module][sf.name.slice(0, -3)].actions(null, "event", "preReady", null, null);
                }
              }
            }
          });
          composedMsg = [];
          if (loadedActionSets.length > 0) {
            composedMsg.push("<:tick:621336801189167115> | Loaded " + loadedActionSets.map(las => "`" + las + "`").join(", ") + " successfully.");
          }
          if (failedActionSets.length > 0) {
            composedMsg.push("<:cross:621336829601382421> | Failed to load " + failedActionSets.map(fas => "`" + fas.fileName + " (" + fas.reason + ")`").join(", ") + ".");
          }
          if (multiTrigger.length > 0) {
            composedMsg.push("<:orange:697688190219452496> | Saw triggers " + multiTrigger.map(mt => "`" + mt.trigger + " (in " + mt.fileName + ", " + mt.timesCount + " times now)`").join(", ") + ". Repeated triggers will not get registered.");
          }
          if (preReadyWarn.length > 0) {
            composedMsg.push("<:orange:697688190219452496> | Action sets " + preReadyWarn.map(prw => "`" + prw + "`").join(", ") + " use the preReady event. I've fired the preReady event for these loaded action sets, but this can cause issues. Please restart the bot if you encounter any issues.");
          }
          if (composedMsg.length > 0) {obj.channel.createMessage(composedMsg.join("\n"));}
          else {obj.channel.createMessage("<:cross:621336829601382421> | There's nothing to load.");}
        }
      });
    }
  }
  else {
    // the action set has been specified, so load it specifically
    stopReason = "";
    multiTrigger = "";
    preReadyWarn = "";
    if (!modulesArr[module]) {modulesArr[module] = [];}
    fs.readdir("./modules/" + module, {withFileTypes: true}, (err, subfiles) => {
      if (err) {
        console.log("[!] An error occurred while reading the " + module + " folder:\n" + err);
        return obj.channel.createMessage("<:cross:621336829601382421> | An error occurred while reading the " + module + " folder. Check your console for more information.");
      }
      else {
        subfiles.forEach(sf => {
          if (actionSet == sf.name.slice(0, -3)) {
            if (!sf.isFile()) {stopReason = "Non-file";}
            else {
              nameSplit = sf.name.split(".");
              ext = nameSplit[nameSplit.length - 1];
              if (ext != "js") {
                stopReason = "Non-JS file";
              }
              else if (!require("../" + module + "/" + sf.name).triggers || !require("../" + module + "/" + sf.name).desc || !require("../" + module + "/" + sf.name).events || !require("../" + module + "/"+ sf.name).perms || !require("../" + module + "/" + sf.name).actions || !require("../" + module + "/" + sf.name).cooldown && require("../" + module + "/" + sf.name).cooldown != 0) {
                stopReason = "Not ZapSquared file (or related)";
              }
              else if (sf.name.includes(" ")) {
                stopReason = "Space in name";
              }
              else {
                modulesArr[module][sf.name.slice(0, -3)] = reload("./modules/" + module + "/" + sf.name);
                modulesArr[module][sf.name.slice(0, -3)].triggers.forEach(t => {
                  if (!registeredTriggers[t]) {registeredTriggers[t] = [];}
                  else {
                    timesCount = registeredTriggers[t].length + 1;
                    multiTrigger.push({fileName: sf.name.slice(0, -3), trigger: t, timesCount: timesCount});
                  }
                  registeredTriggers[t].push({module: module, actionSet: sf.name.slice(0, -3)});
                });
                obj.channel.createMessage("<:orange:697688190219452496> | Saw triggers " + multiTrigger.map(mt => "`" + mt.trigger + " (in " + mt.fileName + ", " + mt.timesCount + " times now)`").join(", ") + ". Repeated triggers will not get registered.");
                if (modulesArr[module][sf.name.slice(0, -3)].events.includes("preReady")) {
                  preReadyWarn = "<:orange:697688190219452496> | Action set `" + actionSet + "` uses the preReady event. I've fired the preReady event for it, but this can cause issues. Please restart the bot if you encounter any issues.";
                  console.log("Action Set: " + sf.name.slice(0, -3) + " (" + module + ") | Event: preReady");
                  modulesArr[module][sf.name.slice(0, -3)].actions(null, "event", "preReady", null, null);
                }
              }
            }
          }
        });
        if (stopReason) {obj.channel.createMessage("<:cross:621336829601382421> | Failed to load `" + actionSet + " (" + stopReason + ")`.");}
        else {
          obj.channel.createMessage("<:tick:621336801189167115> | Loaded `" + actionSet + "` successfully." + `${multiTrigger ? "\n" + multiTrigger : ""}${preReadyWarn ? "\n" + preReadyWarn : ""}`);
        }
      }
    });
  }
}
