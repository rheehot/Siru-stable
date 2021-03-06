const JagTagParser = require('@thesharks/jagtag-js')
const template = require('string-placeholder')
const Discord = require('discord.js')
const { BaseEvent } = require('../structures')

class Event extends BaseEvent {
  constructor (client) {
    super(
      client,
      'guildMemberAdd',
      (...args) => this.run(...args)
    )
  }

  /**
   * Run Event
   * @param {Object} member - GuildMember
   */
  async run (member) {
    this.client.logger.debug(`[GuildMemberAdd] Check Guild Member, Check Guild ${member.guild.id}`)
    await this.client.database.getGuild(member.guild.id)
    await this.client.database.getMember(member.id, member.guild.id)
    await this.client.database.getUser(member.id)
    await this.sendWelcome('welcome', member)
  }

  async sendWelcome (type, member) {
    const guildData = await this.client.database.getGuild(member.guild.id)
    const guild = member.guild
    const sendData = guildData[type]
    if (sendData.autoRoleEnabled && sendData.autoRoles && member.guild.me.permissions.has('MANAGE_ROLES')) {
      const roles = sendData.autoRoles.map(el => {
        const tempRole = member.guild.roles.cache.get(el)
        if (tempRole.position < member.guild.me.roles.highest) return tempRole
      })
      member.roles.add(roles).catch(() => {})
    }
    if (sendData.channel === '0') return
    const sendChannel = sendData.channel === 'dm' ? await member.user.createDM() : member.guild.channels.cache.get(sendData.channel)
    if (sendChannel && sendChannel.type !== 'dm' && !this.client.utils.permissionChecker.checkChannelPermission(guild.me, sendChannel, ['SEND_MESSAGES', 'ATTACH_FILES'])) return
    if (sendData.textEnabled && sendData.textContent && !sendData.imageEnabled) return sendChannel.send(this.template(sendData.textContent, member, guild))
    const params = [guild, member.user, sendData.imageTextContent]
    if (sendData.imageBgURL) params.push(sendData.imageBgURL)
    if (sendData.imageStyle) params.push(sendData.imageStyle)
    const imageCanvas = await this.client.utils.image.resolveInfo(this.client.utils.image.models.welcome(...params))
    const attachment = new Discord.MessageAttachment(imageCanvas.toBuffer(), 'card.png')
    if (sendData.textEnabled && sendData.imageEnabled) return sendChannel.send(this.template(sendData.textContent, member, guild), attachment).catch(() => {})
    if (!sendData.textEnabled && guildData.imageEnabled) return sendChannel.send(attachment).catch(() => {})
  }

  template (text, member, guild) {
    const templateResult = template(text, { user: member.user, tag: member.user.tag, channels: guild.channels.cache.size, roles: guild.roles.cache.size, users: guild.memberCount }, { before: '{', after: '}' })
    return JagTagParser(templateResult)
  }
}
module.exports = Event
