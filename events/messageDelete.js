const Discord = require('discord.js');
const config = require(`../config.json`);
const chalk = require('chalk');
const moment = require('moment');

const log = (msg) => {
  console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${msg}`);
}

module.exports = message => {
  let guild = message.guild;
  let client = message.client;

  if(message.content.length > 1){  
    embed = new Discord.RichEmbed()
      .setColor("#ff0000")
      .setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
      .addField(`\u200b`, `${message.content}`)
      .setFooter(`Message Deleted`)
      .setTimestamp();
    client.channels.get(config.delete).send({embed: embed});
  }
}
