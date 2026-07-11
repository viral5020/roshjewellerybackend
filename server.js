// Triggering nodemon restart to load new .env variables
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const passport = require('passport');
const session = require('express-session');
const OAuth2Strategy = require('passport-google-oauth20').Strategy;

const authRouter = require("./routes/auth/auth-routes");
const adminProductsRouter = require("./routes/admin/products-routes");
const adminOrderRouter = require("./routes/admin/order-routes");
const shopOrderRouter = require("./routes/shop/order-routes");

const shopProductsRouter = require("./routes/shop/products-routes")
const shopCartRouter = require("./routes/shop/cart-routes");
const shopAddressRouter = require("./routes/shop/address-routes");
const shopSearchRouter = require("./routes/shop/search-routes");
const shopReviewRouter = require("./routes/shop/review-routes");

const commonFeatureRouter = require("./routes/common/feature-routes");
const categoryRoutes = require("./routes/admin/categoryRoutes");

const giftCardRoutes = require('./routes/admin/giftcard-routes');
const couponRoutes = require('./routes/shop/coupon-routes');

const inventoryRoutes = require('./routes/admin/inventoryRoutes');

const emailRouter = require("./routes/email-routes");
const emailproductRouter = require("./emailproduct");

const userRoutes = require("./routes/auth/auth-routes");

const sendCheckoutNotification = require('./emailService');

const paymentRouter = require("./routes/shop/payment");

const invoiceRoutes = require('./routes/admin/invoiceRoutes');

const newsletterRoutes = require('./routes/shop/newsletterRoutes');

const wishlistRoutes = require("./routes/shop/wishlistRoutes");

const subCategoryRoutes = require("./routes/admin/subCategoryRoutes");

const transactionRoutes = require('./routes/admin/transactionRoutes');

const metalPriceRoutes = require('./routes/admin/metalPrice-routes');
const customOrderRoutes = require('./routes/admin/customOrder-routes');

const Razorpay = require('razorpay');
const User = require('./models/User');


// Google OAuth credentials (loaded from environment variables)
const clientid = process.env.GOOGLE_CLIENT_ID;
const clientsecret = process.env.GOOGLE_CLIENT_SECRET;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('mongoDB connected'))
  .catch((error) => console.log(error));

const app = express();
const PORT = process.env.PORT || 5000;

const isProd = process.env.NODE_ENV === 'production' || (process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith('https'));

// Trust proxy for secure cookies on Render
if (isProd) {
  app.set('trust proxy', 1);
}

// Configure CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://roshfinejewellery.com"
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      const isAllowed =
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.includes("roshjewellery") ||
        allowedOrigins.includes(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'Expires',
      'Pragma'
    ]
  })
);

// Add cookie parser middleware with more detailed logging
app.use(cookieParser());

// Add body parser middleware with increased limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add request logging middleware with better error handling
app.use((req, res, next) => {
  try {
    console.log('Incoming request:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      cookies: req.cookies,
      body: req.body
    });
    next();
  } catch (error) {
    console.error('Error in request logging middleware:', error);
    next(error);
  }
});

// setup session with more permissive settings
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-here",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// setup passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new OAuth2Strategy({
    clientID: clientid,
    clientSecret: clientsecret,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/auth/google/callback` : "http://localhost:5000/auth/google/callback"),
    scope: ["profile", "email"]
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth profile:', profile);
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          console.log('Creating new user from Google profile');
          user = new User({
            email: profile.emails[0].value,
            userName: profile.displayName,
            googleId: profile.id,
            image: profile.photos[0].value,
            role: 'user'
          });

          await user.save();
          console.log('New user created:', user);
        }

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    })
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Initial Google OAuth route
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    session: false
  })
);

// Google OAuth callback
app.get('/auth/google/callback', (req, res, next) => {
  console.log('Google callback received');
  passport.authenticate('google', { session: false }, (err, user, info) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (err) {
      console.error('Google callback error:', err);
      return res.redirect(`${frontendUrl}/auth/login?error=oauth_failed`);
    }
    if (!user) {
      console.log('No user returned from Google auth');
      return res.redirect(`${frontendUrl}/auth/login?error=user_not_found`);
    }

    console.log('Google auth successful, generating token for user:', user.email);

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role || 'user',
        email: user.email,
        userName: user.userName || user.displayName,
      },
      "CLIENT_SECRET_KEY",
      { expiresIn: "7d" }
    );

    // Set cookie directly in headers
    const isProd = process.env.NODE_ENV === 'production' || (process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith('https'));
    const sameSite = isProd ? 'None' : 'Lax';
    const secure = isProd ? '; Secure' : '';
    const cookieValue = `token=${token}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${7 * 24 * 60 * 60}${secure}`;
    res.setHeader('Set-Cookie', cookieValue);

    console.log('Setting cookie for Google auth:', cookieValue);

    // Set additional CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || frontendUrl);

    // Redirect to the frontend with the token in the URL query string
    res.redirect(`${frontendUrl}/shop/home?token=${token}`);
  })(req, res, next);
});


// Logout
app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect("");
  });
});

// Add error handling middleware before routes
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// Add routes
app.use("/api/auth", authRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/shop/order", shopOrderRouter);
app.use("/api/shop/products", shopProductsRouter);
app.use("/api/shop/cart", shopCartRouter);
app.use("/api/shop/address", shopAddressRouter);
app.use("/api/shop/search", shopSearchRouter);
app.use("/api/shop/reviews", shopReviewRouter);
app.use("/api/common/feature", commonFeatureRouter);
app.use("/api/categories", categoryRoutes);
app.use("/api/giftcards", giftCardRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/email", emailRouter);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api", userRoutes);
app.use("/api/payment", paymentRouter);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin/metal-prices", metalPriceRoutes);
app.use("/api/custom", customOrderRoutes);

// Add 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.url);
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Add final error handler
app.use((err, req, res, next) => {
  console.error('Final error handler caught:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`); // Localhost port
  console.log('Available routes:');
  console.log('- POST /api/newsletter/subscribe');
  console.log('- POST /api/newsletter/unsubscribe');
  console.log('- GET /api/newsletter/subscribers');
});

module.exports = { app }
