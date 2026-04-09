import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import UploadReport from "./pages/UploadReport";

function App() {
  return (
    <Router>
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/login" element={<Login />} />
    <Route path="/patient-dashboard" element={<PatientDashboard />} />
    <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
    <Route path="/upload-report" element={<UploadReport />} />
  </Routes>
</Router>
  );
}

export default App;