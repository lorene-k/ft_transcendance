'use strict'

const fp = require('fastify-plugin')
const path = require('node:path')
const fs = require('node:fs')
const Database = require('better-sqlite3')

module.exports = fp(async function (fastify, opts) {
  try {
    const dbPath = path.join(__dirname, '..', 'db', 'mydb.sqlite');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir);
      console.log(`Created db directory at ${dbDir}`);
    }
    const db = new Database(dbPath);
    console.log(`Connected to SQLite at ${dbPath}`);
    db.prepare(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL
    )`).run();
    fastify.decorate('db', db);
  } catch (err) {
    console.error('Database plugin error:', err)
    throw err;
  }
})

// ! TEST - REMOVE
