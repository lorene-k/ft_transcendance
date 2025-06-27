'use strict'

const fp = require('fastify-plugin')
const cors = require('@fastify/cors')

module.exports = fp(async function (fastify) {
  await fastify.register(cors, {
    origin: '*'
  })
})