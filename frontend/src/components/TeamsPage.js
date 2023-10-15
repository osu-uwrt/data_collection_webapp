import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { IconButton, Menu, MenuItem } from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import jwt_decode from "jwt-decode";
import "../App.css";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Slide from "@mui/material/Slide";
import logo from "../logo.svg";

const BASE_URL = process.env.REACT_APP_BASE_URL;

function TransitionRight(props) {
  return <Slide {...props} direction="right" />;
}

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [username, setUsername] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // For controlling the dropdown
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/teams`);
        if (Array.isArray(response.data)) {
          setTeams(response.data);
        } else {
          console.error("Unexpected response structure:", response.data);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    // Decode the token and set the username
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwt_decode(token);
        setUsername(decoded.username);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }

    fetchTeams();
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove JWT token from local storage
    setUsername(null); // Reset the username state to null
    setAnchorEl(null); // Close the dropdown menu

    navigate("/");
  };

  // Handle dropdown menu actions
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className="index-page">
      <div className="minimalist-header">
        <div className="header-left">
          <Link to="/">
            <img
              src={logo}
              alt="Your Logo"
              style={{ height: "50px", float: "left" }}
            />
          </Link>
        </div>
        <h2 className="header-title" style={{ margin: "0", color: "white" }}>
          Teams
        </h2>
        <div className="header-right">
          <div style={{ float: "right" }}>
            {username ? (
              <>
                <span style={{ color: "white", marginRight: "8px" }}>
                  {username}
                </span>
                <IconButton
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenuOpen}
                  style={{ color: "white" }}
                >
                  <AccountCircle fontSize="large" />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleMenuClose}>
                    <Link to="/settings">Settings</Link>
                  </MenuItem>
                  <MenuItem onClick={handleMenuClose}>
                    <Link to="/teams">Teams</Link>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="auth-text-link"
                  style={{ marginRight: "16px" }}
                >
                  Login
                </Link>
                <Link to="/register" className="auth-text-link">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="team-list">
        {teams.map((team) => (
          <div key={team.team_id} className="team-item">
            <Link to={`/team/${team.team_id}`} className="team-link">
              <div className="team-thumbnail">
                {/* Adjust the path or use a default thumbnail */}
                <img
                  src={team.thumbnail || "path_to_default_thumbnail"}
                  alt={`Team ${team.team_name}`}
                />
              </div>
              <p className="team-name">{team.team_name}</p>
            </Link>
          </div>
        ))}
      </div>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        TransitionComponent={TransitionRight}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <div>
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
          >
            {snackbarMessage}
          </Alert>
        </div>
      </Snackbar>
    </div>
  );
}

export default TeamsPage;
