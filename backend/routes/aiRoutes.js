const express = require("express");
const router = express.Router();

const { predictDisease } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// Protected route (only logged in users)
router.post("/predict", protect, predictDisease);

module.exports = router;