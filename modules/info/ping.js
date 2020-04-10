module.exports.triggers = ["ping", "pong"];
module.exports.desc = "Pong!";
module.exports.cooldown = 3;
module.exports.events = [];
// command or event was triggered in guild: all perms will be respected. use "dmOnly" to make the command only work in DM.
// command or event was triggered in DM: if array size is more than 0 (if it requires any permission at all), the command won't work unless the perm is "dmOnly".
// special perms: "guildOnly" (rarely used, adding any permission would cause the command/event to be guild only), "dmOnly", "managerOnly" (if the command/event can only be used by managers)
module.exports.perms = [];
module.exports.actions = function (source, type, trigger, body, obj) {
  if (type == "command") {
    if (trigger == "ping" || trigger == "pong") {
      if (source == "guild") {api = obj.member.guild.shard.latency.toString();}
      else {api = -1;}
      obj.channel.createMessage("<a:loading:655486686008049707> | Pinging...").then(m => {
        botPing = new Date() - m.timestamp;
        if (botPing < 0) {botPing = botPing * -1}
        if (botPing < 100) {bp = "<:green:697688710275399720> | Msg RT: **" + botPing + "**ms";}
        else if (botPing < 200) {bp = "<:orange:697688190219452496> | Msg RT: **" + botPing + "**ms";}
        else {bp = "<:red:697688970317791254> | Msg RT: **" + botPing + "**ms";}
        if (api < 0) {ap = "<:red:697688970317791254> | API: **N/A**";}
        else if (api < 100) {ap = "<:green:697688710275399720> | API: **" + api + "**ms";}
        else if (api < 200) {ap = "<:orange:697688190219452496> | API: **" + api + "**ms";}
        else {ap = "<:red:697688970317791254> | API: **" + api + "**ms";}
        m.edit(ap + "\n" + bp);
      });
    }
  }
}
