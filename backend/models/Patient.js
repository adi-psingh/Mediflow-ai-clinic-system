const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  symptoms: String,
  medicalHistory: String,
  chatbotSummary: String,
  reportURL: String
});

module.exports = mongoose.model("Patient", PatientSchema);