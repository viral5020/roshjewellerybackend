const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/User');
const transporter = require('./config/emailConfig');

const router = express.Router();

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

// API to add a new product and send email to all users
router.post('/api/add-product-email', async (req, res) => {
  console.log('Received product email request:', req.body);
  
  const { title, description, price, image } = req.body;

  // Validate required fields
  if (!title || !description || !price) {
    console.log('Missing required fields:', { title, description, price });
    return res.status(400).json({
      success: false,
      message: 'All product fields (title, description, price) are required.'
    });
  }

  try {
    // Fetch all user emails from the database
    const users = await User.find();
    console.log('Found users:', users.length);
    
    if (!users.length) {
      console.log('No users found to send email to');
      return res.status(200).json({ 
        success: true,
        message: 'No users to send email to.' 
      });
    }

    const userEmails = users.map(user => user.email);
    console.log('Sending emails to:', userEmails);

    // Prepare email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'viralajudia123@gmail.com',
      to: userEmails.join(','),
      subject: 'New Product Available!',
      text: `
        Hello,

        We are excited to announce the arrival of our newest product: **${title}**! 🎉

        Here's a sneak peek of the product:

        **Product Name:** ${title}
        **Description:** ${description}
        **Price:** $${price}

        This is a limited-time offer, so don't miss out on the chance to grab it while it lasts!

        Visit our website to check it out and make your purchase today.

        If you have any questions or need assistance, feel free to reach out to our support team.

        Thank you for being a valued customer, and we hope you enjoy our latest addition!

        Best regards,
        Your E-commerce Team
      `,
      html: `
        <h2>New Product Available! 🎉</h2>
        <p>We are excited to announce the arrival of our newest product: <strong>${title}</strong>!</p>
        
        <h3>Product Details:</h3>
        <ul>
          <li><strong>Product Name:</strong> ${title}</li>
          <li><strong>Description:</strong> ${description}</li>
          <li><strong>Price:</strong> $${price}</li>
        </ul>

        <p>This is a limited-time offer, so don't miss out on the chance to grab it while it lasts!</p>
        
        <p>Visit our website to check it out and make your purchase today.</p>
        
        <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
        
        <p>Thank you for being a valued customer, and we hope you enjoy our latest addition!</p>
        
        <br>
        <p>Best regards,<br>Your E-commerce Team</p>
      `
    };

    console.log('Attempting to send email with options:', {
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    // Send the email to all users
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    
    return res.status(200).json({ 
      success: true,
      message: 'Email sent successfully.',
      info: info.response
    });

  } catch (error) {
    console.error('Detailed error in product email:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send email.',
      error: error.message
    });
  }
});

module.exports = router;
