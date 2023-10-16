import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Button,
  Container,
  Typography,
  Snackbar,
  LinearProgress,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { makeStyles } from "@mui/styles";
import Slide from "@mui/material/Slide";
import logo from "../logo.svg";
import jwt_decode from "jwt-decode";
import ProgressBar from "./ProgressBar";

function TransitionRight(props) {
  return <Slide {...props} direction="right" />;
}

const useStyles = makeStyles({
  whiteBorder: {
    borderColor: "white !important",
  },
  container: {
    marginTop: "10%",
  },
  progressBar: {
    marginTop: "15px",
  },
});

const BASE_URL = process.env.REACT_APP_BASE_URL;

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function AddVideo() {
  const classes = useStyles();
  const navigate = useNavigate();

  const [videoFile, setVideoFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [teamId, setTeamId] = useState(null);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwt_decode(token);
        setTeamId(decoded.team_id);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setProgress(0);
    setLoading(true);

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("team_id", teamId);

    try {
      const response = await axios.post(`${BASE_URL}/add-video`, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      if (response.status === 200) {
        showSnackbar("Video uploaded successfully!", "success");
        navigate("/");
      } else {
        setLoading(false); // Reset the loading state to show the form again
        setProgress(0); // Reset progress bar
        showSnackbar(response.data.error, "error");
      }
    } catch (err) {
      setLoading(false); // Reset the loading state to show the form again
      setProgress(0); // Reset progress bar
      showSnackbar("Network Error: " + err.message, "error");
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
            className={classes.container}
          >
            <Typography variant="h5">Add Video</Typography>
            <form onSubmit={handleSubmit}>
              <Button variant="contained" component="label" fullWidth>
                Choose File
                <input
                  type="file"
                  hidden
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  required
                />
              </Button>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                style={{ marginTop: "16px" }}
              >
                Upload
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
        </>
      ) : (
        <ProgressBar progress={progress} />
      )}
    </div>
  );
}
