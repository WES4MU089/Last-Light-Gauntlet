require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// In-memory Alias Store
const aliasStore = {}; // Temporary in-memory alias store for SL data

function createAlias() {
  return crypto.randomBytes(4).toString('hex');
}

module.exports = {
  transporter,
  aliasStore,
  createAlias,
};
