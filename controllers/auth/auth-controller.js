const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const nodemailer = require("nodemailer");
const transporter = require("../../config/emailConfig");

// Register a new user
const registerUser = async (req, res) => {
  const { userName, email, password } = req.body;

  try {
    const checkUser = await User.findOne({ email });
    if (checkUser)
      return res.json({
        success: false,
        message: "User already exists with the same email! Please try again",
      });

    const checkUserName = await User.findOne({ userName });
    if (checkUserName)
      return res.json({
        success: false,
        message: "Username is already taken! Please try again with a different username",
      });

    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      userName,
      email,
      password: hashPassword,
    });

    await newUser.save();
    res.status(200).json({
      success: true,
      message: "Registration successful",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const checkUser = await User.findOne({ email });
    if (!checkUser)
      return res.json({
        success: false,
        message: "User doesn't exist! Please register first",
      });

    const checkPasswordMatch = await bcrypt.compare(
      password,
      checkUser.password
    );
    if (!checkPasswordMatch)
      return res.json({
        success: false,
        message: "Incorrect password! Please try again",
      });

    const token = jwt.sign(
      {
        id: checkUser._id,
        role: checkUser.role,
        email: checkUser.email,
        userName: checkUser.userName,
      },
      "CLIENT_SECRET_KEY",
      { expiresIn: "7d" }
    );

    // Set cookie directly in headers
    const origin = req.headers.origin || '';
    const isProd = process.env.NODE_ENV === 'production' || 
                   (process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith('https')) ||
                   origin.startsWith('https://');
    
    const sameSite = isProd ? 'None' : 'Lax';
    const secure = isProd ? '; Secure' : '';
    const cookieValue = `token=${token}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${7 * 24 * 60 * 60}${secure}`;
    res.setHeader('Set-Cookie', cookieValue);
    
    console.log('Setting cookie header:', cookieValue);

    // Set additional CORS headers
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || frontendUrl);

    // Log all response headers
    console.log('Response headers:', {
      'set-cookie': res.getHeader('set-cookie'),
      'access-control-allow-credentials': res.getHeader('access-control-allow-credentials'),
      'access-control-allow-origin': res.getHeader('access-control-allow-origin')
    });

    res.json({
      success: true,
      message: "Logged in successfully",
      token,
      user: {
        email: checkUser.email,
        role: checkUser.role,
        id: checkUser._id,
        userName: checkUser.userName,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

// Logout user
const logoutUser = (req, res) => {
  const origin = req.headers.origin || '';
  const isProd = process.env.NODE_ENV === 'production' || 
                 (process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith('https')) ||
                 origin.startsWith('https://');

  res.clearCookie("token", {
    path: "/",
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  }).json({
    success: true,
    message: "Logged out successfully!",
  });
};

// Auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    console.log('Auth middleware - Full request headers:', req.headers);
    console.log('Auth middleware - Raw cookies:', req.headers.cookie);
    console.log('Auth middleware - Parsed cookies:', req.cookies);
    
    // Check for token in Authorization header first, then fallback to cookies
    const authHeader = req.headers.authorization;
    let token = req.cookies.token;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    console.log('Auth middleware - Token present:', !!token);
    
    if (!token) {
      console.log('No token found in cookies or headers');
      return res.status(401).json({
        success: false,
        message: "Authentication token not found",
      });
    }

    try {
      console.log('Attempting to verify token...');
      const decoded = jwt.verify(token, "CLIENT_SECRET_KEY");
      console.log('Token decoded successfully:', {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email
      });
      
      if (!decoded) {
        console.log('Token verification failed - no decoded data');
        return res.status(401).json({
          success: false,
          message: "Invalid authentication token",
        });
      }

      // Verify user still exists in database
      const user = await User.findById(decoded.id);
      console.log('User lookup result:', user ? {
        id: user._id,
        email: user.email,
        role: user.role
      } : 'User not found');
      
      if (!user) {
        console.log('User not found in database:', decoded.id);
        return res.status(401).json({
          success: false,
          message: "User no longer exists",
        });
      }

      // Add user data to request
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        userName: user.userName
      };
      
      console.log('Auth middleware - User authenticated:', req.user);
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', {
        name: jwtError.name,
        message: jwtError.message,
        expiredAt: jwtError.expiredAt
      });

      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: "Token has expired",
          expiredAt: jwtError.expiredAt
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid token format or signature",
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// Forgot password - generates reset token and sends it via email
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with that email address",
      });
    }

    // Generate password reset token
    const resetToken = jwt.sign(
      { id: user._id, email: user.email },
      "RESET_PASSWORD_SECRET_KEY",
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Store the reset token in the user model (optional)
    user.resetPasswordToken = resetToken;
    await user.save();

    // Send the reset password email with the token as part of the URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/auth/resetpassword?token=${resetToken}`;

    await transporter.sendMail({
      from: "viralajudia123@gmail.com",
      to: email,
      subject: "Password Reset Request",
      text: `
    Hello,

    We received a request to reset your password. If you made this request, please click the link below to reset your password:

    ${resetLink}

    If you did not request a password reset, please ignore this email. Your password will not be changed.

    If you need further assistance, feel free to contact our support team.

    Thank you,
    [Your Company Name]
    [Company Contact Info]
  `,
      html: `
    <p>Hello,</p>
    <p>We received a request to reset your password. If you made this request, please click the link below to reset your password:</p>
    <p><a href="${resetLink}"><b>Reset Your Password</b></a></p>
    <p>If you did not request a password reset, please ignore this email. Your password will not be changed.</p>
    <p>If you need further assistance, feel free to contact our support team.</p>
    <br />
    <p>Thank you,</p>
    <p><strong>[Your Company Name]</strong><br />
    [Company Contact Info]</p>
  `,
    });

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email address",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Reset password - allows user to reset their password using the token
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    // Verify the reset token
    const decoded = jwt.verify(token, "RESET_PASSWORD_SECRET_KEY");

    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    user.password = hashedPassword;
    user.resetPasswordToken = undefined; // Clear the reset token
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};


// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
    res.status(200).json({
      success: true,
      users: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching users.",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  authMiddleware,
  forgotPassword,
  resetPassword,
  getAllUsers, // Export the function to fetch users
};


