import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Typography, Container } from "@mui/material";
import jwt_decode from "jwt-decode";
import "../App.css";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Slide from "@mui/material/Slide";
import AddIcon from "@mui/icons-material/Add";
import Header from "./Header";
import { useAppContext } from "./AppContext";

const BASE_URL = process.env.REACT_APP_BASE_URL;

function TransitionRight(props) {
  return <Slide {...props} direction="right" />;
}

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function TeamsPage() {
  const { teamName, setTeamName, username, setUsername } = useAppContext();
  const [teamId, setTeamId] = useState(null);
  const [teams, setTeams] = useState([]);
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

    fetchTeams();
  }, [teamName]);

  const handleAddTeamClick = () => {
    navigate("/add-team");
  };

  const formatTeamNameForURL = (teamName) => {
    return teamName.toLowerCase().replace(/ /g, "_");
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove JWT token from local storage
    setUsername(null); // Reset the username state to null
    setTeamName(null);
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
      <Header
        teamName={teamName}
        handleMenuOpen={handleMenuOpen}
        anchorEl={anchorEl}
        handleMenuClose={handleMenuClose}
        handleLogout={handleLogout}
      />
      {username ? (
        <div className="team-list">
          {teams.map((team) => (
            <div key={team.team_id} className="team-item">
              <Link
                to={`/${formatTeamNameForURL(team.team_name)}`}
                className="team-link"
              >
                <div className="team-thumbnail">
                  {team.thumbnail ? (
                    <img
                      src={`${BASE_URL}/data/teams/${team.team_id}/${team.thumbnail}`}
                      alt={`Team ${team.team_name}`}
                    />
                  ) : (
                    <div className="blank-thumbnail"></div>
                  )}
                </div>
                <p className="team-name">{team.team_name}</p>
              </Link>
            </div>
          ))}
          {!teamId && (
            <div className="team-item">
              <Link to="/register-team" className="team-link">
                <div
                  className="team-thumbnail"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AddIcon style={{ fontSize: "5em", color: "#aaa" }} />
                </div>
                <p className="team-name">Add Team</p>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <Container
          component="main"
          maxWidth="xs"
          style={{ marginTop: "10%", textAlign: "center" }}
        >
          <Typography variant="h5">
            You need an account to see the teams.
          </Typography>
          <Typography
            variant="body2"
            style={{
              marginTop: 16,
            }}
          >
            Sign up now{" "}
            <Link to="/register" style={{ textDecoration: "underline" }}>
              Register
            </Link>
          </Typography>
          <Typography
            variant="body2"
            style={{
              marginTop: 16,
            }}
          >
            Already have an account?{" "}
            <Link to="/login" style={{ textDecoration: "underline" }}>
              Login
            </Link>
          </Typography>
        </Container>
      )}

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
