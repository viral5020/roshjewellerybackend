const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: function() {
      return !this.googleId;  // Make userName required only if not using Google login
    },
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;  // Make password required only if not using Google login
    },
  },
  googleId: {
    type: String,
    required: false,  // Optional, only set for Google users
    unique: true,     // Make it unique if you're using Google login
  },
  role: {
    type: String,
    default: "user",
  },
  displayName: {
    type: String,
    required: false, // Optional, set for Google users
  },
  image: {
    type: String,
    required: false, // Optional, set for Google users
  },
  resetPasswordToken: { type: String }, // Add this field
  resetPasswordTokenExpiration: { type: Date }, 
});



const User = mongoose.model("User", UserSchema);
module.exports = User;
