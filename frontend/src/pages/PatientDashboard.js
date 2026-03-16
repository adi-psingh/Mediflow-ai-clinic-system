import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PatientDashboard.css";

function PatientDashboard() {

  const [records, setRecords] = useState([]);

  const fetchRecords = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await axios.get(
        "http://localhost:5000/api/records/my-records",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setRecords(response.data);

    } catch (error) {
      console.error(error);
    }

  };

  useEffect(() => {
    fetchRecords();
  }, []);


  // DOWNLOAD REPORT
  const downloadReport = async (fileUrl) => {

    try {

      const token = localStorage.getItem("token");

      const key = fileUrl.split(".com/")[1];

      const response = await axios.get(
        `http://localhost:5000/api/records/report/download/${key}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      window.open(response.data.url);

    } catch (error) {
      console.error(error);
    }

  };

  return (

    <div className="dashboard-container">

      <h2>Patient Dashboard</h2>

      <div className="records-container">

        {records.length === 0 ? (
          <p>No medical records found.</p>
        ) : (

          records.map((record) => (

            <div className="record-card" key={record._id}>

              <h3>Diagnosis</h3>
              <p>{record.diagnosis}</p>

              <h3>Prescription</h3>
              <p>{record.prescription}</p>

              <h3>Doctor</h3>
              <p>{record.doctor?.name}</p>

              {record.reportFile && (
                <div className="report-buttons">

<button
  className="download-btn"
  onClick={() => downloadReport(record.reportFile)}
>
  Download Medical Report
</button>

                </div>
              )}

            </div>

          ))

        )}

      </div>

    </div>

  );

}

export default PatientDashboard;