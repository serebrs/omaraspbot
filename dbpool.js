const mariadb = require('mariadb');

exports.pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_DB,
    acquireTimeout: 1000
});

exports.poolLog = mariadb.createPool({
    host: process.env.DB_LOG_HOST,
    user: process.env.DB_LOG_USER,
    password: process.env.DB_LOG_PWD,
    database: process.env.DB_LOG_DB,
    acquireTimeout: 1000
});