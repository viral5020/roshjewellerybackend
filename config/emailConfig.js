require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a single transporter instance
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "krushangrangoonwala@gmail.com",
    pass: "kslusctiletzlcfk",
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  logger: true
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