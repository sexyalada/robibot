const { MessageEmbed } = require('discord.js');

module.exports = {
	name: "volume",
	description: "Change volume of currently playing voiceConnection",
	execute(message, args) {
		const serverQueue = message.client.queue.get(message.guild.id);

		if (!message.member.voice.channel) {
			let volumeErrorEmbed = new MessageEmbed()
				.setTitle("Volume")
				.setDescription("You need to join a voice channel first!")
				.setColor("#d32f2f");
			return message.channel.send(volumeErrorEmbed).then((msg) => {
				if (msg.deletable) {
					msg.delete();
				}
			}).catch(console.error);
		}

		if (!serverQueue) {
			let volumeErrorEmbed = new MessageEmbed()
				.setTitle("Volume")
				.setDescription("There is nothing playing.")
				.setColor("#d32f2f");
			return message.channel.send(volumeErrorEmbed).then((msg) => {
				if (msg.deletable) {
					msg.delete();
				}
			}).catch(console.error);
		}

		if (!args[0]) {
			let currentVolumeEmbed = new MessageEmbed()
				.setTitle("Volume")
				.setDescription(`The current volume is: **${serverQueue.volume}%**`);
			return message.channel.send(currentVolumeEmbed).then((msg) => {
				setTimeout(() => {
					if (msg.deletable) {
						msg.delete();
					}
				}, 10000);
			}).catch(console.error);
		}
		if (isNaN(args[0])) {

			let volumeErrorEmbed = new MessageEmbed()
				.setTitle("Volume")
				.setDescription("Please use a number to set volume.")
				.setColor("#d32f2f");
			return message.channel.send(volumeErrorEmbed).catch(console.error);
		}
		if (parseInt(args[0]) > 100 || parseInt(args[0]) < 0) {
			let volumeErrorEmbed = new MessageEmbed()
				.setTitle("Volume")
				.setDescription("Please use a number to set volume.")
				.setColor("#d32f2f");

			return message.channel.send(volumeErrorEmbed).then((msg) => {
				if (msg.deletable) {
					msg.delete();
				}
			}).catch(console.error);
		}

		serverQueue.volume = args[0];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[0] / 100);
		let volumeEmbed = new MessageEmbed()
			.setTitle("Volume")
			.setDescription(`Volume set to: **${args[0]}%**`);

		return serverQueue.textChannel.send(volumeEmbed).then((msg) => {
			setTimeout(() => {
				if (msg.deletable) {
					msg.delete();
				}
			}, 10000);
		}).catch(console.error);
	}
};
