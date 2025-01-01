import React, { useState } from "react";
import axios from "axios";
import "./Settings.css";

const Settings = () => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [response, setResponse] = useState("");

  // Old feature states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [themeMode, setThemeMode] = useState("Light");

  const handleProfilePictureChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePicture) {
      setResponse("Please select a profile picture.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", profilePicture);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/update-profile-picture",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResponse(response.data.message);
    } catch (error) {
      setResponse("Error uploading profile picture.");
      console.error("Error:", error);
    }
  };

  const handleUpdateUsername = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/update-username", { username });
      setResponse(response.data.message);
    } catch (error) {
      setResponse("Error updating username.");
      console.error("Error:", error);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/update-password", { password });
      setResponse(response.data.message);
    } catch (error) {
      setResponse("Error updating password.");
      console.error("Error:", error);
    }
  };

  const handleSaveSettings = () => {
    setResponse("Settings saved successfully!");
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      {/* Profile Picture Update */}
      <div className="settings-section">
        <label htmlFor="profilePicture">Update Profile Picture:</label>
        <input type="file" id="profilePicture" onChange={handleProfilePictureChange} />
        <button onClick={handleProfilePictureUpload}>Upload</button>
      </div>

      {/* Username Update */}
      <div className="settings-section">
        <label htmlFor="username">Change Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter new username"
        />
        <button onClick={handleUpdateUsername}>Update Username</button>
      </div>

      {/* Password Update */}
      <div className="settings-section">
        <label htmlFor="password">Change Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
        />
        <button onClick={handleUpdatePassword}>Update Password</button>
      </div>

      {/* Notifications */}
      <div className="settings-section">
        <label>Notifications:</label>
        <input
          type="checkbox"
          checked={notificationsEnabled}
          onChange={() => setNotificationsEnabled(!notificationsEnabled)}
        />
        Enable Notifications
      </div>

      {/* Language */}
      <div className="settings-section">
        <label htmlFor="language">Preferred Language:</label>
        <select
          id="language"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
        </select>
      </div>

      {/* Theme Mode */}
      <div className="settings-section">
        <label>Theme Mode:</label>
        <div className="theme-options">
          <input
            type="radio"
            name="themeMode"
            value="Light"
            checked={themeMode === "Light"}
            onChange={() => setThemeMode("Light")}
          />
          Light
          <input
            type="radio"
            name="themeMode"
            value="Dark"
            checked={themeMode === "Dark"}
            onChange={() => setThemeMode("Dark")}
          />
          Dark
        </div>
      </div>

      <button className="save-button" onClick={handleSaveSettings}>
        Save Settings
      </button>
      {response && <p className={`response ${response.startsWith("Error") ? "error" : "success"}`}>{response}</p>}
    </div>
  );
};

export default Settings;
