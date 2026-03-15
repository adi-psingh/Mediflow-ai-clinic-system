const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { getPatients } = require("../controllers/patientController");

router.get("/", protect, getPatients);

module.exports = router;