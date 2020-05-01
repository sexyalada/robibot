const { MessageEmbed } = require('discord.js');

module.exports = {
	name: "skip",
	description: "Skip the currently playing song",
	async execute(message) {
		const serverQueue = message.client.queue.get(message.guild.id);

		if (!message.member.voice.channel)
			return message.reply("You need to join a voice channel first!").catch(console.error);
		if (!serverQueue)
			return message.channel.send("There is nothing playing that I could skip for you.").catch(console.error);

		serverQueue.connection.dispatcher.end();

		let skippedEmbed = new MessageEmbed()
			.setTitle("Skipped")
			.setDescription(`The song has been skipped by ${message.author}`)
			.setColor(`#fbc02d`);

		serverQueue.textChannel.send(skippedEmbed)
			.then((msg) => {
				setTimeout(() => {
					if (msg.deletable) {
						msg.delete();
					}
				}, 10000);
			})
			.catch(console.error);
	}
};
