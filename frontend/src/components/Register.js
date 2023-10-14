import React, { useState } from "react";
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

const BASE_URL = process.env.REACT_APP_BASE_URL;

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const validate = () => {
    const errors = {};

    if (formData.username.length < 4 || formData.username.length > 20) {
      errors.username = "Username must be between 4 to 20 characters";
    }

    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
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

      if (response.status === 201) {
        console.log("User registered successfully");
        // You can navigate to a login page or display a success message here.
      } else {
        console.log("Error registering user");
        // Handle errors, maybe display an error message to the user.
      }
    } else {
      setOpenSnackbar(true);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
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
              borderColor: "white",
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
              borderColor: "white",
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
            className: "white-input",
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
        <Button type="submit" fullWidth variant="contained" color="primary">
          Register
        </Button>
      </form>
    </Container>
  );
}
