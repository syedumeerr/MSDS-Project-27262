// src/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  // Load initial state from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    const savedIsLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (savedUsername && savedIsLoggedIn) {
      setUsername(savedUsername);
      setIsLoggedIn(true);
    }

    setLoading(false); // Mark as loaded
  }, []);

  // Handle login
  const handleLogin = (username) => {
    setIsLoggedIn(true);
    setUsername(username);

    // Save login state to localStorage
    localStorage.setItem("username", username);
    localStorage.setItem("isLoggedIn", "true");

    toast.success(`Welcome back, ${username}!`, {
      position: "top-right",
      autoClose: 3000,
      theme: "light",
    });

    navigate("/dashboard", { replace: true });
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");

    // Clear login state from localStorage
    localStorage.removeItem("username");
    localStorage.removeItem("isLoggedIn");

    toast.info("Logged out successfully!", {
      position: "top-right",
      autoClose: 3000,
      theme: "light",
    });

    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, username, loading, handleLogin, handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
