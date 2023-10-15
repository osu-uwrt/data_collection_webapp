import React, { useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import axios from "axios";
import { Link } from "react-router-dom";
import { IconButton, Menu, MenuItem, Typography } from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
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

function IndexPage() {
  const [videos, setVideos] = useState([]);
  const [username, setUsername] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // For controlling the dropdown
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get(BASE_URL);
        if (Array.isArray(response.data)) {
          setVideos(response.data);
        } else {
          console.error("Unexpected response structure:", response.data);
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
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

    fetchVideos().then(() => setIsLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove JWT token from local storage
    setUsername(null); // Reset the username state to null
    setAnchorEl(null); // Close the dropdown menu

    setSnackbarMessage("Successfully logged out!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
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
          <img
            src={logo}
            alt="Your Logo"
            style={{ height: "50px", float: "left" }}
          />
        </div>
        <h2 className="header-title" style={{ margin: "0", color: "white" }}>
          Videos
        </h2>
        <div className="header-right">
          {!isLoading && (
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
                      <Typography
                        component={Link}
                        to="/settings"
                        sx={{
                          textDecoration: "none",
                          color: "black",
                        }}
                      >
                        Settings
                      </Typography>
                    </MenuItem>
                    <MenuItem onClick={handleMenuClose}>
                      <Typography
                        component={Link}
                        to="/teams"
                        sx={{ textDecoration: "none", color: "black" }}
                      >
                        Teams
                      </Typography>
                    </MenuItem>
                    <MenuItem>
                      <Typography onClick={handleLogout}>Logout</Typography>
                    </MenuItem>
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
          )}
        </div>
      </div>
      <div className="video-list">
        {videos.map((video) => (
          <div key={video.video_id} className="video-item">
            <Link to={`/video/${video.video_id}`} className="video-link">
              <div className="video-thumbnail">
                <img
                  src={`${BASE_URL}/data/frames/${video.video_id}/frame0.jpg`}
                  alt={`First frame of ${video.video_name}`}
                />
              </div>
              <p className="video-name">{video.video_name}</p>
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

export default IndexPage;
