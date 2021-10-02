const mariadb = require('mariadb');

exports.pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_DB,
    acquireTimeout: 1000
});

exports.poolLog = mariadb.createPool({
    host: process.env.DB2_HOST,
    user: process.env.DB2_USER,
    password: process.env.DB2_PWD,
    database: process.env.DB2_DB,
    acquireTimeout: 1000
});