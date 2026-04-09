import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");

  const registerUser = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
        role
      });

      Swal.fire({
        icon: "success",
        title: "Registered Successfully!",
        timer: 1500,
        showConfirmButton: false
      });

      navigate("/login");

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.response?.data?.message || "Something went wrong"
      });
    }
  };

  return (
    <div className="register-container">

      {/* LEFT SIDE */}
      <div className="register-left">
        <div className="left-content">
          <h1>MediFlow</h1>
          <h2>Your Health, Our Priority</h2>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="register-right">
        <div className="register-card">

          <h2>MediFlow Register</h2>

          <input
            placeholder="Enter Name"
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Enter Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <select onChange={(e) => setRole(e.target.value)}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>

          <button onClick={registerUser} className="register-btn">
            Register
          </button>

          <p className="login-link">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login</span>
          </p>


        </div>
      </div>

    </div>
  );
}

export default Register;