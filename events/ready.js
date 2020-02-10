class Event {
  constructor (client) {
    this.client = client
  }

  /**
   * Run Event
   */
  run () {
    this.client.logger.info(`[BOT] Bot Is Ready. (${this.client.user.tag})`)
    this.client.initialized = true
  }
}
module.exports = Event

module.exports.info = {
  event: 'ready'
}
