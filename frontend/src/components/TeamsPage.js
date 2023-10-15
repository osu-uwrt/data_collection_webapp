import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, NavLink } from "react-router-dom";
import {
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Container,
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import jwt_decode from "jwt-decode";
import "../App.css";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Slide from "@mui/material/Slide";
import logo from "../logo.svg";
import AddIcon from "@mui/icons-material/Add";

const BASE_URL = process.env.REACT_APP_BASE_URL;

function TransitionRight(props) {
  return <Slide {...props} direction="right" />;
}

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function TeamsPage() {
  const [teamName, setTeamName] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [teams, setTeams] = useState([]);
  const [username, setUsername] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // For controlling the dropdown
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [isLoading, setIsLoading] = useState(true);

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
        setTeamId(decoded.team_id);

        (async () => {
          try {
            const response = await fetch(
              `${BASE_URL}/teams/${decoded.team_id}`
            );
            if (response.ok) {
              const data = await response.json();
              console.log(data);
              setTeamName(data.team_name.toLowerCase().replace(/ /g, "_"));
            } else {
              console.error("Error fetching team name:", response.statusText);
            }
          } catch (err) {
            console.error("Network error fetching team name:", err);
          }
        })();

        console.log(decoded);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }

    fetchTeams().then(() => setIsLoading(false));
  }, [teamName]);

  const handleAddTeamClick = () => {
    navigate("/add-team");
  };

  const formatTeamNameForURL = (teamName) => {
    return teamName.replace(/ /g, "_");
  };

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
        <Typography fontSize="large">
          <NavLink
            to="/"
            exact
            activeClassName="active-link"
            style={{ color: "white", marginRight: "32px" }}
          >
            Home
          </NavLink>
          <NavLink
            to="/teams"
            activeClassName="active-link"
            style={{ color: "white", marginRight: "32px" }}
          >
            Teams
          </NavLink>
          <NavLink
            to={`/${teamName}`}
            activeClassName="active-link"
            style={{ color: "white", marginRight: "32px" }}
          >
            My Team
          </NavLink>
        </Typography>
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
      {!isLoading && (
        <>
          {username ? (
            <div className="team-list">
              {teams.map((team) => (
                <div key={team.team_id} className="team-item">
                  <Link
                    to={`/${formatTeamNameForURL(team.team_name)}`}
                    className="team-link"
                  >
                    <div className="team-thumbnail">
                      <img
                        src={
                          team.thumbnail
                            ? `${BASE_URL}/data/teams/${team.team_id}/${team.thumbnail}`
                            : "path_to_default_thumbnail"
                        }
                        alt={`Team ${team.team_name}`}
                      />
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
        </>
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
