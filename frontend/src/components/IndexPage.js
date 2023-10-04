import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../App.css";

function IndexPage() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get("http://192.168.1.3:5000/");
        if (Array.isArray(response.data)) {
          setVideos(response.data);
        } else {
          console.error("Unexpected response structure:", response.data);
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="index-page">
      <h1 className="title">Available Videos</h1>
      <div className="video-list">
        {videos.map((videoName) => (
          <div key={videoName} className="video-item">
            <Link to={`/video/${videoName}`} className="video-link">
              <div className="video-thumbnail">
                <img
                  src={`http://192.168.1.3:5000/data/frames/${videoName}/frame0.jpg`}
                  alt={`First frame of ${videoName}`}
                />
              </div>
              <p className="video-name">{videoName}</p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IndexPage;
