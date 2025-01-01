// src/App.js
import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./components/Authentication";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./components/Dashboard";
import TrafficGraph from "./components/TrafficGraph";
import ReportPage from "./components/ReportPage";
import DeviceManagement from "./components/DeviceManagement";
import WebsiteManagement from "./components/WebsiteManagement";
import Settings from "./components/Settings"; // New Component
import About from "./components/About"; // New Component
import { Box } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, AuthContext } from "./AuthContext";
import { useLocation } from "react-router-dom";

// RequireAuth component to protect routes
const RequireAuth = ({ children }) => {
  const { isLoggedIn, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isLoggedIn ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

// Define all routes inside a separate component
const AppRoutes = () => {
  const { isLoggedIn, loading, handleLogin, handleLogout } = useContext(AuthContext);

  return (
    <Routes>
      {/* Login Page */}
      <Route
        path="/login"
        element={
          loading ? (
            <div>Loading...</div>
          ) : isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Auth />
          )
        }
      />

      {/* Authenticated Routes */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/report"
        element={
          <RequireAuth>
            <DashboardLayout>
              <ReportPage />
            </DashboardLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/device/:macAddress"
        element={
          <RequireAuth>
            <DashboardLayout>
              <TrafficGraph />
            </DashboardLayout>
          </RequireAuth>
        }
      />

      {/* Device Management Page */}
      <Route
        path="/device-management"
        element={
          <RequireAuth>
            <DashboardLayout>
              <DeviceManagement />
            </DashboardLayout>
          </RequireAuth>
        }
      />

      {/* Website Management Page */}
      <Route
        path="/website-management"
        element={
          <RequireAuth>
            <DashboardLayout>
              <WebsiteManagement />
            </DashboardLayout>
          </RequireAuth>
        }
      />

      {/* Settings Page */}
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </RequireAuth>
        }
      />

      {/* About Page */}
      <Route
        path="/about"
        element={
          <RequireAuth>
            <DashboardLayout>
              <About />
            </DashboardLayout>
          </RequireAuth>
        }
      />

      {/* Default Route */}
      <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Box>
          <AppRoutes />
          <ToastContainer />
        </Box>
      </AuthProvider>
    </Router>
  );
}

export default App;
