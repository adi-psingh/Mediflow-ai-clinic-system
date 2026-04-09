import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { FaCheckCircle } from "react-icons/fa";

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");

  const loginUser = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userName", user.name);

      Swal.fire({
        icon: "success",
        title: "Login Successful!",
        timer: 1500,
        showConfirmButton: false
      });

      if (user.role === "doctor") {
        navigate("/doctor-dashboard");
      } else {
        navigate("/patient-dashboard");
      }

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.response?.data?.message || "Something went wrong"
      });
    }
  };

  return (
    <div className="login-container">

      {/* LEFT SIDE */}
      <div className="login-left" style={{ backgroundImage: "url('/medical-bg.png')" }}>
        <div className="left-content">
          <h1>MediFlow</h1>
          <h2>Your Health, <span>Our Priority</span></h2>
          <ul>
            <ul>
              <li><FaCheckCircle /> AI-Powered Health Assistant</li>
              <li><FaCheckCircle /> Secure Medical Records</li>
              <li><FaCheckCircle /> Professional Care</li>
            </ul>
          </ul>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">
        <div className="login-card">

          <h2>Welcome to MediFlow</h2>

          {/* Role Toggle */}
          <div className="role-toggle">
            <button
              className={role === "patient" ? "active" : ""}
              onClick={() => setRole("patient")}
            >
              Patient
            </button>
            <button
              className={role === "doctor" ? "active" : ""}
              onClick={() => setRole("doctor")}
            >
              Doctor
            </button>
          </div>

          <input
            type="email"
            placeholder="Email Address"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={loginUser} className="login-btn">
            Sign In
          </button>

          <p className="register-link">
            Don't have an account? <span onClick={() => navigate("/register")}>Sign Up</span>
          </p>

        </div>
      </div>

    </div>
  );
}

export default Login;