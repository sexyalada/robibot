const { MessageEmbed } = require("discord.js");

module.exports = {
	name: "loop",
	description: "Toggle music loop",
	async execute(message) {
		const serverQueue = message.client.queue.get(message.guild.id);
		if (!serverQueue) return message.reply("There is nothing playing.").catch(console.error);

		serverQueue.loop = !serverQueue.loop;

		let loopEmbed = new MessageEmbed()
			.setTitle("Loop")
			.setDescription(`Loop is now ${serverQueue.loop ? "**on**" : "**off**"}`)
			.setColor(serverQueue.loop ? `#388e3c` : `#d32f2f`);

		return serverQueue.textChannel
			.send(loopEmbed)
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
