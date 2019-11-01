const Discord = require('discord.js')
const Logger = require('./logger')
const DataBase = require('./modules/database')
const Audio = require('./modules/audio/Audio')
const utils = {
  safeEdit: require('./modules/safe_Edit'),
  randmizer: require('./modules/randmizer')
}

class Bot extends Discord.Client {
  constructor (options) {
    super()
    this._options = options
    this.randmizer = require('./modules/randmizer')
    this.logger = new Logger(this)
    this.database = new DataBase(this)
    this.utils = utils
    this.activityNum = 0
    this.initialized = false
    this.commands_loaded = false
    this.audio = new Audio({ client: this, shards: this._options.audio.shards, nodes: this._options.audio.nodes })
  }

  init () {
    if (this.initialized) {
      this.logger.error('[BOT] Bot is Already Initialized!')
      return new Error('[BOT] Bot is Already Initialized!')
    }
    this.logger.info('[BOT] Initializing Bot..')
    this.registerEvents()
    this.login(this._options.bot.token)
  }

  async LoadCommands () {
    this.commands = new Discord.Collection()
    this.aliases = new Discord.Collection()
    const CommandsFile = await globAsync('./commands/**/*.js')
    const reLoadOrLoad = `${this.commands_loaded ? '(re)' : ''}Load`
    const load = `[Commands] [${reLoadOrLoad}]`
    this.logger.info(`${load} Loading Commands (${CommandsFile.length} Files)`)
    this.logger.debug(`${load} (Commands: ${CommandsFile.join(', ')})`)
    for (const cmd of CommandsFile) {
      const Command = require(cmd)
      const command = new Command(this)
      this.logger.debug(`${load} Loading Command (${command.command.name})`)
      for (const aliases of command.command.aliases) {
        this.logger.debug(`${load} Loading Aliases (${aliases}) of Command ${command.command.name}`)
        this.aliases.set(aliases, command.command.name)
      }
      this.commands.set(command.command.name, command)
      delete require.cache[require.resolve(cmd)]
    }
    this.commands_loaded = true
    this.logger.info(`[Commands] Successfully ${reLoadOrLoad}ed Commands!`)
    return this.commands
  }

  async registerEvents () {
    this.logger.info('[Events] Registering Events...')
    const eventsFile = await globAsync('./events/*.js')
    this.logger.debug(`[Events] Event Files: ${eventsFile.join(' | ')}`)
    for (const file of eventsFile) {
      const EventClass = require(file)
      const Event = new EventClass(this)
      this.on(EventClass.info.event, (...args) => Event.run(...args))
    }
    this.logger.info('[Events] Events Successfully Loaded!')
  }

  ActivityInterVal () {
    this.setActivity()
    setInterval(() => {
      this.setActivity()
    }, 15000)
  }

  setActivity (act = undefined) {
    this.activityNum++
    if (!this._options.bot.games[this.activityNum]) this.activityNum = 0
    if (!act) act = this.getActivityMessage(this._options.bot.games[this.activityNum])
    this.user.setActivity(act, { url: 'https://www.twitch.tv/discordapp', type: 'STREAMING' })
  }

  getActivityMessage (message) {
    const msg = message.replace('%ping%', `${this.pings[0]}ms`).replace('%guilds%', this.guilds.size).replace('%users%', this.users.size)
    return msg
  }
}

function globAsync (path) {
  return new Promise((resolve, reject) => {
    require('glob')(path, (er, res) => {
      if (er) reject(er)
      else resolve(res)
    })
  })
}

const client = new Bot(require('./settings'))
client.init()

process.on('uncaughtException', (err) => {
  client.logger.error(err)
})

process.on('unhandledRejection', (reason, promise) => {
  client.logger.error(`UnHandledRejection: ${reason}, Promise: ${promise}`)
  promise.catch((e) => {
    client.logger.error(e.stack)
  })
})