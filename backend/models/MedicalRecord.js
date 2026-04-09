const mongoose = require("mongoose");

const medicalRecordSchema = mongoose.Schema({

  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  diagnosis: {
    type: String
  },

  medicationTable: [{
    name: String,
    days: String,
    frequency: String
  }],

  reportFile: {
    type: String
  },

  notes: {
    type: String
  },

  age: {
    type: String
  },

  symptoms: [{
    type: String
  }],

  status: {
    type: String,
    enum: ["Pending", "Needs Report", "Approved", "Completed"],
    default: "Pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);