const { play } = require("../include/play");
const { YOUTUBE_API_KEY } = require("../config");
const ytdl = require("ytdl-core");
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: "play",
  description: "Plays audio from YouTube",
  async execute(message, args) {
    const { channel } = message.member.voice;

    if (!args.length) return message.reply("Usage: /play <YouTube URL | Video Name>").catch(console.error);
    if (!channel) return message.reply("You need to join a voice channel first!").catch(console.error);

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT"))
      return message.reply("Cannot connect to voice channel, missing permissions");
    if (!permissions.has("SPEAK"))
      return message.reply("I cannot speak in this voice channel, make sure I have the proper permissions!");

    const search = args.join(" ");
    const videoPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
    const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi;
    const url = args[0];
    const urlValid = videoPattern.test(args[0]);

    // Start the playlist if playlist url was provided
    if (!videoPattern.test(args[0]) && playlistPattern.test(args[0])) {
      return message.client.commands.get("playlist").execute(message, args);
    }

    const serverQueue = message.client.queue.get(message.guild.id);
    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: 100,
      playing: true
    };

    let songInfo = null;
    let song = null;

    if (urlValid) {
      try {
        let searchEmbed = new MessageEmbed()
            .setTitle("Searching")
            .setDescription(`Searching for song with url **${url}**.`)
            .setColor(`#FF0000`);

        message.channel.send(searchEmbed).then((msg) => {
          setTimeout(() => {
            if(msg.deletable){
              msg.delete();
            }
          }, 10000);
        })

        songInfo = await ytdl.getInfo(url);
        song = {
          title: songInfo.title,
          url: songInfo.video_url,
          duration: songInfo.length_seconds
        };
      } catch (error) {
        if (error.message.includes("copyright")) {
          return message
            .reply("⛔ The video could not be played due to copyright protection ⛔")
            .catch(console.error);
        } else {
          console.error(error);
        }
      }
    } else {
      try {
        let searchEmbed = new MessageEmbed()
            .setTitle("Searching")
            .setDescription(`Searching for song with name **${search}**.`)
            .setColor(`#FF0000`);

        message.channel.send(searchEmbed).then((msg) => {
          setTimeout(() => {
            if(msg.deletable){
              msg.delete();
            }
          }, 10000);
        })
        const results = await youtube.searchVideos(search, 1);
        songInfo = await ytdl.getInfo(results[0].url);
        song = {
          title: songInfo.title,
          url: songInfo.video_url,
          duration: songInfo.length_seconds
        };
      } catch (error) {
        console.error(error);
      }
    }

    if (serverQueue) {
      serverQueue.songs.push(song);
      let addToQueueEmbed = new MessageEmbed()
        .setTitle("Added to queue")
        .setDescription(`You've successfully added **${song.title}** to the queue.`)
        .setColor("#388e3c");

      return serverQueue.textChannel.send(addToQueueEmbed).catch(console.error);
    } else {
      queueConstruct.songs.push(song);
    }

    if (!serverQueue) message.client.queue.set(message.guild.id, queueConstruct);

    if (!serverQueue) {
      try {
        queueConstruct.connection = await channel.join();
        play(queueConstruct.songs[0], message);
      } catch (error) {
        console.error(`Could not join voice channel: ${error}`);
        message.client.queue.delete(message.guild.id);
        await channel.leave();
        return message.channel.send(`Could not join the channel: ${error}`).catch(console.error);
      }
    }
  }
};
