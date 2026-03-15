const MedicalRecord = require("../models/MedicalRecord");
const generateSignedUrl = require("../utils/generateSignedUrl");


// Create Medical Record
exports.createRecord = async (req, res) => {
  try {

    const record = await MedicalRecord.create({
      patient: req.body.patient,
      doctor: req.user._id,
      diagnosis: req.body.diagnosis,
      prescription: req.body.prescription,
      notes: req.body.notes
    });

    res.status(201).json(record);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get Patient Records (Doctor view)
exports.getPatientRecords = async (req, res) => {
  try {

    const records = await MedicalRecord.find({
      patient: req.params.patientId
    }).populate("doctor", "name email");

    res.json(records);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Upload Medical Report and save to database
exports.uploadMedicalRecord = async (req, res) => {
  try {

    const { patientId, diagnosis, prescription, notes } = req.body;

    const record = await MedicalRecord.create({
      patient: patientId,
      doctor: req.user._id,
      diagnosis,
      prescription,
      notes,
      reportFile: req.file.location
    });

    res.status(201).json({
      message: "Medical record created successfully",
      record
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// Get records for logged-in patient
exports.getMyRecords = async (req, res) => {
  try {

    const records = await MedicalRecord.find({
      patient: req.user._id
    }).populate("doctor", "name email");

    res.json(records);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// View Report (Open in browser)
exports.viewReport = async (req, res) => {
  try {

    const { key } = req.params;

    const url = await generateSignedUrl(key, false);

    res.json({ url });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Download Report (Force download)
exports.downloadReport = async (req, res) => {
  try {

    const { key } = req.params;

    const url = await generateSignedUrl(key, true);

    res.json({ url });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};