const mongoose = require("mongoose");

const userSchema = mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["doctor", "patient", "admin"],
    default: "patient"
  },
  hospitalName: {
    type: String,
    default: ""
  },
  specialty: {
    type: String,
    default: ""
  },
  photo: {
    type: String,
    default: ""
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);