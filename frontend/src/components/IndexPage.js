import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../App.css";
const BASE_URL = process.env.REACT_APP_BASE_URL;

function IndexPage() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get(BASE_URL);
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
        {videos.map((video) => (
          <div key={video.video_id} className="video-item">
            <Link to={`/video/${video.video_id}`} className="video-link">
              <div className="video-thumbnail">
                <img
                  src={`${BASE_URL}/data/frames/${video.video_id}/frame0.jpg`}
                  alt={`First frame of ${video.video_name}`}
                />
              </div>
              <p className="video-name">{video.video_name}</p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IndexPage;
