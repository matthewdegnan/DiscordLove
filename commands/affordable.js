const chalk = require('chalk');
const moment = require('moment');
const Discord = require('discord.js');
const config = require(`../config.json`);

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./utils/users.db', sqlite3.OPEN_READWRITE, (err) => {
  if(err){
    console.error(err.message);
  }
  console.log(`Connected to DB - Buy`);
});

Number.prototype.format = function(n, x) {
  var re = '(\\d)(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
  return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$1,');
};

exports.run = function(client, message, args){
  let now = moment().format('x');
  let sql1 = `SELECT * FROM users WHERE id = ${message.author.id}`;
  db.get(sql1, (err, row) => {
    if(err) return console.error(err.message);
    if(!row) return message.reply(`You need a profile first`);
    let sql2 = `SELECT * FROM users WHERE cost <= ${row.money} AND owner != ${row.id} AND id != ${row.id} ORDER BY cost DESC LIMIT 10`;
    db.all(sql2, (err, rows) => {
      if(err) return console.error(err.message);
      let affordable_users = [];
      let affordable_count = 0;
      rows.forEach((user_info) => {
        affordable_count++;
        if(now - parseInt(user_info.lastpurchase) < 300 * 1000){
          let rowUser = message.guild.members.get(user_info.id);
          if(rowUser){
            if(rowUser.nickname != null){
              affordable_users.push(`**${rowUser.nickname}** - **\$${user_info.cost.format(0)}** <:cooldown:505752316649930774>`);
            } else {
              affordable_users.push(`**${rowUser.user.username}** - **\$${user_info.cost.format(0)}** <:cooldown:505752316649930774>`);
            }
          }
          if(!rowUser) affordable_users.push(`<${user_info.id}> - **\$${user_info.cost.format(0)}** <:cooldown:505752316649930774>`);
        } else {
          // Purchasable
          let rowUser = message.guild.members.get(user_info.id);
          if(rowUser){
            if(rowUser.nickname != null){
              affordable_users.push(`**${rowUser.nickname}** - **\$${user_info.cost.format(0)}**`);
            } else {
              affordable_users.push(`**${rowUser.user.username}** - **\$${user_info.cost.format(0)}**`);
            }
          }
          if(!rowUser) affordable_users.push(`<${user_info.id}> - **\$${user_info.cost.format(0)}**`);
        }
      });
      if(affordable_count == 0) return message.reply(`You cannot afford anybody at the moment`);
      let embed = new Discord.RichEmbed()
        .setColor('#fa1201')
        .addField(`Top 10 Users you can afford`, `${affordable_users.join('\n')}`)
        .setFooter(`You currently have \$${(row.money).format(0)}`);
      message.channel.send(embed);
    });
  });
};

exports.conf = {
  aliases: ['icanbuy'],
  permLevel: 0
};

exports.help = {
  name: "affordable",
  description: "Displays the users you can currently afford",
  usage: "affordable"
}
