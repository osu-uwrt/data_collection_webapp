import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import VideoPage from "./components/VideoPage";
import IndexPage from "./components/IndexPage";
import Register from "./components/Register";
import Login from "./components/Login";
import React from "react";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/video/:videoId" element={<VideoPage />} />
        <Route path="/" element={<IndexPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
