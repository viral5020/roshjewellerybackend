const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  authMiddleware,
  forgotPassword,
  resetPassword,
  getAllUsers,
} = require("../../controllers/auth/auth-controller");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/check-auth", authMiddleware, (req, res) => {
  console.log('Check-auth route - User data:', req.user);
  res.json({
    success: true,
    message: "Authenticated user!",
    user: req.user
  });
});

router.get("/users", authMiddleware, getAllUsers);

module.exports = router;
