import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaHeartbeat, FaUsers, FaFileMedicalAlt, FaCog, FaSignOutAlt, FaThLarge } from "react-icons/fa";
import "./DoctorDashboard.css";

function DoctorDashboard() {
  const navigate = useNavigate();
  const rawName = localStorage.getItem("userName") || "Sharma";
  const doctorName = rawName.toLowerCase().startsWith("dr") ? rawName : `Dr. ${rawName}`;
  const displayDoctorName = `${doctorName}, MBBS`;
  
  const [patients, setPatients] = useState([]);
  const [completedPatients, setCompletedPatients] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [followSearch, setFollowSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notes, setNotes] = useState("");
  
  // Table specific state for prescriptions
  const [medicines, setMedicines] = useState([]);
  const [activeMedicine, setActiveMedicine] = useState({ name: "", days: "", frequency: "" });
  
  // Settings State
  const [profileData, setProfileData] = useState({
    name: localStorage.getItem("userName") || "",
    specialty: "",
    hospitalName: "",
    photo: ""
  });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch complete user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/records/pending", { // Just to get the user if needed, but better use a real profile endpoint if exists. 
             // Actually, I should have a profile endpoint. I'll use the login data if it was stored, 
             // but I just added updateProfile, so I'll fetch it from there if I had a GET /profile.
             // For now, I'll use what's in localStorage and update it.
        });
        // We'll update from the login user object if possible
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        setProfileData({
          name: storedUser.name || localStorage.getItem("userName") || "",
          specialty: storedUser.specialty || "",
          hospitalName: storedUser.hospitalName || "",
          photo: storedUser.photo || ""
        });
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  const addMedicine = () => {
    if(activeMedicine.name.trim() !== "") {
      setMedicines([...medicines, activeMedicine]);
      setActiveMedicine({ name: "", days: "", frequency: "" });
    }
  };

  const fetchPendingCases = async () => {
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/records/pending", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const records = res.data;
        const mapped = records.map(r => ({
            id: r._id,
            recordId: r._id,
            name: r.patient?.name || "Unknown Patient",
            age: r.age || "Not Specified", 
            gender: "Not Specified", 
            status: r.status,
            report: r.diagnosis || "Pending Diagnosis",
            symptoms: r.symptoms || [],
            reportFile: r.reportFile,
            notes: r.notes || "",
            medicationTable: r.medicationTable || [],
            date: new Date(r.createdAt).toLocaleDateString("en-GB")
        }));
        setPatients(mapped);
    } catch(err) {
        console.error("Failed to fetch pending cases", err);
    }
  };

  const fetchCompletedCases = async () => {
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/records/completed", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const records = res.data;
        const mapped = records.map(r => ({
            id: r._id,
            recordId: r._id,
            name: r.patient?.name || "Unknown Patient",
            age: r.age || "Not Specified", 
            gender: "Not Specified", 
            status: r.status,
            report: r.diagnosis || "Pending Diagnosis",
            symptoms: r.symptoms || [],
            reportFile: r.reportFile,
            notes: r.notes || "",
            medicationTable: r.medicationTable || [],
            date: new Date(r.createdAt).toLocaleDateString("en-GB")
        }));
        setCompletedPatients(mapped);
    } catch(err) {
        console.error("Failed to fetch completed cases", err);
    }
  };

  useEffect(() => {
    fetchPendingCases();
    fetchCompletedCases();
  }, []);

  const pendingPatients = patients.filter(p => ["Pending", "Needs Report"].includes(p.status) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const followUpPatients = patients.filter(p => p.status === "Approved" && p.name.toLowerCase().includes(followSearch.toLowerCase()));
  const pastPatients = completedPatients.filter(p => p.name.toLowerCase().includes(historySearch.toLowerCase()));

  const selectPatient = (p) => {
    setSelectedPatient(p);
    setNotes(p.notes || "");
    setMedicines(Array.isArray(p.medicationTable) ? p.medicationTable : []);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const viewPatientReport = async (fileUrl) => {
    try {
       const filename = fileUrl.split("/").pop();
       const token = localStorage.getItem("token");
       const { data } = await axios.get(`http://localhost:5000/api/records/report/view/${filename}`, {
         headers: { Authorization: `Bearer ${token}` }
       });
       window.open(data.url, "_blank");
    } catch(err) {
       console.error("View Report Error", err);
       Swal.fire({title: "Error", text: "Could not fetch report file.", icon: "error"});
    }
  };

  const updateStatus = async (statusToSet) => {
    if(!selectedPatient) return;
    try {
       const token = localStorage.getItem("token");
       
       // Ensure any currently typed medicine is added if not empty
       let finalMedicines = [...medicines];
       if(activeMedicine.name.trim() !== "") {
         finalMedicines.push(activeMedicine);
       }

       await axios.put(`http://localhost:5000/api/records/${selectedPatient.recordId}/status`, {
         status: statusToSet,
         notes: notes,
         medicationTable: finalMedicines
       }, {
         headers: { Authorization: `Bearer ${token}` }
       });
       
       Swal.fire({ title: "Status Updated", text: `The case status is now: ${statusToSet}`, icon: "success", confirmButtonText: "Awesome", confirmButtonColor: "#2ecc71" });
       fetchPendingCases();
       fetchCompletedCases();
       setSelectedPatient(null);
       setActiveMedicine({ name: "", days: "", frequency: "" });
       setMedicines([]);
       
       if(statusToSet === "Approved") setActiveTab("followup");
       if(statusToSet === "Completed") setActiveTab("history");
       
    } catch(err) {
       console.error(err);
       Swal.fire({ title: "Update Failed", text: "There was a problem updating the case status.", icon: "error", confirmButtonText: "Okay", confirmButtonColor: "#e74c3c" });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put("http://localhost:5000/api/auth/profile", profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem("userName", res.data.name);
      localStorage.setItem("user", JSON.stringify(res.data));
      Swal.fire({ title: "Profile Updated", text: "Your professional details have been saved.", icon: "success", confirmButtonColor: "#2272c4" });
    } catch (err) {
      Swal.fire({ title: "Error", text: err.response?.data?.message || "Failed to update profile", icon: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      Swal.fire({ title: "Wait!", text: "Please fill both password fields.", icon: "warning" });
      return;
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:5000/api/auth/change-password", passwords, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({ title: "Success", text: "Password changed successfully!", icon: "success", confirmButtonColor: "#2ecc71" });
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      Swal.fire({ title: "Error", text: err.response?.data?.message || "Failed to change password", icon: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="doctor-dashboard">
      
      {/* Sidebar */}
      <div className="doc-sidebar">
        <div className="doc-sidebar-brand">
          <FaHeartbeat />
          <span>MediFlow</span>
        </div>
        
        <ul className="doc-sidebar-menu">
           <li className={activeTab === "pending" ? "active" : ""} onClick={() => { setActiveTab("pending"); setSelectedPatient(null); }}>
             <FaThLarge /> Pending Cases
           </li>
           <li className={activeTab === "followup" ? "active" : ""} onClick={() => { setActiveTab("followup"); setSelectedPatient(null); }}>
             <FaUsers /> Follow-up Cases
           </li>
           <li className={activeTab === "history" ? "active" : ""} onClick={() => { setActiveTab("history"); setSelectedPatient(null); }}>
             <FaFileMedicalAlt /> Past Patients History
           </li>
           <li className={activeTab === "settings" ? "active" : ""} onClick={() => { setActiveTab("settings"); setSelectedPatient(null); }}>
             <FaCog /> Settings
           </li>
        </ul>
        
        <div className="doc-sidebar-bottom">
          <div className="doc-sidebar-profile">
            {profileData.photo ? (
              <img src={profileData.photo} alt="Doc" style={{width: "40px", height: "40px", borderRadius: "50%", marginRight: "10px", objectFit: "cover"}} />
            ) : (
              <div className="avatar">Dr</div>
            )} 
            <div style={{display: "flex", flexDirection: "column"}}>
              <span style={{fontSize: "14px", fontWeight: "bold"}}>{profileData.name}</span>
              <span style={{fontSize: "11px", opacity: 0.8}}>{profileData.specialty || "General Physician"}</span>
            </div>
          </div>
          <button className="doc-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="doc-main-content">
        <div className="doc-header">
          <h2>Welcome, {displayDoctorName}</h2>
          <div className="doc-profile-small">
            <div className="avatar">Dr</div> {displayDoctorName}
          </div>
        </div>
        
        <div className="doc-layout-grid">
          
          {/* Patient List Container */}
          <div className="doc-card patient-list-container">
            
          {/* Patient List Container - Tabbed Content */}
          <div className="doc-card patient-list-container">
            
            {activeTab === "pending" && (
              <>
                <div className="doc-card-header">Pending Cases</div>
                <div className="search-bar">
                  <input type="text" placeholder="Search pending..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="patient-list">
                  {pendingPatients.map(p => (
                    <div key={p.id} className={`patient-item ${selectedPatient?.id === p.id ? 'selected' : ''}`} onClick={() => selectPatient(p)}>
                      <div className="patient-item-info">
                        <strong>{p.name}</strong>
                        <span>Age: {p.age} • {p.date} • {p.status}</span>
                      </div>
                      <button className="patient-status-btn">Review</button>
                    </div>
                  ))}
                  {pendingPatients.length === 0 && <p className="empty-text">No pending cases.</p>}
                </div>
              </>
            )}

            {activeTab === "followup" && (
              <>
                <div className="doc-card-header">Follow-up Cases</div>
                <div className="search-bar">
                  <input type="text" placeholder="Search follow-ups..." value={followSearch} onChange={(e) => setFollowSearch(e.target.value)} />
                </div>
                <div className="patient-list">
                  {followUpPatients.map(p => (
                    <div key={p.id} className={`patient-item ${selectedPatient?.id === p.id ? 'selected' : ''}`} onClick={() => selectPatient(p)}>
                      <div className="patient-item-info">
                        <strong>{p.name}</strong>
                        <span>Age: {p.age} • {p.date}</span>
                      </div>
                      <button className="patient-status-btn active" style={{backgroundColor: "#3498db"}}>Active Tx</button>
                    </div>
                  ))}
                  {followUpPatients.length === 0 && <p className="empty-text">No patients in follow-up.</p>}
                </div>
              </>
            )}

            {activeTab === "history" && (
              <>
                <div className="doc-card-header">Past Patients History</div>
                <div className="search-bar">
                  <input type="text" placeholder="Search history..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
                </div>
                <div className="patient-list">
                  {pastPatients.map(p => (
                    <div key={p.id} className={`patient-item ${selectedPatient?.id === p.id ? 'selected' : ''}`} onClick={() => selectPatient(p)}>
                      <div className="patient-item-info">
                        <strong>{p.name}</strong>
                        <span>Phase: Recovered • {p.date}</span>
                      </div>
                      <button className="patient-status-btn" style={{backgroundColor: "#27ae60"}}>History</button>
                    </div>
                  ))}
                  {pastPatients.length === 0 && <p className="empty-text">No history records found.</p>}
                </div>
              </>
            )}

            {activeTab === "settings" && (
              <div className="settings-view">
                <div className="doc-card-header">Account & Professional Settings</div>
                <div className="settings-container">
                  
                  {/* Profile Photo Section */}
                  <div className="settings-section">
                    <h4>Profile Photo</h4>
                    <div className="photo-upload-area">
                      <div className="photo-preview">
                        {profileData.photo ? (
                          <img src={profileData.photo} alt="Profile" />
                        ) : (
                          <div className="photo-placeholder">Dr</div>
                        )}
                      </div>
                      <div className="photo-controls">
                        <input type="file" id="photo-input" hidden onChange={handlePhotoUpload} accept="image/*" />
                        <label htmlFor="photo-input" className="btn-primary" style={{cursor: "pointer", display: "inline-block"}}>Upload New Photo</label>
                        <p className="help-text">JPG or PNG. Max 1MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Professional Details Section */}
                  <form onSubmit={handleProfileUpdate} className="settings-section">
                    <h4>Professional Details</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Display Name</label>
                        <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="login-input" />
                      </div>
                      <div className="form-group">
                        <label>Specialty</label>
                        <input type="text" placeholder="e.g. Cardiologist" value={profileData.specialty} onChange={e => setProfileData({...profileData, specialty: e.target.value})} className="login-input" />
                      </div>
                      <div className="form-group">
                        <label>Hospital / Clinic Name</label>
                        <input type="text" placeholder="MediFlow Center" value={profileData.hospitalName} onChange={e => setProfileData({...profileData, hospitalName: e.target.value})} className="login-input" />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Professional Profile"}
                    </button>
                  </form>

                  {/* Security Section */}
                  <form onSubmit={handlePasswordChange} className="settings-section">
                    <h4>Security & Password</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Current Password</label>
                        <input type="password" value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} className="login-input" />
                      </div>
                      <div className="form-group">
                        <label>New Password</label>
                        <input type="password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} className="login-input" />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{backgroundColor: "#2ecc71"}} disabled={isSaving}>
                      Change Password
                    </button>
                  </form>

                </div>
              </div>
            )}

          </div>
          </div>
          
          {/* Patient Info Details */}
          <div className="doc-card patient-info-view">
            <div className="doc-card-header">Patient Info & AI Report</div>
            {selectedPatient ? (
              <div className="card-body">
                
                  <div className="profile-header" style={{display: "flex", justifyContent: "space-between"}}>
                    <div className="profile-ident">
                      <div className="avatar">{selectedPatient.name.charAt(0)}</div>
                      <div className="profile-ident-text">
                        <strong>{selectedPatient.name}</strong>
                        <span>Status: {selectedPatient.status}</span>
                      </div>
                    </div>
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                      {selectedPatient.reportFile && (
                          <button 
                            className="btn-primary" 
                            style={{fontSize: "12px", padding: "6px 10px"}} 
                            onClick={() => viewPatientReport(selectedPatient.reportFile)}
                          >
                            View Patient File
                          </button>
                      )}
                      
                      <span className="status-badge" style={{backgroundColor: selectedPatient.status === 'Approved' ? '#2ecc71' : '#f39c12', color: '#fff'}}>
                        {selectedPatient.status === 'Pending' && selectedPatient.reportFile ? "Awaiting Review" : (selectedPatient.status === 'Pending' ? 'Requires Review' : selectedPatient.status)}
                      </span>
                    </div>
                  </div>
                
                <div className="info-block">
                  <h4>AI Diagnosis Report</h4>
                  <p><strong>Predicted:</strong> {selectedPatient.report}</p>
                  <p><strong>Age:</strong> {selectedPatient.age}</p>
                  <p><strong>Date:</strong> {selectedPatient.date}</p>
                  
                  {selectedPatient.notes && selectedPatient.notes.includes("Age") && (
                     <p style={{ marginTop: '5px', fontSize: '13px', color: '#666' }}><strong>Intake Details:</strong> {selectedPatient.notes}</p>
                  )}

                  <p style={{ marginTop: '10px' }}><strong>Patient Symptoms:</strong></p>
                  <ul style={{ margin: '5px 0 0 20px', padding: 0, fontSize: '14px', color: '#4a5568' }}>
                    {selectedPatient.symptoms.length > 0 ? selectedPatient.symptoms.map((symp, i) => (
                      <li key={i}>{symp}</li>
                    )) : <li>{selectedPatient.notes}</li>}
                  </ul>
                </div>
                
                <div className="info-block">
                  <h4>Doctor Remarks</h4>
                  <textarea 
                    className="notes-input" 
                    placeholder="Enter diagnosis notes or request blood test..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>

                <div className="info-block" style={{marginTop: "10px"}}>
                  <h4>Prescription</h4>
                  
                  <div className="medicine-input-row" style={{display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "10px"}}>
                    <input type="text" placeholder="Medicine Name" className="login-input" style={{flex: "1 1 200px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px"}} value={activeMedicine.name} onChange={e => setActiveMedicine({...activeMedicine, name: e.target.value})}/>
                    <input type="text" placeholder="Days" className="login-input" style={{flex: "1 1 80px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px"}} value={activeMedicine.days} onChange={e => setActiveMedicine({...activeMedicine, days: e.target.value})}/>
                    <input type="text" placeholder="Times/Day" className="login-input" style={{flex: "1 1 100px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px"}} value={activeMedicine.frequency} onChange={e => setActiveMedicine({...activeMedicine, frequency: e.target.value})}/>
                    <button className="btn-primary" onClick={addMedicine}>Add Element</button>
                  </div>
                  
                  {medicines.length > 0 && (
                    <table className="medicine-table" style={{width: "100%", borderCollapse: "collapse", marginTop: "10px", fontSize: "14px"}}>
                      <thead>
                        <tr>
                          <th style={{padding: "8px", borderBottom: "2px solid #ccc", textAlign: "center"}}>S.No</th>
                          <th style={{padding: "8px", borderBottom: "2px solid #ccc", textAlign: "left"}}>Medicine Name</th>
                          <th style={{padding: "8px", borderBottom: "2px solid #ccc", textAlign: "center"}}>Duration</th>
                          <th style={{padding: "8px", borderBottom: "2px solid #ccc", textAlign: "center"}}>Frequency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicines.map((med, idx) => (
                           <tr key={idx}>
                             <td style={{padding: "8px", borderBottom: "1px solid #eee", textAlign: "center"}}>{idx + 1}</td>
                             <td style={{padding: "8px", borderBottom: "1px solid #eee", textAlign: "left"}}>{med.name}</td>
                             <td style={{padding: "8px", borderBottom: "1px solid #eee", textAlign: "center"}}>{med.days}</td>
                             <td style={{padding: "8px", borderBottom: "1px solid #eee", textAlign: "center"}}>{med.frequency}</td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                
                <div className="action-buttons">
                  {selectedPatient.status !== "Completed" && (
                     <>
                        <button className="btn-primary" style={{backgroundColor: '#e67e22'}} onClick={() => updateStatus("Needs Report")}>Request Blood Report</button>
                        <button className="btn-primary" onClick={() => updateStatus("Approved")}>Approve & Prescribe</button>
                        {selectedPatient.status === "Approved" && (
                           <button className="btn-primary" style={{backgroundColor: '#27ae60'}} onClick={() => updateStatus("Completed")}>Complete Treatment</button>
                        )}
                     </>
                  )}
                  {selectedPatient.status === "Completed" && (
                     <p style={{color: "#27ae60", fontWeight: "bold"}}>This case is marked as Completed.</p>
                  )}
                </div>

              </div>
            ) : (
               <p style={{padding: "20px", color: "#7f8c8d"}}>Please select a patient to view details.</p>
            )}
          </div>
          
        </div>
      </div>

    </div>
  );
}

export default DoctorDashboard;