'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/test', async (request, reply) => {
    const row = fastify.db
      .prepare('SELECT content FROM messages ORDER BY id DESC LIMIT 1')
      .get()
    return { message: row?.content || 'No message found' }
  })
  fastify.post('/test', async (request, reply) => {
    const { content } = request.body
    fastify.db
      .prepare('INSERT INTO messages (content) VALUES (?)')
      .run(content)
    return { status: 'Message saved' }
  })
}