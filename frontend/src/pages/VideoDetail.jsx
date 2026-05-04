import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function VideoDetail() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await api.get(`/videos/${videoId}`);
        const v = res.data.data;
        
        // Prevent watching flagged videos
        if (v.status === "flagged") {
          setError("This video has been flagged for sensitive content and cannot be viewed.");
          setVideo(v);
        } else if (v.status !== "safe") {
          setError("This video is still processing.");
          setVideo(v);
        } else {
          setVideo(v);
        }
      } catch (err) {
        setError("Failed to load video details.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading video...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>

      {error ? (
        <div className="bg-red-50 border border-red-100 p-8 rounded-2xl text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Access Restricted</h2>
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        video && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* 
              Streaming via our API.
              The backend /api/v1/videos/stream/:videoId handles the HTTP Range requests.
              We construct the URL directly so the browser can handle the stream fetching natively.
            */}
            <div className="aspect-video bg-black relative">
              <video 
                className="w-full h-full"
                controls 
                autoPlay
                crossOrigin="use-credentials"
                poster={video.thumbnail}
                src={`${import.meta.env.VITE_API_URL || "/api/v1"}/videos/stream/${video._id}`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
              
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                  {video.owner?.username?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{video.owner?.fullName || "Unknown User"}</p>
                  <p className="text-xs text-gray-500">Uploaded {new Date(video.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="prose max-w-none text-gray-700">
                <p className="whitespace-pre-wrap">{video.description || "No description provided."}</p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
