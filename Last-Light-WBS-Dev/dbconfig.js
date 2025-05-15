// dbConfig.js
module.exports = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // e.g., "localhost\\SQLEXPRESS"
    database: process.env.DB_DATABASE,
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true', // convert string to boolean
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true'
    }
  };
  