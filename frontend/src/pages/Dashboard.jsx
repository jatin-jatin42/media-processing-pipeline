import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import socket from "../socket";
import UploadModal from "../components/UploadModal";
import { Plus, Play, Clock, AlertTriangle, CheckCircle, Image as ImageIcon } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [processingJobs, setProcessingJobs] = useState({});

  const fetchVideos = async () => {
    try {
      // Fetch user's own videos if needed, or all videos depending on the requirement.
      // The requirement says "User Isolation: Each user accesses only their own video content"
      const res = await api.get(`/videos?userId=${user._id}`);
      setVideos(res.data.data.videos);
    } catch (err) {
      console.error("Failed to fetch videos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();

    // Listen for socket events
    const handleProcessingUpdate = (data) => {
      setProcessingJobs(prev => ({
        ...prev,
        [data.videoId]: data
      }));

      // If finished, we might want to refresh the video list or update it locally
      if (data.status === "safe" || data.status === "flagged") {
        setVideos(prev => prev.map(v => 
          v._id === data.videoId 
            ? { ...v, status: data.status, analysisNotes: data.message } 
            : v
        ));
        
        // Remove from active processing jobs after a delay
        setTimeout(() => {
          setProcessingJobs(prev => {
            const newJobs = { ...prev };
            delete newJobs[data.videoId];
            return newJobs;
          });
        }, 5000);
      }
    };

    socket.on("processingUpdate", handleProcessingUpdate);

    return () => {
      socket.off("processingUpdate", handleProcessingUpdate);
    };
  }, [user._id]);

  const handleUploadSuccess = (newVideo) => {
    setVideos(prev => [newVideo, ...prev]);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "safe":
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Safe</span>;
      case "flagged":
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Flagged</span>;
      case "processing":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1"><Clock className="w-3 h-3"/> Processing</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Pending</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your videos...</div>;

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Video Library</h1>
          <p className="text-gray-500 mt-1">Manage and track your media processing pipeline.</p>
        </div>
        
        {(user.role === "Editor" || user.role === "Admin") && (
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Upload Video
          </button>
        )}
      </div>

      {Object.keys(processingJobs).length > 0 && (
        <div className="mb-8 space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Processing Jobs</h2>
          {Object.values(processingJobs).map(job => (
            <div key={job.videoId} className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-blue-900">{job.message}</span>
                <span className="font-bold text-blue-600">{job.progress}%</span>
              </div>
              <div className="w-full bg-blue-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-500 ease-out" 
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {videos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No videos yet</h3>
          <p className="text-gray-500 mb-6">Upload your first video to start the analysis pipeline.</p>
          {(user.role === "Editor" || user.role === "Admin") && (
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="text-indigo-600 font-medium hover:text-indigo-700"
            >
              Click here to upload
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map(video => (
            <div key={video._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Play className="w-12 h-12 opacity-50" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(video.status)}
                </div>
                
                {/* Play Overlay */}
                {video.status === "safe" && (
                  <Link to={`/video/${video._id}`} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center text-indigo-600 pl-1 shadow-lg backdrop-blur-sm">
                      <Play className="w-6 h-6" />
                    </div>
                  </Link>
                )}
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 line-clamp-1" title={video.title}>{video.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2 mb-4 flex-1">{video.description || "No description provided."}</p>
                
                {video.analysisNotes && (
                  <div className={`p-3 rounded-lg text-xs font-medium mt-auto ${video.status === 'flagged' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                    {video.analysisNotes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
