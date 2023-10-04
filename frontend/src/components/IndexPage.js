import React, { useState, useEffect } from "react";
import axios from "axios";
import "../App.css";

function IndexPage() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const response = await axios.get("http://localhost:5000/");
        if (Array.isArray(response.data)) {
          setVideos(response.data);
          console.log("Videos:", response.data);
        } else {
          console.error("Unexpected response structure:", response.data);
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    }

    fetchVideos();
  }, []);

  return (
    <div className="index-page">
      <h1 className="title">Available Videos</h1>
      <div className="video-list">
        {videos.map((videoName) => (
          <div key={videoName} className="video-item">
            <a href={`/video/${videoName}`} className="video-link">
              <div className="video-thumbnail">
                <img
                  src={`http://localhost:5000/data/frames/${videoName}/frame0.jpg`}
                  alt={`First frame of ${videoName}`}
                />
              </div>
              <p className="video-name">{videoName}</p>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IndexPage;
