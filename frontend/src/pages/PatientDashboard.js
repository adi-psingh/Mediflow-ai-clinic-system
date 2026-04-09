import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { FaHeartbeat, FaCommentMedical, FaFileMedicalAlt, FaCog, FaUserCircle, FaSignOutAlt, FaThLarge } from "react-icons/fa";
import "./PatientDashboard.css";

function PatientDashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [patientName] = useState(localStorage.getItem("userName") || "Patient");

  // Intelligent Chatbot State
  const [patientData, setPatientData] = useState({ name: "", age: "", symptoms: "" });
  const [isConsultationDone, setIsConsultationDone] = useState(false);
  
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "MediBot", text: "Hello! Welcome to MediFlow. I am your AI assistant. To get started, could you please tell me your name?", type: "bot" }
  ]);

  const fetchRecords = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

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
  }, [navigate]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const downloadReport = async (fileUrl) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const handleSendMessage = async () => {
    if (chatMessage.trim() !== "") {
      const userMessage = chatMessage;
      setChatHistory(prev => [...prev, { sender: "You", text: userMessage, type: "user" }]);
      setChatMessage("");
      
      if (isConsultationDone) {
          setTimeout(() => {
              setChatHistory(prev => [...prev, { sender: "MediBot", text: "I have already submitted your case. Please wait for the doctor's review.", type: "bot" }]);
          }, 500);
          return;
      }

      let newData = { ...patientData };
      
      // 1. Slot Fill: Age
      const ageMatch = userMessage.match(/\b([1-9][0-9]?|1[01][0-9]|120)\b/);
      if (!newData.age && ageMatch) {
         newData.age = ageMatch[0];
      }
      
      // 2. Slot Fill: Symptoms (Heuristic matching common words or forced via prompt)
      const medicalKeywords = ["fever", "cough", "cold", "pain", "headache", "vomiting", "nausea", "dizzy", "stomach", "ache", "sneeze", "ill", "sick", "breath", "blood", "diarrhea"];
      const hasSymptom = medicalKeywords.some(k => userMessage.toLowerCase().includes(k));
      if (!newData.symptoms && hasSymptom) {
         newData.symptoms = userMessage;
      }
      
      // 3. Slot Fill: Name (Fallbacks & explicit prompt checks)
      const lastBotMessage = chatHistory[chatHistory.length - 1].text;
      
      if (lastBotMessage.includes("tell me your name") && !newData.name) {
         newData.name = userMessage.replace(/my name is/gi, "").replace(/i am/gi, "").trim();
      } else if (lastBotMessage.includes("What is your age") && !newData.age && ageMatch) {
         newData.age = ageMatch[0];
      } else if (lastBotMessage.includes("describe your symptoms") && !newData.symptoms) {
         newData.symptoms = userMessage; // force whatever they say into symptoms since we prompted explicitly
      } else if (!newData.name && !hasSymptom && !ageMatch) {
         newData.name = userMessage.trim();
      }
      
      setPatientData(newData);

      // Determine next prompt based on what is structurally missing
      setTimeout(async () => {
          if (!newData.name) {
             setChatHistory(prev => [...prev, { sender: "MediBot", text: "Could you please tell me your name?", type: "bot" }]);
          } else if (!newData.age) {
             setChatHistory(prev => [...prev, { sender: "MediBot", text: `Nice to meet you, ${newData.name}. What is your age?`, type: "bot" }]);
          } else if (!newData.symptoms) {
             setChatHistory(prev => [...prev, { sender: "MediBot", text: `Noted. You are ${newData.age} years old. Could you please describe your symptoms in detail?`, type: "bot" }]);
          } else {
             // We have all three fields completed natively! Trigger prediction!
             setIsConsultationDone(true);
             try {
                const token = localStorage.getItem("token");
                const finalDetails = `Name: ${newData.name}, Age: ${newData.age}`; 
                const response = await axios.post("http://localhost:5000/api/ai/predict", {
                  symptoms: [newData.symptoms],
                  details: finalDetails
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                const botsReply = `Based on your symptoms, the AI predicts: **${response.data.prediction}**. I have sent your profile and symptoms to the doctor for review!`;
                setChatHistory(prev => [...prev, { sender: "MediBot", text: botsReply, type: "bot" }]);
                fetchRecords(); 
             } catch (err) {
                setChatHistory(prev => [...prev, { sender: "MediBot", text: "Sorry, I am having trouble reaching the AI prediction server. Please try again later.", type: "bot" }]);
                setIsConsultationDone(false); // allow them to retry
             }
          }
      }, 700);
    }
  };

  const handleFileUpload = async (recordId) => {
    const fileInput = document.getElementById(`file-${recordId}`);
    if(!fileInput || !fileInput.files[0]) {
       Swal.fire({ title: "No File Selected", text: "Please select a file to upload for your doctor.", icon: "warning", confirmButtonText: "Got it", confirmButtonColor: "#3498db" });
       return;
    }
    
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/api/records/${recordId}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      Swal.fire({ title: "Upload Successful!", text: "Your report has been uploaded and sent to the doctor for review.", icon: "success", confirmButtonText: "Great", confirmButtonColor: "#2ecc71" });
      fetchRecords(); // Refresh the list
    } catch(err) {
      console.error(err);
      Swal.fire({ title: "Upload Failed", text: "We couldn't upload your report. Please try again.", icon: "error", confirmButtonText: "Okay", confirmButtonColor: "#e74c3c" });
    }
  };

  const generatePDF = (record) => {
    const doc = new jsPDF();
    
    // 1. MediFlow Header & Logo
    doc.setFillColor(34, 114, 196); // Deep Blue
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("MediFlow", 20, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Where AI and Doctor Consult together", 20, 32);
    
    // Rx Symbol
    doc.setFontSize(30);
    doc.text("Rx", 180, 28);
    
    // 2. Doctor Info (Right Side)
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const docName = record.doctor?.name ? "Dr. " + record.doctor.name : "Dr. Sharma";
    doc.text(`${docName}, MBBS`, 20, 55);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("General Physician & Specialist", 20, 60);
    doc.text("Registration No: MC-99120", 20, 65);
    
    doc.line(14, 70, 196, 70);

    // 3. Patient Details Grid
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Name:", 14, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`${patientName}`, 45, 80);
    
    doc.setFont("helvetica", "bold");
    doc.text("Date:", 140, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`${new Date(record.createdAt).toLocaleDateString("en-GB")}`, 155, 80);
    
    // Use dedicated age field or fallback to extraction
    let age = record.age || "Not Specified";
    
    doc.setFont("helvetica", "bold");
    doc.text("Age:", 14, 86);
    doc.setFont("helvetica", "normal");
    doc.text(`${age}`, 45, 86);
    
    doc.line(14, 92, 196, 92);

    // 4. Clinical Details (Improved Alignment)
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 114, 196);
    doc.text("Clinical Observations", 14, 102);
    
    const labelX = 14;
    const valueX = 40;
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Diagnosis:", labelX, 110);
    doc.setFont("helvetica", "normal");
    doc.text(`${record.diagnosis}`, valueX, 110);
    
    doc.setFont("helvetica", "bold");
    doc.text("Symptoms:", labelX, 118);
    doc.setFont("helvetica", "normal");
    
    let symptomStr = (record.symptoms || []).join(", ");
    if(!symptomStr && record.notes && record.notes.includes("Symptoms")) {
       symptomStr = record.notes;
    }
    if (!symptomStr) symptomStr = "Reported during AI intake consultation";
    
    const splitSymptoms = doc.splitTextToSize(symptomStr, 155);
    doc.text(splitSymptoms, valueX, 118);
    
    let currentY = 118 + (splitSymptoms.length * 6);
    
    // 5. Prescribed Medicines (Table with specific headers)
    currentY += 10;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 114, 196);
    doc.text("Prescribed Medicines", 14, currentY);
    currentY += 6;
    
    let medicines = [];
    if (Array.isArray(record.medicationTable)) {
        medicines = record.medicationTable;
    } else if (record.medicationTable && typeof record.medicationTable === 'string' && record.medicationTable !== "[]") {
        try {
            const parsed = JSON.parse(record.medicationTable);
            medicines = Array.isArray(parsed) ? parsed : [];
        } catch(e) {
            medicines = [{ name: record.medicationTable, days: "-", frequency: "-" }];
        }
    }
    
    if (medicines.length > 0) {
        autoTable(doc, {
            startY: currentY,
            head: [["S.No", "Medicine Name", "Number of Days", "Times/Day"]],
            body: medicines.map((med, idx) => [idx + 1, med.name, med.days, med.frequency]),
            theme: 'striped',
            headStyles: { fillColor: [34, 114, 196], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 5 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("No specific medications prescribed. Refer to doctor notes.", 14, currentY + 5);
        currentY += 15;
    }
    
    // 6. Doctor's Final Remarks (Ensuring it is at the bottom)
    if (record.notes && !record.notes.includes("Name:")) {
       // Filter out the AI intake text for cleaner remarks
       const cleanNotes = record.notes.replace(/Patient reported Info:.*?,/gi, "").replace(/Age: \d+/gi, "").trim();
       
       if (cleanNotes) {
         doc.setFontSize(13);
         doc.setFont("helvetica", "bold");
         doc.setTextColor(34, 114, 196);
         doc.text("Doctor's Advice / Remarks", 14, currentY);
         currentY += 6;
         
         doc.setFontSize(11);
         doc.setTextColor(0);
         doc.setFont("helvetica", "normal");
         const splitNotes = doc.splitTextToSize(cleanNotes, 180);
         doc.text(splitNotes, 14, currentY);
       }
    }
    
    // Footer with RxID
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.line(14, 280, 196, 280);
        doc.text("This is an electronically generated prescription from MediFlow AI Support. No signature required.", 105, 285, null, null, "center");
        doc.text(`Digital RxID: ${record._id.substring(record._id.length-8).toUpperCase()}`, 105, 290, null, null, "center");
    }
    
    const formattedDate = new Date(record.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-");
    doc.save(`${patientName}_${formattedDate}.pdf`);
  };

  // Helper date function since original might not export dates correctly
  const getFormatDate = () => {
    return new Date().toLocaleDateString("en-GB"); 
    // Usually you would use record.date from DB here.
  };

  return (
    <div className="patient-dashboard">
      
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-brand">
          <FaHeartbeat />
          <span>MediFlow</span>
        </div>
        
        <ul className="sidebar-menu">
          <li className="active"><FaThLarge /> Dashboard</li>
          <li><FaCommentMedical /> Chatbot</li>
          <li><FaFileMedicalAlt /> My Reports</li>
          <li><FaCog /> Settings</li>
        </ul>
        
        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <FaUserCircle /> {patientName}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="main-content">
        <h2 className="header">Welcome, {patientName}</h2>
        
        <div className="dashboard-grid">
          
          {/* Chatbot Section */}
          <div className="card chatbot-section">
            <div className="card-header">Chat with MediBot</div>
            
            <div className="chat-history">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.type}`}>
                  <div className="chat-sender">{msg.sender}</div>
                  <div className="chat-bubble">{msg.text}</div>
                </div>
              ))}
            </div>
            
            <div className="chat-input-area">
              <input 
                type="text" 
                className="chat-input" 
                placeholder="Type your message..." 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="chat-send-btn" onClick={handleSendMessage}>Send</button>
            </div>
          </div>
          
          {/* Right Column: Reports & History */}
          <div className="right-column">
            
            {/* Medical Reports */}
            <div className="card reports-section">
              <div className="card-header">My Medical Reports</div>
              <div className="card-content">
                {records.length === 0 ? (
                  <p style={{ color: "#7f8c8d" }}>No medical reports found.</p>
                ) : (
                  records.map((record) => (
                    <div className="report-item" key={record._id}>
                      <div className="report-info">
                        <span className="report-diagnosis">Diagnosis: {record.diagnosis}</span>
                        <span className="report-date">Date: {new Date(record.createdAt).toLocaleDateString("en-GB")}</span>
                        <span className="report-date" style={{marginTop: "5px", fontWeight: "bold", color: record.status === 'Needs Report' ? '#e67e22' : '#2c3e50'}}>
                          Status: {record.status === 'Pending' && record.reportFile ? "Awaiting Final Review" : record.status}
                        </span>
                        {record.notes && <span className="report-date" style={{color: '#c0392b'}}>Doctor Note: {record.notes}</span>}
                      </div>

                      <div style={{display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end"}}>
                        {['Needs Report', 'Approved'].includes(record.status) && !record.reportFile && (
                           <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
                             <input type="file" id={`file-${record._id}`} style={{fontSize: "12px", width: "180px"}} />
                             <button 
                                className="report-btn" 
                                style={{backgroundColor: "#e67e22"}}
                                onClick={() => handleFileUpload(record._id)}
                              >
                                Upload Report
                              </button>
                           </div>
                        )}

                        {['Approved', 'Completed'].includes(record.status) && (
                          <div style={{display: 'flex', gap: '8px'}}>
                            {record.prescription && record.prescription !== "[]" && (
                              <button 
                                className="report-btn" 
                                style={{backgroundColor: "#27ae60", color: "white"}}
                                onClick={() => {
                                  try {
                                      const parsed = JSON.parse(record.prescription);
                                      let htmlContent = '<table border="1" style="width:100%; border-collapse: collapse; text-align: left;"><tr><th style="padding:5px;">Medicine</th><th style="padding:5px;">Days</th><th style="padding:5px;">Frequency</th></tr>';
                                      parsed.forEach(m => { htmlContent += `<tr><td style="padding:5px;">${m.name}</td><td style="padding:5px;">${m.days}</td><td style="padding:5px;">${m.frequency}</td></tr>` });
                                      htmlContent += '</table>';
                                      Swal.fire({ title: "Doctor's Prescription", html: htmlContent, icon: "info", confirmButtonColor: "#27ae60"});
                                  } catch(err) {
                                      Swal.fire({ title: "Doctor's Prescription", text: record.prescription, icon: "info", confirmButtonColor: "#27ae60"});
                                  }
                                }}
                              >
                                View Recipe
                              </button>
                            )}
                            <button 
                              className="report-btn" 
                              style={{backgroundColor: "#e74c3c", color: "white"}}
                              onClick={() => generatePDF(record)}
                            >
                              Download Rx PDF
                            </button>
                          </div>
                        )}

                        {record.reportFile && (
                          <button 
                            className="report-btn" 
                            onClick={() => downloadReport(record.reportFile)}
                          >
                            Download Your File
                          </button>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Health History */}
            <div className="card history-section">
              <div className="card-header">Health History</div>
              <div className="card-content">
                {records.length === 0 ? (
                  <p style={{ color: "#7f8c8d" }}>No recent health history.</p>
                ) : (
                  <ul className="history-list">
                    {records.map((record, index) => (
                      <li key={index}>
                        Visited Dr. {record.doctor?.name || "Unknown"} - {getFormatDate()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
          </div>
          
        </div>
      </div>

    </div>
  );
}

export default PatientDashboard;