import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import VideoPage from './components/VideoPage';
import IndexPage from './components/IndexPage';
import React from 'react';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/video/:videoName" element={<VideoPage />} />
                <Route path="/" element={<IndexPage />} />
            </Routes>
        </Router>
    );
}

export default App;
