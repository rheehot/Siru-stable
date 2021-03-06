const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'help',
      ['도움', '명령어', 'cmds', 'cmdlist'],
      ['Everyone'],
      'GENERAL_INFO',
      {
        audioNodes: false,
        playingStatus: false,
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceIn: false
        }
      },
      false
    )
  }

  async run ({ message, args, prefix, userPermissions, guildData }) {
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    const [commandName] = args
    const embed = new Discord.MessageEmbed()
      .setColor(this.client.utils.find.getColor(message.guild.me))
      .setFooter(picker.get(locale, 'COMMANDS_HELP_FOOTER', { PREFIX: prefix }), message.guild.me.user.displayAvatarURL({ format: 'png', size: 512 }))
    const command = this.client.commands.get(commandName) || this.client.commands.get(this.client.aliases.get(commandName))
    if (!command || command.hide === true) {
      embed.setTitle(picker.get(locale, 'COMMANDS_HELP_TITLE'))
      for (const item of this.client.categories.keyArray()) {
        for (const permission of userPermissions) {
          if (this.client.utils.permissionChecker.categories.filter(el => el.category === item)[0].requiredPermissions.includes(permission)) {
            embed.addField('**' + picker.get(locale, `CATEGORY_${item}`) + '**', this.client.categories.get(item).map(el => `\`\`${el}<${this.client.commands.get(el).aliases[0]}>\`\``).join(' '), false)
            break
          }
        }
      }
    } else {
      embed.setTitle(picker.get(locale, 'COMMANDS_HELP_INFO', { COMMAND: command.name.toUpperCase() }), message.guild.me.user.displayAvatarURL({ format: 'png', size: 512 }))
      embed.addField(
        picker.get(
          locale, 'COMMANDS_HELP_DESC'),
        `\`\`\`fix\n${picker.get(locale, `DESC_${command.category.toUpperCase()}_${command.name.toUpperCase()}`)}\`\`\``
      )
      embed.addField(
        picker.get(locale, 'COMMANDS_HELP_USAGE'),
          `\`\`\`fix\n${picker.get(locale, `USAGE_${command.category.toUpperCase()}_${command.name.toUpperCase()}`, { COMMAND: command.name })}\`\`\``
      )
      embed.addField(
        picker.get(locale, 'COMMANDS_HELP_ALIASES'),
        command.aliases.length === 0 ? picker.get(locale, 'NONE') : command.aliases.map(el => `\`\`${el}\`\``).join(', ')
      )
    }
    embed.addField(picker.get(locale, 'COMMANDS_HELP_MORE'), picker.get(locale, 'COMMANDS_HELP_MORE_DESC'))
    message.channel.send(message.author, embed)
  }
}

module.exports = Command
