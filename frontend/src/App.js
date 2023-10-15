import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import VideoPage from "./components/VideoPage";
import IndexPage from "./components/IndexPage";
import Register from "./components/Register";
import Login from "./components/Login";
import TeamsPage from "./components/TeamsPage";
import RegisterTeam from "./components/RegisterTeam";
import TeamDashboard from "./components/TeamDashboard";
import React from "react";
import { AppProvider } from "./components/AppContext";

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/video/:videoId" element={<VideoPage />} />
          <Route path="/" element={<IndexPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/register-team" element={<RegisterTeam />} />
          <Route path="/:pageTeamName" element={<TeamDashboard />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
