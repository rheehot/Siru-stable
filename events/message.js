const redis = require('redis')

class Event {
  constructor (client) {
    this.client = client
    this.redisClient = redis.createClient({ host: 'localhost' })
  }

  /**
   * Run Event
   * @param message {Object} - Message
   */
  async run (message) {
    this.redisClient.publish('asdf', JSON.stringify({ message: message.content }))
    this.handleCommand(message)
  }

  async handleCommand (message) {
    if (message.author.bot) return
    if (message.channel.type === 'dm') return this.sendNotAbleDM(message)
    if (message.guild && !message.member) await message.guild.fetchMember(message.author)
    await this.client.database.checkGuild(message.guild)
    await this.client.database.checkGuildMember(message.member)
    await this.client.database.checkGlobalMember(message.author)
    const prefix = this.client._options.bot.prefix
    if (message.content.startsWith(prefix)) {
      const GlobalUserData = await this.client.database.getGlobalUserData(message.author)
      const GuildMemberData = await this.client.database.getGuildMemberData(message.member)
      const GuildData = await this.client.database.getGuildData(message.guild.id)
      const args = message.content.slice(prefix.length).trim().split(/ +/g)
      const command = args.shift().toLowerCase()
      const otherData = {
        GlobalUserData: GlobalUserData,
        GuildMemberData: GuildMemberData,
        GuildData: GuildData
      }
      const userPermissions = this.client.utils.permissionChecker.getUserPermission(message.member, otherData)
      const compressed = {
        GlobalUserData: GlobalUserData,
        GuildMemberData: GuildMemberData,
        GuildData: GuildData,
        message: message,
        args: args,
        prefix: prefix,
        userPermissions: userPermissions
      }

      const locale = compressed.GuildData.locale
      const picker = this.client.utils.localePicker
      const Command = this.client.commands.get(command) || this.client.commands.get(this.client.aliases.get(command))
      if (Command) {
        let ablePermissions = 0
        if (this.client.getRightChannel(message.channel, GuildData.tch)) {
          if (Command.command.require_voice) {
            const vch = GuildData.vch
            if (!message.member.voiceChannel) return message.channel.send(picker.get(locale, 'AUDIO_JOIN_VOICE_FIRST'))
            if (!this.client.getRightChannel(message.member.voiceChannel, vch)) return message.channel.send(picker.get(locale, 'AUDIO_NOT_DEFAULT_CH', { VOICECHANNEL: vch }))
            if (this.client.audio.getVoiceStatus(message.member).listen === false) return message.channel.send(picker.get(locale, 'AUDIO_LISTEN_PLEASE'))
            if (message.guild.me.voiceChannel && message.guild.me.voiceChannel.id !== message.member.voiceChannel.id) return message.channel.send(picker.get(locale, 'AUDIO_SAME_VOICE', { VOICECHANNEL: message.guild.me.voiceChannel.id }))
          }
          for (const userPerm of userPermissions) {
            if (Command.command.permissions.includes(userPerm)) {
              ablePermissions++
              this.client.logger.debug(`[Command] [Run] (${message.channel.id}, ${message.id}, ${message.author.id}) Treating command ${Command.command.name} at ${new Date().getTime()}`)
              return Command.run(compressed)
            }
          }
          if (ablePermissions === 0) {
            message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_NO_PERMISSIONS', { REQUIRED: Command.command.permissions.join(', ') }))
          }
        } else {
          if (this.client.utils.permissionChecker.checkChannelPermission(message.guild.me, message.channel, ['MANAGE_MESSAGES'])) {
            message.delete()
          }
          message.author.send(picker.get(locale, 'HANDLE_COMMANDS_DEFAULT_TEXT', { SERVER: message.guild.name, CHANNEL: GuildData.tch })).catch((e) => {
            this.client.logger.debug(`[Message Handler] [Send Author] Send Fail.. ${message.author.tag}(${message.author.id})`)
          })
        }
      }
    }
  }

  sendNotAbleDM (message) {
    message.channel.send('❎  DM 에서는 명령어를 사용하실수 없어요..\n❎  You can\'t use commands on the DM.')
  }
}
module.exports = Event

module.exports.info = {
  event: 'message'
}
