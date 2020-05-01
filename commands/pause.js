module.exports = {
	name: "pause",
	description: "Pause the currently playing music",
	execute(message) {
		if (!message.member.voice.channel) {
			let pauseErrorEmbed = new MessageEmbed()
				.setTitle("Pause")
				.setDescription("You need to join a voice channel first!")
				.setColor("#d32f2f");

			return message.channel.send(pauseErrorEmbed).then((msg) => {
				setTimeout(() => {
					if (msg.deletable) {
						msg.delete();
					}
				})
			}).catch(console.error);
		}

		const serverQueue = message.client.queue.get(message.guild.id);
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause(true);
			let pausedEmbed = new MessageEmbed()
				.setTitle("Paused")
				.setDescription(`The music has been paused by ${message.author}`)
				.setColor(`#d32f2f`);

			return serverQueue.textChannel.send(pausedEmbed)
				.then((msg) => {
					setTimeout(() => {
						if (msg.deletable) {
							msg.delete();
						}
					}, 10000);
				})
				.catch(console.error);
		}
		let pauseErrorEmbed = new MessageEmbed()
			.setTitle("Pause")
			.setDescription("There is nothing playing.")
			.setColor("#d32f2f");

		return message.channel.send(pauseErrorEmbed).then((msg) => {
			setTimeout(() => {
				if (msg.deletable) {
					msg.delete();
				}
			})
		}).catch(console.error);
	}
};
