import React, { useState, useEffect } from "react";
import axios from "axios";
import "./WebsiteManagement.css";

const WebsiteManagement = () => {
  const [url, setUrl] = useState("");
  const [action, setAction] = useState("block"); // Dropdown action
  const [response, setResponse] = useState("");
  const [blockedWebsites, setBlockedWebsites] = useState([]);

  // Regular expression to validate URLs
  const validateUrl = (inputUrl) => {
    const urlRegex = /^(https?:\/\/)?(www\.)?[\w\-]+\.[\w\-]+(\.[\w\-]+)*(\/[\w\-]*)*\/?$/;
    return urlRegex.test(inputUrl);
  };

  // Normalize the URL to a standard format (e.g., www.example.com)
  const normalizeUrl = (inputUrl) => {
    let formattedUrl = inputUrl.trim();

    // Remove protocol (http:// or https://)
    formattedUrl = formattedUrl.replace(/^(https?:\/\/)/, "");

    // Remove trailing slashes
    formattedUrl = formattedUrl.replace(/\/+$/, "");

    return formattedUrl.startsWith("www.") ? formattedUrl : `www.${formattedUrl}`;
  };

  const fetchBlockedWebsites = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5002/get_blocked_websites");
      const normalizedData = (res.data || []).map(normalizeUrl);
      setBlockedWebsites(normalizedData);
    } catch (error) {
      console.error("Error fetching blocked websites:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateUrl(url)) {
      setResponse("Error: Invalid URL format.");
      return;
    }

    const normalizedInputUrl = normalizeUrl(url);

    // Check for duplicates
    if (blockedWebsites.includes(normalizedInputUrl)) {
      setResponse("Error: This website is already blocked.");
      return;
    }

    const endpoint =
      action === "block"
        ? "http://127.0.0.1:5002/block_website"
        : "http://127.0.0.1:5002/unblock_website";

    try {
      const res = await axios.post(endpoint, { url: normalizedInputUrl });
      setResponse(res.data.message);
      fetchBlockedWebsites(); // Refresh the blocked websites list
      setUrl(""); // Clear the input
    } catch (error) {
      console.error("Error managing website:", error);
      setResponse("Error: Unable to process the request.");
    }
  };

  const handleUnblock = async (urlToUnblock) => {
    try {
      const res = await axios.post("http://127.0.0.1:5002/unblock_website", {
        url: urlToUnblock,
      });
      setResponse(res.data.message);
      fetchBlockedWebsites(); // Refresh the blocked websites list
    } catch (error) {
      console.error("Error unblocking website:", error);
      setResponse("Error: Unable to unblock the website.");
    }
  };

  useEffect(() => {
    fetchBlockedWebsites(); // Fetch blocked websites on component mount
  }, []);

  return (
    <div className="website-management">
      <h2>Website Management</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="url">Website URL:</label>
        <input
          type="text"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="e.g., www.example.com"
          required
        />

        <label htmlFor="action">Action:</label>
        <select
          id="action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="block">Block</option>
          <option value="unblock">Unblock</option>
        </select>

        <button type="submit">Submit</button>
      </form>
      {response && (
        <p
          className={`response ${
            response.startsWith("Error") ? "error" : "success"
          }`}
        >
          {response}
        </p>
      )}

      {/* Table with Blocked Websites */}
      <div className="blocked-websites-container">
        {blockedWebsites.length > 0 ? (
          <table className="blocked-websites-table">
            <thead>
              <tr>
                <th>Website</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {blockedWebsites.map((site, index) => (
                <tr key={index}>
                  <td>{site}</td>
                  <td>
                    <button
                      className="unblock-button"
                      onClick={() => handleUnblock(site)}
                    >
                      Unblock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">No blocked websites to display.</p>
        )}
      </div>
    </div>
  );
};

export default WebsiteManagement;
