import React, { useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import axios from "axios";
import { Link } from "react-router-dom";
import "../App.css";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Slide from "@mui/material/Slide";
import Header from "./Header";
import { useAppContext } from "./AppContext";

const BASE_URL = process.env.REACT_APP_BASE_URL;

function TransitionRight(props) {
  return <Slide {...props} direction="right" />;
}

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function IndexPage() {
  const [videos, setVideos] = useState([]);
  const [teamId, setTeamId] = useState(null);
  const [token, setToken] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // For controlling the dropdown
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const { teamName, setTeamName, username, setUsername } = useAppContext();

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

    const showSnackbar = (message, severity = "success") => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    };

    // Decode the token and set the username
    setToken(localStorage.getItem("token"));
    if (token) {
      try {
        const decoded = jwt_decode(token);
        if (username !== decoded.username) {
          setUsername(decoded.username);
        }
        setTeamId(decoded.team_id);

        (async () => {
          try {
            const response = await fetch(
              `${BASE_URL}/teams/${decoded.team_id}`
            );
            if (response.ok) {
              const data = await response.json();
              setTeamName(data.team_name.toLowerCase().replace(/ /g, "_"));
            } else {
              console.error("Error fetching team name:", response.statusText);
            }
          } catch (err) {
            console.error("Network error fetching team name:", err);
          }
        })();
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }

    fetchVideos();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove JWT token from local storage
    setUsername(null); // Reset the username state to null
    setTeamName(null);
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
      <Header
        teamName={teamName}
        handleMenuOpen={handleMenuOpen}
        anchorEl={anchorEl}
        handleMenuClose={handleMenuClose}
        handleLogout={handleLogout}
      />
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
