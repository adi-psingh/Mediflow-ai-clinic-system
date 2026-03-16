import React, { useState } from "react";
import axios from "axios";
import "./Register.css";
import Swal from "sweetalert2";

function Register() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");

  const registerUser = async () => {

    try {

      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name,
          email,
          password,
          role
        }
      );

      console.log(response.data);

      Swal.fire({
        icon: "success",
        title: "Registration Successful!",
        text: "Redirecting to login...",
      }).then(() => {
          window.location.href = "/";
      });
      
    } catch (error) {

  if (error.response) {

    Swal.fire({
      icon: "error",
      title: "Registration Failed",
      text: error.response.data.message,
      confirmButtonColor: "#e74c3c"
    });

  } else {

    Swal.fire({
      icon: "warning",
      title: "Server Not Responding",
      text: "Backend server is not running or unreachable.",
      confirmButtonColor: "#f39c12"
    });

  }

}

  };

  return (

    <div className="register-container">

      <div className="register-card">

        <h2>MediFlow Register</h2>

        <input
          type="text"
          placeholder="Enter Name"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
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

        <button onClick={registerUser}>
          Register
        </button>

      </div>

    </div>

  );

}

export default Register;