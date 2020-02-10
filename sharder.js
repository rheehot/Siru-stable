const path = require('path')
const { ShardingManager, WebhookClient } = require('discord.js')
const settings = require(path.join(process.cwd(), './modules/checker/getSettings'))()
const Logger = require('./modules/logger')
const logger = new Logger()
const manager = new ShardingManager('./index.js', { token: settings.bot.token, totalShards: settings.bot.shards })
// const hook = new WebhookClient(settings.logger.bootWebhook.id, settings.logger.bootWebhook.token)

manager.on('launch', shard => {
  // hook.send(`💡  Successfully Launched Shard of ${shard.id + 1} shards ${settings.bot.shards}`)
  logger.warn(`[Sharding] Successfully Launched Shard of ${shard.id}!`)
  if (settings.bot.shards - 1 === shard.id) {
    logger.warn(`[Sharding] Successfully Launched all shards! (${settings.bot.shards} shards)`)
  }
})
manager.spawn().then(() => {
  manager.broadcast('spawned-all-shards')
})
