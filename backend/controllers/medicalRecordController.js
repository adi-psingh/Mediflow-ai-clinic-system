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

// Get active records (Personal Follow-up & All New Pending)
exports.getPendingRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      $or: [
        { status: { $in: ["Pending", "Needs Report"] } },
        { status: "Approved", doctor: req.user._id }
      ]
    }).populate("patient", "name email");

    res.json(records);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get completed records for this doctor only
exports.getCompletedRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      status: "Completed",
      doctor: req.user._id
    }).populate("patient", "name email");

    res.json(records);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Record Status (Doctor view)
exports.updateRecordStatus = async (req, res) => {
  try {
    const { status, notes, medicationTable } = req.body;
    
    // assign doctor who approved it
    let updateData = { status };
    if (notes !== undefined) updateData.notes = notes;
    if (medicationTable !== undefined) updateData.medicationTable = medicationTable;
    updateData.doctor = req.user._id;

    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload file to existing record
exports.uploadRecordFile = async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { 
        reportFile: req.file.location, 
        status: "Pending" // Go back to pending for doctor review 
      },
      { new: true }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};