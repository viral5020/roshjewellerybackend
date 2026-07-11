require('dotenv').config();
const nodemailer = require('nodemailer');

const userEmail = process.env.EMAIL_USER || "krushangrangoonwala@gmail.com";
const userPass = process.env.EMAIL_PASSWORD || "kslusctiletzlcfk";

console.log("=== SMTP DEBUG INFO ===");
console.log("Using Email:", userEmail);
console.log("Password length:", userPass ? userPass.length : 0);
console.log("Password starts with:", userPass ? userPass.substring(0, 3) + "***" : "N/A");
console.log("=======================");

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: userEmail,
    pass: userPass,
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