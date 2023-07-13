/**
 * @file Default Error Message On Error Button Interaction
 * @author JAYZHVJ
 * @since 3.0.0
 */

module.exports = {
    /**
     * @description Executes when the button interaction could not be fetched.
     * @author JAYZHVJ
     * @param {import('discord.js').ButtonInteraction} interaction The Interaction Object of the command.
     */

    async execute(interaction) {

        
        await interaction.reply({
             content: "An error occured. Please try again. If the error persists, feel free to contact one of our team member.",
             ephemeral: true,
         });
         return;
        },
};