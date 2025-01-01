// src/components/Authentication.js
import React, { useState, useContext, useRef, useEffect } from "react";
import "./Authentication.css";
import { AuthContext } from "../AuthContext";
import { Box, TextField, Button, Typography } from "@mui/material";
import { toast } from "react-toastify";

const Authentication = () => {
    const { handleLogin } = useContext(AuthContext);
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const usernameRef = useRef(null);

    // Focus on the username input when the component mounts or toggles
    useEffect(() => {
        if (usernameRef.current) {
            usernameRef.current.focus();
        }
    }, [isRegister]);

    const handleAction = async (e) => {
        e.preventDefault();
        const endpoint = isRegister ? "/register" : "/login";

        // Basic client-side validation
        if (username.trim() === "" || password.trim() === "") {
            setError("Both username and password are required.");
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const result = await response.json();
            if (response.ok) {
                if (!isRegister) {
                    handleLogin(username); // Only on login
                } else {
                    toast.success("Registration successful! Please log in.", {
                        position: "top-right",
                        autoClose: 3000,
                        theme: "light",
                    });
                    setIsRegister(false);
                    setUsername("");
                    setPassword("");
                    setError("");
                }
            } else {
                setError(result.message || "An error occurred");
            }
        } catch (err) {
            setError("Server error occurred. Please try again later.");
        }
    };

    const toggleForm = () => {
        setIsRegister(!isRegister);
        setError("");
    };

    return (
        <div className="auth-container">
            {/* Top Bar */}
            <div className="auth-header">
                <img
                    src="/Company-logo.png"
                    alt="Company Logo"
                />
                <div className="auth-title">
                    Layered Machine Learning Framework for IoT Device Security
                </div>
                <img
                    src="/IBA-logo.png"
                    alt="University Logo"
                />
            </div>

            {/* Authentication Form */}
            <div className="auth-form">
                <Typography variant="h4" gutterBottom>
                    {isRegister ? "Register" : "Login"}
                </Typography>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleAction}>
                    <Box mb={2}>
                        <TextField
                            type="text"
                            label="Username"
                            variant="outlined"
                            fullWidth
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            aria-label="Username"
                            inputRef={usernameRef} /* Attach ref for focus management */
                        />
                    </Box>
                    <Box mb={2}>
                        <TextField
                            type="password"
                            label="Password"
                            variant="outlined"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            aria-label="Password"
                        />
                    </Box>
                    <Button type="submit" variant="contained" color="primary" fullWidth aria-label={isRegister ? "Register" : "Login"}>
                        {isRegister ? "Register" : "Login"}
                    </Button>
                </form>
                <div className="toggle-link">
                    {isRegister ? (
                        <>
                            Already have an account?{" "}
                            <a href="#" onClick={toggleForm}>
                                Login here
                            </a>
                        </>
                    ) : (
                        <>
                            Don't have an account?{" "}
                            <a href="#" onClick={toggleForm}>
                                Register here
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Authentication;
