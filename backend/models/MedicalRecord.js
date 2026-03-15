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

  prescription: {
    type: String
  },

  reportFile: {
    type: String
  },

  notes: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);