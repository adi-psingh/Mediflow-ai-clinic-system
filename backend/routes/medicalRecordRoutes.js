const express = require("express");
const router = express.Router();

const {
  createRecord,
  getPatientRecords,
  uploadMedicalRecord,
  getMyRecords,
  viewReport,
  downloadReport
} = require("../controllers/medicalRecordController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Upload report
router.post("/upload", protect, authorizeRoles("doctor"), upload.single("file"), uploadMedicalRecord);

// Create medical record
router.post("/", protect, authorizeRoles("doctor"), createRecord);

// Patient dashboard records
router.get("/my-records", protect, authorizeRoles("patient"), getMyRecords);

// Signed URL routes
router.get("/report/view/:key", protect, viewReport);
router.get("/report/download/:key", protect, downloadReport);

// Doctor view patient records
router.get("/:patientId", protect, getPatientRecords);

module.exports = router;