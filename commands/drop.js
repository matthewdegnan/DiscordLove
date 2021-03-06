const chalk = require('chalk');
const moment = require('moment');
const Discord = require('discord.js');
const config = require(`../config.json`);

exports.run = function(client, message, args){
  let sql = `DROP TABLE users`;
  client.db.run(sql, (err) => {
    if(err) return console.error(err.message);
    message.channel.send(`Table \`users\` has been deleted`)
  });
};

exports.conf = {
  aliases: ['d'],
  permLevel: 4
};

exports.help = {
  name: "drop",
  description: "Deletes Table",
  usage: "drop"
}
