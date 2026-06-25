import mysql from "mysql2/promise";

const pool = await mysql.createPool({
    host:"localhost",
    user:"root",
    password: process.env.DB_PASSWORD,
    database:"application",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
console.log("MySQL Pool Connected Successfully");


export default pool;
