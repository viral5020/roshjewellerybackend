const express = require('express');
const router = express.Router();
const { sendOrderConfirmationEmail, sendNewProductEmail } = require('../emailService');
const transporter = require('../config/emailConfig');

// Test endpoint to verify email configuration
router.get('/test-email-config', async (req, res) => {
  try {
    // Test SMTP connection
    const verifyResult = await transporter.verify();
    console.log('SMTP verification result:', verifyResult);

    // Test sending a simple email
    const testMailOptions = {
      from: process.env.EMAIL_USER,
      to: 'krushangrangoonwala@gmail.com', // Send to the same address for testing
      subject: 'Test Email Configuration',
      text: 'This is a test email to verify the email configuration is working properly.',
      html: '<p>This is a test email to verify the email configuration is working properly.</p>'
    };

    const info = await transporter.sendMail(testMailOptions);
    console.log('Test email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });

    res.status(200).json({
      success: true,
      message: 'Email configuration test successful',
      details: {
        messageId: info.messageId,
        response: info.response
      }
    });
  } catch (error) {
    console.error('Email configuration test failed:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response
    });

    res.status(500).json({
      success: false,
      message: 'Email configuration test failed',
      error: error.message
    });
  }
});

// API endpoint for order confirmation email
router.post('/send-order-confirmation', async (req, res) => {
  try {
    console.log('Received order confirmation request:', {
      email: req.body.email,
      orderNumber: req.body.orderNumber
    });

    const result = await sendOrderConfirmationEmail(req.body);
    if (result.success) {
      res.status(200).send(result.message);
    } else {
      res.status(500).send(result.message);
    }
  } catch (error) {
    console.error('Error in order confirmation endpoint:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).send('Failed to send order confirmation email: ' + error.message);
  }
});

// API endpoint for new product notification
router.post('/add-product-email', async (req, res) => {
  try {
    console.log('Received new product notification request:', {
      productTitle: req.body.productData?.title,
      recipientCount: req.body.userEmails?.length
    });

    const { productData, userEmails } = req.body;
    const result = await sendNewProductEmail(productData, userEmails);
    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Error in new product notification endpoint:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Failed to send new product notification email: ' + error.message
    });
  }
});

module.exports = router; 