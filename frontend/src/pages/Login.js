import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "./Login.css";   // 👈 CSS imported here

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginUser = async () => {

    try {

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password
        }
      );

      const { token, user } = response.data;

      // Save token
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);

      Swal.fire({
        icon: "success",
        title: "Login Successful!",
        text: "Redirecting to dashboard..."
      });

      // Role based redirect
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

      <div className="login-card">

        <h2>MediFlow Login</h2>

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={loginUser}>Login</button>

      </div>

    </div>
  );
}

export default Login;