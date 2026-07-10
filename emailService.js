const express = require('express');
const bodyParser = require('body-parser');
const { authMiddleware } = require('./controllers/auth/auth-controller');
const transporter = require('./config/emailConfig');

const router = express.Router();
const port = 5000;

// Middleware to parse form data (application/x-www-form-urlencoded)
//app.use(bodyParser.urlencoded({ extended: true }));

// Function to validate email data
const validateEmailData = (data) => {
  const errors = [];
  
  if (!data.email) {
    errors.push('Email address is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (!data.name) {
    errors.push('Name is required');
  }
  
  if (!data.orderNumber) {
    errors.push('Order number is required');
  }
  
  if (!data.totalAmount) {
    errors.push('Total amount is required');
  }
  
  if (!data.paymentMethod) {
    errors.push('Payment method is required');
  }
  
  if (!data.orderStatus) {
    errors.push('Order status is required');
  }
  
  if (!data.orderDate) {
    errors.push('Order date is required');
  }
  
  return errors;
};

// Function to send order confirmation email
const sendOrderConfirmationEmail = async (orderData) => {
  try {
    // Validate email data
    const validationErrors = validateEmailData(orderData);
    if (validationErrors.length > 0) {
      console.error('Email validation errors:', validationErrors);
      return { 
        success: false, 
        message: 'Invalid email data: ' + validationErrors.join(', ')
      };
    }

    console.log('Preparing to send order confirmation email to:', orderData.email);

    // Verify SMTP connection before sending
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('SMTP verification failed:', {
        message: verifyError.message,
        code: verifyError.code,
        command: verifyError.command,
        responseCode: verifyError.responseCode,
        response: verifyError.response
      });
      return {
        success: false,
        message: 'Failed to verify SMTP connection: ' + verifyError.message
      };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'roshfinejewellery@gmail.com',
      to: orderData.email,
      subject: 'Order Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Order Confirmation</h2>
          
          <p>Dear ${orderData.name},</p>
          
          <p>Thank you for your order! We're excited to let you know that we've successfully received it and are currently processing your request.</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Order ID:</strong> ${orderData.orderNumber}</li>
              <li><strong>Customer:</strong> ${orderData.name}</li>
              <li><strong>Total Amount:</strong> $${orderData.totalAmount}</li>
              <li><strong>Payment Method:</strong> ${orderData.paymentMethod}</li>
              <li><strong>Order Status:</strong> ${orderData.orderStatus || 'Confirmed'}</li>
              <li><strong>Order Date:</strong> ${new Date(orderData.orderDate).toLocaleString()}</li>
            </ul>
          </div>
          
          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Track Your Order:</h3>
            <p>You can track your order status at any time by visiting:</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop/account/orders" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Track Order
            </a>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Status Updates:</h3>
            <p>We'll keep you informed about your order's progress through email notifications. Your order will go through the following stages:</p>
            <ol>
              <li><strong>Confirmed</strong> - Your order has been received</li>
              <li><strong>Processing</strong> - We're preparing your items</li>
              <li><strong>Shipped</strong> - Your order is on its way</li>
              <li><strong>Delivered</strong> - Your order has been delivered</li>
            </ol>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team at support@yourcompany.com.</p>
          
          <p>Thank you for shopping with us!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0;">Best regards,<br>Your E-commerce Team</p>
          </div>
        </div>
      `
    };

    console.log('Attempting to send email with options:', {
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
    return { success: true, message: 'Order confirmation email sent.' };
  } catch (error) {
    console.error('Error sending order confirmation email:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
      orderData: {
        email: orderData.email,
        orderNumber: orderData.orderNumber
      }
    });
    return { 
      success: false, 
      message: 'Failed to send order confirmation email: ' + error.message 
    };
  }
};

// Function to send new product notification email
const sendNewProductEmail = async (productData, userEmails) => {
  try {
    if (!Array.isArray(userEmails) || userEmails.length === 0) {
      return { 
        success: false, 
        message: 'No valid email addresses provided' 
      };
    }

    if (!productData || !productData.title || !productData.description || !productData.price) {
      return { 
        success: false, 
        message: 'Invalid product data provided' 
      };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'roshfinejewellery@gmail.com',
      to: userEmails.join(','),
      subject: 'New Product Available!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Product Available! 🎉</h2>
          
          <p>We are excited to announce the arrival of our newest product: <strong>${productData.title}</strong>!</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Product Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Product Name:</strong> ${productData.title}</li>
              <li><strong>Description:</strong> ${productData.description}</li>
              <li><strong>Price:</strong> $${productData.price}</li>
              ${productData.category ? `<li><strong>Category:</strong> ${productData.category}</li>` : ''}
              ${productData.brand ? `<li><strong>Brand:</strong> ${productData.brand}</li>` : ''}
            </ul>
          </div>

          <p>This is a limited-time offer, so don't miss out on the chance to grab it while it lasts!</p>
          
          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p>Visit our website to check it out and make your purchase today:</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop/products" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Product
            </a>
          </div>
          
          <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0;">Best regards,<br>Your E-commerce Team</p>
          </div>
        </div>
      `
    };

    console.log('Attempting to send new product email to:', userEmails.length, 'recipients');

    const info = await transporter.sendMail(mailOptions);
    console.log('New product notification email sent successfully:', info.response);
    return { success: true, message: 'New product notification email sent.' };
  } catch (error) {
    console.error('Error sending new product notification email:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      productData: {
        title: productData.title
      }
    });
    return { 
      success: false, 
      message: 'Failed to send new product notification email: ' + error.message 
    };
  }
};

// API endpoint for order confirmation email
router.post('/api/send-order-confirmation', async (req, res) => {
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
router.post('/api/add-product-email', async (req, res) => {
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

module.exports = {
  router,
  sendOrderConfirmationEmail,
  sendNewProductEmail
};
