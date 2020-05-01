const ytdlDiscord = require("ytdl-core-discord");
const { MessageEmbed } = require("discord.js");

module.exports = {
	async play(song, message) {
		const queue = message.client.queue.get(message.guild.id);

		if (message.deletable) {
			message.delete();
		}

		if (!song) {
			queue.channel.leave();
			let endOfQueueEmbed = new MessageEmbed()
				.setTitle("End of queue")
				.setDescription(`There is nothing left to play...`)
				.setColor(`#d32f2f`);

			queue.textChannel.setTopic(``);
			message.client.queue.delete(message.guild.id);
			return queue.textChannel.send(endOfQueueEmbed).then((msg) => {
				setTimeout(() => {
					if (msg.deletable) {
						msg.delete();
					}
				}, 10000);
			}).catch(console.error);
		}

		try {
			var stream = await ytdlDiscord(song.url, { highWaterMark: 1 << 25 });
		} catch (error) {
			if (queue) {
				queue.songs.shift();
				module.exports.play(queue.songs[0], message);
			}

			if (error.message.includes("copyright")) {
				let copyrightEmbed = new MessageEmbed()
					.setTitle("Copyright issue")
					.setDescription(`This song could not be played due to copyright protection.`)
					.setColor(`#d32f2f`);

				return message.channel
					.send(copyrightEmbed)
					.then((msg) => {
						setTimeout(() => {
							if (msg.deletable) {
								msg.delete();
							}
						}, 10000);
					})
					.catch(console.error);
			} else {
				console.error(error);
			}
		}

		const dispatcher = queue.connection
			.play(stream, { type: "opus" })
			.on("finish", () => {
				if (queue.loop) {
					// if loop is on, push the song back at the end of the queue
					// so it can repeat endlessly
					let lastSong = queue.songs.shift();
					queue.songs.push(lastSong);
					module.exports.play(queue.songs[0], message);
				} else {
					// Recursively play the next song
					queue.songs.shift();
					module.exports.play(queue.songs[0], message);
				}
			})
			.on("error", err => {
				console.error(err);
				queue.songs.shift();
				module.exports.play(queue.songs[0], message);
			});
		dispatcher.setVolumeLogarithmic(queue.volume / 100);

		try {

			let playEmbed = new MessageEmbed()
				.setTitle("Rock'n'Roll")
				.setDescription(`Started playing: **${song.title}**`)
				.setColor(`#01579b`);

			queue.textChannel.setTopic(`Now playing: **${song.title}**`);
			var playingMessage = await queue.textChannel.send(playEmbed);
			await playingMessage.react("⏭");
			await playingMessage.react("⏸");
			await playingMessage.react("▶");
			await playingMessage.react("🔁");
			await playingMessage.react("⏹");
		} catch (error) {
			console.error(error);
		}

		const filter = (reaction, user) => user.id !== message.client.user.id;
		const collector = playingMessage.createReactionCollector(filter, {
			time: song.duration > 0 ? song.duration * 1000 : 600000
		});

		collector.on("collect", (reaction, user) => {
			// Stop if there is no queue on the server
			if (!queue) return;

			switch (reaction.emoji.name) {
				case "⏭":
					queue.connection.dispatcher.end();
					let skippedEmbed = new MessageEmbed()
						.setTitle("Skipped")
						.setDescription(`The song has been skipped by ${user}`)
						.setColor(`#fbc02d`);

					queue.textChannel
						.send(skippedEmbed)
						.then((msg) => {
							setTimeout(() => {
								if (msg.deletable) {
									msg.delete();
								}
							}, 10000);
						})
						.catch(console.error);
					collector.stop();
					break;

				case "⏸":
					if (!queue.playing) break;
					queue.playing = false;
					queue.connection.dispatcher.pause();
					let pausedEmbed = new MessageEmbed()
						.setTitle("Paused")
						.setDescription(`The music has been paused by ${user}`)
						.setColor(`#d32f2f`);

					queue.textChannel
						.send(pausedEmbed)
						.then((msg) => {
							setTimeout(() => {
								if (msg.deletable) {
									msg.delete();
								}
							}, 10000);
						})
						.catch(console.error);
					reaction.users.remove(user);
					break;

				case "▶":
					if (queue.playing) break;
					queue.playing = true;
					queue.connection.dispatcher.resume();
					let resumeEmbed = new MessageEmbed()
						.setTitle("Resume")
						.setDescription(`The music has been resumed by ${user}`)
						.setColor(`#388e3c`);

					queue.textChannel
						.send(resumeEmbed)
						.then((msg) => {
							setTimeout(() => {
								if (msg.deletable) {
									msg.delete();
								}
							}, 10000);
						})
						.catch(console.error);

					reaction.users.remove(user);
					break;

				case "🔁":
					queue.loop = !queue.loop;
					let loopEmbed = new MessageEmbed()
						.setTitle("Loop")
						.setDescription(`Loop is now ${queue.loop ? "**on**" : "**off**"}`)
						.setColor(queue.loop ? `#388e3c` : `#d32f2f`);

					queue.textChannel
						.send(loopEmbed)
						.then((msg) => {
							setTimeout(() => {
								if (msg.deletable) {
									msg.delete();
								}
							}, 10000);
						})
						.catch(console.error);
					reaction.users.remove(user);
					break;

				case "⏹":
					queue.songs = [];

					let stopEmbed = new MessageEmbed()
						.setTitle("Stop")
						.setDescription(`The music has been stopped by ${user}`)
						.setColor(`#d32f2f`);

					queue.textChannel
						.send(stopEmbed)
						.then((msg) => {
							setTimeout(() => {
								if (msg.deletable) {
									msg.delete();
								}
							}, 10000);
						})
						.catch(console.error);

					try {
						queue.connection.dispatcher.end();
					} catch (error) {
						console.error(error);
						queue.connection.disconnect();
					}
					collector.stop();
					break;

				default:
					break;
			}
		});

		collector.on("end", () => {
			playingMessage.reactions.removeAll();
		});
	}
};
