require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a single transporter instance
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'roshfinejewellery@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'hyud cjri xqlm hpji',
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true, // Enable debug logging
  logger: true // Enable logger
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP configuration error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response
    });
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

module.exports = transporter; 