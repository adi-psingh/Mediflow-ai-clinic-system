const axios = require("axios");
const MedicalRecord = require("../models/MedicalRecord");

// Predict Disease using Python ML API
exports.predictDisease = async (req, res) => {
  try {
    const symptomsWrapper = req.body;

    // Call Python API
    const response = await axios.post(
      "http://localhost:5001/predict",
      symptomsWrapper
    );
    
    let prediction = response.data.predicted_disease;

    // Improved Aggressive Age Extraction logic
    let extractedAge = "Not Specified";
    const detailsStr = symptomsWrapper.details || "";
    console.log("AI Intake Details:", detailsStr); // Debug log (server side)
    
    // Look for patterns like "Age: 35", "35 years old", "I am 35", "35" 
    const agePatterns = [
       /age[:\s]*(\d+)/i,
       /(\d+)\s*years/i,
       /(?:i(?:\s*am|'m)\s*|i've\s*)(\d+)/i,
       /\b([1-9][0-9]?|120)\b/
    ];

    for (const pattern of agePatterns) {
       const match = detailsStr.match(pattern);
       if (match) {
          extractedAge = (match[1] || match[0]).trim();
          break; 
       }
    }

    // Create a Pending record
    const record = await MedicalRecord.create({
      patient: req.user._id,
      age: extractedAge, 
      diagnosis: prediction,
      medicationTable: [],
      symptoms: symptomsWrapper.symptoms || [],
      status: "Pending",
      notes: detailsStr.length > 0 ? `Triage Details: ${detailsStr}` : ""
    });

    res.json({
      prediction: prediction,
      record: record
    });

  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "AI prediction failed"
    });
  }
};