const chalk = require('chalk');
const moment = require('moment');
const Discord = require('discord.js');
const config = require(`../config.json`);

Number.prototype.format = function(n, x) {
  var re = '(\\d)(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
  return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$1,');
};

exports.run = function(client, message, args, user, guild, title){

  if(!user) return message.reply(`Please start your profile in <#${guild.channel_setup}>`)
  if(!guild) return message.reply(`Please tell an admin to re-invite the bot to the server.`)

  let title_text = ``;
  if(title) title_text = title.title_text;
  console.log(title);

  let now = moment().format('x'); // Current UNIX Timestamp
  let day_millis = 1000 * 60 * 60 * 24;
  let hour_millis = 1000 * 60 * 60;
  let minute_millis = 1000 * 60;

  let check_channel = true;
  if(user.user_discord == config.botowner) check_channel = false;
  if(guild.channel_main != message.channel.id && check_channel){
    message.delete();
    return message.reply(`Please only use this command in <#${guild.channel_main}>`).then(msg => msg.delete(5000));
  }

  if(now - user.ts_profile < 30 * 1000 && check_channel) {
    message.delete();
    return message.reply(`Please wait another **${Math.ceil(((now - (parseInt(user.ts_profile) + (30*1000)))*-1)/1000)} seconds** before viewing your profile again.`).then(msg => msg.delete(5000));
  }

  let sql_count_users = `SELECT count(*) AS count FROM users`;
  client.db.get(sql_count_users, (err, total) => {
    if(err) return console.error(`profile.js select_count ${err.message}`);
    let total_users = total.count;
    if(!guild) return message.reply(`Please re-invite the bot`);
    if(!user) return message.reply(`Please start your account`);

    // Function to get a users profile colour
    // let embed_colour = '#' + Math.floor(Math.random()*16777215).toString(16);
    let embed_colour = '#' + user.user_colour;
    if(user.user_colour == 'RAND') embed_colour = '#' + Math.floor(Math.random()*16777215).toString(16);

    // Build embed field
    let user_array = [];
    let premium_array = [];
    let level_array = [];
    let reputation_array = [];
    let crate_array = [];
    let counter_array = [];

    let total_users_number_length = total_users.toString().length;
    let user_account_number = '';
    for(let i=1; i<total_users_number_length; i++){
      user_account_number += '0';
    }

    // Format username
    let display_name = `${title_text != `` ? `[${title_text}]` : ``} ${message.author.username}`;

    // Get users Premium
    if(user.premium_status > 0){
      // User is a premium user
      if(user.premium_status == 2){
        // Lifetime premium
        premium_array.push(`Premium Status: **Lifetime**`);
      } else {
        let premium_time_difference = now - parseInt(user.premium_time);
        let premium_time_display = premium_time_difference * -1;
        let premium_time_format = '';
        let premium_days = '00';
        let premium_hours = '00';
        let premium_minutes = '00';
        let premium_seconds = '00';

        // How many days?
        if(premium_time_display / day_millis >= 1){
          premium_days += Math.floor(premium_time_display/day_millis);
          premium_time_display = premium_time_display - (day_millis * premium_days);
        }
        // How many hours?
        if(premium_time_display / hour_millis >= 1){
          premium_hours += Math.floor(premium_time_display/hour_millis);
          premium_time_display = premium_time_display - (hour_millis * premium_hours);
        }
        // How many minutes?
        if(premium_time_display / minute_millis >= 1){
          premium_minutes += Math.floor(premium_time_display / minute_millis);
          premium_time_display = premium_time_display - (minute_millis * premium_minutes);
        }
        // How many seconds?
        if(premium_time_display > 0){
          premium_seconds += Math.floor(premium_time_display/1000);
        }
        premium_array.push(`Premium Status: **${premium_days.slice(-2)}:${premium_hours.slice(-2)}:${premium_minutes.slice(-2)}:${premium_seconds.slice(-2)}**`);
      }
    } else {
      // User is not premium
      premium_array.push(`Premium Status: **NaN**`);
    }

    // Get users premium coins
    premium_array.push(`<${config.premium_token}> Premium Coins: **${user.user_premium_coins.format(0)}**`)

    // Get users total donated
    premium_array.push(`Total Donated: **£${user.user_amount_donated.format(2)}**`)

    // Get users prestige level
    level_array.push(`Prestige Level: **${user.prestige_level}**`);

    // Show level and experience
    let next_level_requirement = Math.floor(Math.pow(user.user_level+1, 1.8)*100);
    level_array.push(`<${config.chatting_badge}> Chatting Level: **${user.user_level.format(0)} ${user.prestige_level == 5 ? '' : ` / ${(user.prestige_level+1)*20}`}** *${(next_level_requirement - user.user_experience).format(0)} XP Remaining*`)

    // Show gathering levels and experience
    let next_level_requirement_fishing = Math.floor(Math.pow(user.experience_fishing_level+1, 1.8)*100);
    level_array.push(`<${config.fishing_token}> Fishing Level: **${user.experience_fishing_level.format(0)} ${user.prestige_level == 5 ? '' : `/ ${(user.prestige_level+1)*20}`}** *${(next_level_requirement_fishing - user.experience_fishing).format(0)} XP Remaining*`)
    let next_level_requirement_mining = Math.floor(Math.pow(user.experience_mining_level+1, 1.8)*100);
    level_array.push(`<${config.mining_token}> Mining Level: **${user.experience_mining_level.format(0)} ${user.prestige_level == 5 ? '' : ` / ${(user.prestige_level+1)*20}`}** *${(next_level_requirement_mining - user.experience_mining).format(0)} XP Remaining*`)
    let next_level_requirement_woodcutting = Math.floor(Math.pow(user.experience_woodcutting_level+1, 1.8)*100);
    level_array.push(`<${config.woodcutting_token}> Woodcutting Level: **${user.experience_woodcutting_level.format(0)} ${user.prestige_level == 5 ? '' : `/ ${(user.prestige_level+1)*20}`}** *${(next_level_requirement_woodcutting - user.experience_woodcutting).format(0)} XP Remaining*`)

    // Get users account number
    user_array.push(`Account Number: **#${(user_account_number + user.user_id).slice(((total_users_number_length-1)*-1))}**`);

    // Get users money
    user_array.push(`<${config.banker}> Bank: **$${user.user_money.format(2)}**`);

    // Get users diamonds
    user_array.push(`<${config.diamond}> Diamonds : **${user.user_diamonds.format(0)}**`);

    // Get users CPS
    user_array.push(`BPS: **${user.user_cps.format(1)}** *(bank per second)*`)

    // Get users money spent
    user_array.push(`Money Spent: **$${user.counter_money_spent.format(2)}**`);

    // Get account length
    let account_length_display = (parseInt(user.user_start_ts) - now) * -1;
    let account_length_days = '00';
    let account_length_hours = '00';
    let account_length_minutes = '00';
    let account_length_seconds = '00';

    // How many days?
    if(account_length_display / day_millis >= 1){
      account_length_days += Math.floor(account_length_display/day_millis);
      account_length_display = account_length_display - (day_millis * account_length_days);
    }
    // How many hours?
    if(account_length_display / hour_millis >= 1){
      account_length_hours += Math.floor(account_length_display/hour_millis);
      account_length_display = account_length_display - (hour_millis * account_length_hours);
    }
    // How many minutes?
    if(account_length_display / minute_millis >= 1){
      account_length_minutes += Math.floor(account_length_display / minute_millis);
      account_length_display = account_length_display - (minute_millis * account_length_minutes);
    }
    // How many seconds?
    if(account_length_display > 0){
      account_length_seconds += Math.floor(account_length_display/1000);
    }
    user_array.push(`Account Length: **${account_length_days.slice(-2)}:${account_length_hours.slice(-2)}:${account_length_minutes.slice(-2)}:${account_length_seconds.slice(-2)}**\n`);

    // Get users Reputation
    let reputation_hours = '00';
    let reputation_minutes = '00';
    let reputation_seconds = '00';
    reputation_array.push(`Reputation Received: **${user.reputation_total.format(0)}**`);
    reputation_array.push(`Reputation Given: **${user.reputation_given.format(0)}**`);
    if((user.reputation_given_today < 2 && user.premium_status > 0) || (user.reputation_given_today < 1)){
      reputation_array.push(`Next Reputation: **Now (${user.reputation_given_today} / ${user.premium_status == 0 ? '1' : '2'})**`);
    } else {
      let reputation_24_added = parseInt(user.ts_reputation) + day_millis;
      let reputation_time_display = (now - reputation_24_added) * -1;
      // How many hours?
      if(reputation_time_display / hour_millis >= 1){
        reputation_hours += Math.floor(reputation_time_display/hour_millis);
        reputation_time_display = reputation_time_display - (hour_millis * reputation_hours);
      }
      // How many minutes?
      if(reputation_time_display / minute_millis >= 1){
        reputation_minutes += Math.floor(reputation_time_display / minute_millis);
        reputation_time_display = reputation_time_display - (minute_millis * reputation_minutes);
      }
      // How many seconds?
      if(reputation_time_display > 0){
        reputation_seconds += Math.floor(reputation_time_display/1000);
      }
      reputation_array.push(`Next Reputation: **${reputation_hours.slice(-2)}:${reputation_minutes.slice(-2)}:${reputation_seconds.slice(-2)}**`);
    }

    // How many rare crates?
    crate_array.push(`Rare Crates: **${user.crate_rare}**`);

    // Get users messages sent
    let counter_message_display = (now - (parseInt(user.ts_message) + minute_millis)) * -1;
    let counter_message_seconds = '';
    if(counter_message_display > 0){
      counter_message_seconds += Math.floor(counter_message_display/1000);
    } else {
      counter_message_seconds = '60';
    }
    counter_array.push(`Messages: **${user.counter_messages.format(0)}** (${counter_message_seconds}s)`)

    // Get users commands used
    let counter_commands_display = (now - (parseInt(user.ts_commands) + minute_millis)) * -1;
    let counter_commands_seconds = '';
    if(counter_commands_display > 0){
      counter_commands_seconds += Math.floor(counter_commands_display/1000);
    } else {
      counter_commands_seconds = '60';
    }
    counter_array.push(`Commands: **${(user.counter_commands + (counter_commands_display <= 0 ? 1 : 0)).format(0)}** (${counter_commands_seconds}s)`)

    // Get users fish caught
    let counter_fish_caught_display = (now - (parseInt(user.ts_fish) + (minute_millis * 3))) * -1;
    let counter_fish_caught_minutes = `00`;
    let counter_fish_caught_seconds = '00';

    if(counter_fish_caught_display / minute_millis >= 1){
      counter_fish_caught_minutes += Math.floor(counter_fish_caught_display / minute_millis);
      counter_fish_caught_display -= (minute_millis * counter_fish_caught_minutes);
    }
    // How many seconds?
    if(counter_fish_caught_display > 0){
      counter_fish_caught_seconds += Math.ceil(counter_fish_caught_display/1000);
    }
    counter_array.push(`Fish Caught: **${user.counter_fish_caught.format(0)}** *${counter_fish_caught_minutes.slice(-2)}:${counter_fish_caught_seconds.slice(-2)}*`)

    // Get users fish attempts
    counter_array.push(`Fishing Attempts: **${(user.counter_fishing).format(0)}**`)

    // Get users ore mined
    let counter_mining_display = (now - (parseInt(user.ts_mine) + (minute_millis * 3))) * -1;
    let counter_mine_minutes = `00`;
    let counter_mine_seconds = '00';

    if(counter_mining_display / minute_millis >= 1){
      counter_mine_minutes += Math.floor(counter_mining_display / minute_millis);
      counter_mining_display -= (minute_millis * counter_mine_minutes);
    }
    // How many seconds?
    if(counter_mining_display > 0){
      counter_mine_seconds += Math.ceil(counter_mining_display/1000);
    }
    counter_array.push(`Ores Mined: **${user.counter_mining_ore.format(0)}** *${counter_mine_minutes.slice(-2)}:${counter_mine_seconds.slice(-2)}*`)

    // Get users fish attempts
    counter_array.push(`Mining Attempts: **${(user.counter_mining).format(0)}**`)


    // Build embed
    let embed = new Discord.RichEmbed()
      .setColor(embed_colour)
      .setTitle(`Profile of ${display_name}`)
      .setThumbnail(message.author.avatarURL)
      .addField(`Premium`, premium_array.join('\n'))
      .addField(`User`, user_array.join(`\n`))
      .addField(`Levels`, level_array.join(`\n`))
      .addField(`Reputation`, reputation_array.join(`\n`))
      .addField(`Crates`, crate_array.join(`\n`))
      .addField(`Counters`, counter_array.join(`\n`))
      .setTimestamp();
    message.channel.send(embed);
    message.delete();

    let sql_update_profile_timer = `UPDATE users set ts_profile = ${now} WHERE user_discord = ${user.user_discord}`;
    client.db.run(sql_update_profile_timer, (err) => {
      if(err) return console.error(`profile.js sql_update_profile_timer ${err.message}`);
    });

    if(now - user.ts_commands > 60 * 1000){
      let sql_update_command_counter = `UPDATE users SET counter_commands = ${user.counter_commands+1}, ts_commands = ${now} WHERE user_discord = ${user.user_discord}`;
      client.db.run(sql_update_command_counter, (err) => {
        if(err) return console.error(`profile.js sql_update_command_counter ${err.message}`);
      })
    }
  })
};

exports.conf = {
  aliases: [],
  permLevel: 0
};

exports.help = {
  name: "profile",
  description: "Displays your profile",
  usage: "profile"
}
