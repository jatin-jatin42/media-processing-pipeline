import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import socket from "../socket";
import UploadModal from "../components/UploadModal";
import { 
  Plus, Play, Clock, AlertTriangle, CheckCircle, 
  Image as ImageIcon, Loader2, ShieldAlert, ShieldCheck 
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchVideos = async () => {
    try {
      const res = await api.get("/videos");
      setVideos(res.data.data.videos);
    } catch (err) {
      console.error("Failed to fetch videos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();

    // Step 1: Listen for real-time status updates from the backend pipeline
    const handleStatusUpdate = (data) => {
      
      setVideos(prevVideos => prevVideos.map(video => 
        video._id === data.videoId 
          ? { ...video, status: data.status, analysisNotes: data.message } 
          : video
      ));
    };

    socket.on("videoStatusUpdate", handleStatusUpdate);

    // Cleanup listeners on unmount to prevent memory leaks
    return () => {
      socket.off("videoStatusUpdate", handleStatusUpdate);
    };
  }, [user._id]);

  const handleUploadSuccess = (newVideo) => {
    setVideos(prev => [newVideo, ...prev]);
  };

  // Step 2: Visual Status Badges
  const getStatusBadge = (status) => {
    switch(status) {
      case "safe":
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5"/> SAFE
          </span>
        );
      case "flagged":
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200 flex items-center gap-1.5 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5"/> FLAGGED
          </span>
        );
      case "processing":
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1.5 shadow-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin"/> PROCESSING
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-full border border-slate-200 flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3.5 h-3.5"/> PENDING
          </span>
        );
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
      <p className="font-medium">Initializing Dashboard...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Streamit Dashboard</h1>
          <p className="text-gray-500 mt-1 font-medium">Real-time media analysis & secure delivery pipeline.</p>
        </div>
        
        {/* Step 3: RBAC UI Enforcement - Viewers cannot upload */}
        {user.role !== "Viewer" && (
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <Plus className="w-5 h-5" />
            Upload Video
          </button>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
            <ImageIcon className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No videos found</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto font-medium">
            Your library is empty. {user.role === 'Viewer' ? 'Content will appear here once editors upload media.' : 'Upload a video to trigger the analysis pipeline.'}
          </p>
          {user.role !== "Viewer" && (
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
            >
              Start by uploading your first video →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map(video => (
            <div key={video._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group">
              <div className="aspect-video bg-gray-900 relative overflow-hidden">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <Play className="w-12 h-12 text-slate-700" />
                  </div>
                )}
                
                <div className="absolute top-4 right-4 z-10">
                  {getStatusBadge(video.status)}
                </div>
                
                {/* Step 2: Condition Playback & Warning Overlays */}
                {video.status === "safe" && (
                  <Link to={`/video/${video._id}`} className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 pl-1 shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-8 h-8" fill="currentColor" />
                    </div>
                  </Link>
                )}

                {video.status === "flagged" && (
                  <div className="absolute inset-0 bg-rose-950/80 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
                    <ShieldAlert className="w-12 h-12 text-rose-400 mb-3" />
                    <p className="text-white font-bold text-sm">SECURITY BLOCK</p>
                    <p className="text-rose-200 text-xs mt-1">This content violates our safety policy.</p>
                  </div>
                )}

                {video.status === "processing" && (
                  <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
                    <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
                    <p className="text-white font-bold text-sm tracking-widest">ANALYZING</p>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1" title={video.title}>{video.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6 min-h-[40px] leading-relaxed">{video.description || "No description provided."}</p>
                
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-50 rounded-md flex items-center justify-center text-[10px] font-black text-indigo-600">
                      {video.owner?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-tighter">{video.owner?.username}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal Enforcement */}
      {user.role !== "Viewer" && (
        <UploadModal 
          isOpen={isUploadModalOpen} 
          onClose={() => setIsUploadModalOpen(false)} 
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
