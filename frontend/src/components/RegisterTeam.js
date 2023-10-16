import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Button,
  TextField,
  Container,
  Typography,
  Snackbar,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { makeStyles } from "@mui/styles";
import Slide from "@mui/material/Slide";
import logo from "../logo.svg";
import jwt_decode from "jwt-decode";
import LoadingScreen from "./LoadingScreen";

function TransitionRight(props) {
  return <Slide {...props} direction="right" />;
}

const useStyles = makeStyles({
  whiteBorder: {
    borderColor: "white !important",
  },
  loginContainer: {
    marginTop: "10%", // Or any other desired percentage or fixed value
  },
});

const BASE_URL = process.env.REACT_APP_BASE_URL;

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function Register() {
  const classes = useStyles();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    teamName: "",
  });

  const [token, setToken] = useState(null);
  const [error, setError] = useState({});
  const [teamId, setTeamId] = useState(null);
  const [username, setUsername] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [loading, setLoading] = useState(false);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    if (token) {
      try {
        const decoded = jwt_decode(token);
        setUsername(decoded.username);
        setTeamId(decoded.team_id);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [token]);

  const validate = () => {
    const errors = {};

    if (!formData.teamName) {
      errors.teamName = "Team Name is required";
    }

    setError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      // Assuming the JWT is stored in localStorage and contains the user's ID as "id"
      let ownerId;
      if (token) {
        const decodedToken = jwt_decode(token);
        ownerId = decodedToken.user_id;
        console.log(token, decodedToken, ownerId);
      }

      const requestBody = {
        team_name_reference: formData.teamName.toLowerCase(),
        team_name_display: formData.teamName,
        owner_id: ownerId,
      };

      console.log(requestBody);

      try {
        const response = await fetch(`${BASE_URL}/register-team`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const responseData = await response.json();

        if (response.status === 201) {
          const newToken = responseData.token;
          localStorage.setItem("token", newToken); // Store the new token
          setToken(newToken); // Update the state with the new token
          showSnackbar("Team registered successfully!", "success");
          setLoading(true);
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          showSnackbar(responseData.msg, "error");
        }
      } catch (err) {
        showSnackbar("Network Error: " + err.message, "error");
      }
    } else {
      showSnackbar(
        "Form validation failed. Please check the input values.",
        "error"
      );
    }
  };

  return (
    <div className="index-page">
      {!loading ? (
        <>
          <div className="minimalist-header">
            <div className="header-left">
              <Link to="/" className={classes.hyperLink}>
                <img
                  src={logo}
                  alt="Your Logo"
                  style={{ height: "50px", float: "left" }}
                />
              </Link>
            </div>
          </div>
          {username ? (
            <>
              {!teamId ? (
                <Container
                  component="main"
                  maxWidth="xs"
                  className={classes.loginContainer}
                >
                  <Typography variant="h5">Register</Typography>
                  <form onSubmit={handleSubmit}>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      fullWidth
                      id="teamName"
                      label="Team Name"
                      name="teamName"
                      value={formData.teamName}
                      onChange={handleChange}
                      error={!!error.teamName}
                      helperText={error.teamName}
                      style={{ color: "white" }}
                      InputProps={{
                        style: {
                          color: "white",
                        },
                        classes: {
                          notchedOutline: classes.whiteBorder,
                        },
                      }}
                      InputLabelProps={{
                        style: {
                          color: "white",
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      color="primary"
                    >
                      Register
                    </Button>
                  </form>
                  <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    TransitionComponent={TransitionRight}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  >
                    <div>
                      <Alert
                        onClose={handleCloseSnackbar}
                        severity={snackbarSeverity}
                      >
                        {snackbarMessage}
                      </Alert>
                    </div>
                  </Snackbar>
                </Container>
              ) : (
                <Container
                  component="main"
                  maxWidth="xs"
                  className={classes.loginContainer}
                >
                  <Typography variant="h6">
                    You are already in a team.
                  </Typography>
                  <Typography variant="body2" style={{ marginTop: 16 }}>
                    To register a new team, you must leave your current team
                    first.
                  </Typography>
                </Container>
              )}
            </>
          ) : (
            <Container
              component="main"
              maxWidth="xs"
              style={{ marginTop: "10%", textAlign: "center" }}
            >
              <Typography variant="h5">
                You need an account to create a team.
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
      ) : (
        <LoadingScreen />
      )}
    </div>
  );
}
