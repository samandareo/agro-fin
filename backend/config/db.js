const { DB_USERNAME, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT } = require("./config");
const { Pool } = require("pg");

const pool = new Pool({
    user: DB_USERNAME,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: DB_PORT,
});

pool.connect()
    .then(client => {
        console.log("Connected to the database");
        client.release();
    })
    .catch(err => {
        console.error("Error connecting to the database", err.stack);
    });
    
module.exports = pool;