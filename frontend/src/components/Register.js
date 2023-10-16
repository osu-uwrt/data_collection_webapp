import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Button,
  TextField,
  Container,
  Typography,
  Snackbar,
  InputAdornment,
  IconButton,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { makeStyles } from "@mui/styles";
import Slide from "@mui/material/Slide";
import logo from "../logo.svg";
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
    username: "",
    password: "",
    email: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState({});
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

  const validate = () => {
    const errors = {};

    if (formData.username.length < 4 || formData.username.length > 20) {
      errors.username = "Username must be between 4 to 20 characters";
    }

    const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!regex.test(formData.password)) {
      errors.password =
        "Password must be at least 8 characters and contain a mix of letters and numbers";
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email must be a valid email format";
    }

    setError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (response.status === 201) {
        // If the backend sends a token upon successful registration,
        // store it the same way as you do for login.
        localStorage.setItem("token", responseData.token);

        showSnackbar("User registered and logged in successfully!", "success");
        setLoading(true);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        showSnackbar(responseData.msg, "error");
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
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={formData.username}
                onChange={handleChange}
                error={!!error.username}
                helperText={error.username}
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
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="email"
                label="Email Address"
                id="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                error={!!error.email}
                helperText={error.email}
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
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                error={!!error.password}
                helperText={error.password}
                style={{ color: "white" }}
                className="white-label"
                InputProps={{
                  style: {
                    color: "white",
                  },
                  classes: {
                    notchedOutline: classes.whiteBorder,
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOff style={{ color: "white" }} />
                        ) : (
                          <Visibility style={{ color: "white" }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
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

              <Typography
                variant="body2"
                style={{ marginTop: 16, textAlign: "center" }}
              >
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{ color: "white", textDecoration: "underline" }}
                >
                  Login
                </Link>
              </Typography>
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
        </>
      ) : (
        <LoadingScreen />
      )}
    </div>
  );
}
