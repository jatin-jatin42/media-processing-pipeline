import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import socket from "../socket";
import UploadModal from "../components/UploadModal";
import { 
  Plus, Play, Clock, AlertTriangle, CheckCircle, 
  Image as ImageIcon, Loader2, ShieldAlert, ShieldCheck,
  Users, LayoutGrid, Trash2, Mail, Shield, Settings,
  UserPlus, Check, X, Globe, Lock, Cpu
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("videos"); // "videos", "users", "settings"
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [assigningVideoId, setAssigningVideoId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "safe", "flagged", "processing"

  const fetchVideos = async () => {
    try {
      const res = await api.get("/videos");
      setVideos(res.data.data.videos);
    } catch (err) {
      console.error("Failed to fetch videos", err);
    }
  };

  const fetchTenantUsers = async () => {
    if (user.role === "Viewer") return; // Viewers don't manage team
    try {
      const res = await api.get("/users/tenant-users");
      setTenantUsers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch tenant users", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchVideos(), fetchTenantUsers()]);
      setLoading(false);
    };
    init();

    const handleStatusUpdate = (data) => {
      setVideos(prevVideos => prevVideos.map(video => 
        video._id === data.videoId 
          ? { ...video, status: data.status, analysisNotes: data.message } 
          : video
      ));
    };

    socket.on("videoStatusUpdate", handleStatusUpdate);
    return () => {
      socket.off("videoStatusUpdate", handleStatusUpdate);
    };
  }, [user._id]);

  const handleUploadSuccess = (newVideo) => {
    setVideos(prev => [newVideo, ...prev]);
  };

  const handleAssignUser = async (videoId, userId) => {
    try {
      await api.post(`/videos/${videoId}/assign`, { userId });
      setAssigningVideoId(null);
      fetchVideos(); 
    } catch (err) {
      alert("Failed to grant access: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUnassignUser = async (videoId, userId) => {
    try {
      await api.post(`/videos/${videoId}/unassign`, { userId });
      fetchVideos(); 
    } catch (err) {
      alert("Failed to revoke access: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchTenantUsers();
    } catch (err) {
      alert("Failed to delete user: " + (err.response?.data?.message || err.message));
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      fetchTenantUsers();
    } catch (err) {
      alert("Failed to change role: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video? This action cannot be undone.")) return;
    try {
      await api.delete(`/videos/${videoId}`);
      setVideos(prev => prev.filter(v => v._id !== videoId));
    } catch (err) {
      alert("Failed to delete video: " + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleStatus = async (videoId, currentStatus) => {
    const newStatus = currentStatus === "flagged" ? "safe" : "flagged";
    try {
      await api.patch(`/videos/${videoId}`, { status: newStatus });
      setVideos(prev => prev.map(v => v._id === videoId ? { ...v, status: newStatus } : v));
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

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
      <p className="font-medium">Initializing Workspace...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Streamit Workspace</h1>
          <p className="text-gray-500 mt-1 font-medium">Organization: <span className="text-indigo-600 font-bold uppercase tracking-wider">{user.tenantId}</span></p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Tabs - Admin Only for Team/Settings oversight */}
          {user.role === "Admin" && (
            <div className="flex bg-gray-100 p-1 rounded-xl mr-4">
              <button 
                onClick={() => setActiveTab("videos")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'videos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                Media
              </button>
              <button 
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Users className="w-4 h-4" />
                Team
              </button>
              <button 
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          )}

          {user.role !== "Viewer" && activeTab === "videos" && (
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-100"
            >
              <Plus className="w-5 h-5" />
              Upload Video
            </button>
          )}
        </div>
      </div>

      {activeTab === "videos" && (
        <>
          {/* Filtering & Management Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 flex items-center gap-3">
              <input 
                type="text" 
                placeholder="Search videos by title..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:max-w-xs px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="safe">Safe Only</option>
                <option value="flagged">Flagged Only</option>
                <option value="processing">Processing Only</option>
              </select>
            </div>
          </div>

          {videos.filter(v => {
            const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || v.status === statusFilter;
            return matchesSearch && matchesStatus;
          }).length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
                <ImageIcon className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No videos found</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto font-medium">
                {videos.length === 0 
                  ? (user.role === 'Viewer' ? 'Assigned media will appear here for read-only access.' : 'Start the pipeline by uploading your first organizational media.')
                  : 'No videos match your current search and filter criteria.'}
              </p>
              {user.role !== "Viewer" && videos.length === 0 && (
                <button onClick={() => setIsUploadModalOpen(true)} className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">
                  Upload now →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {videos.filter(v => {
                const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = statusFilter === "all" || v.status === statusFilter;
                return matchesSearch && matchesStatus;
              }).map(video => (
                <div key={video._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group flex flex-col">
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
                        <p className="text-rose-200 text-xs mt-1">Blocked by analysis engine.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-1 flex-1 pr-2" title={video.title}>{video.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        {user.role !== "Viewer" && (
                          <button 
                            onClick={() => setAssigningVideoId(assigningVideoId === video._id ? null : video._id)}
                            className={`p-1.5 rounded-lg transition-all text-xs font-bold ${assigningVideoId === video._id ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                            title="Manage Access"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                        {(user.role === "Admin" || (user.role === "Editor" && video.owner?._id === user._id)) && (
                          <>
                            <button 
                              onClick={() => handleToggleStatus(video._id, video.status)}
                              className={`p-1.5 rounded-lg transition-all ${video.status === 'flagged' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                              title={video.status === 'flagged' ? 'Mark as Safe' : 'Manually Flag'}
                            >
                              {video.status === 'flagged' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => handleDeleteVideo(video._id)}
                              className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-rose-100 hover:text-rose-600 transition-all"
                              title="Delete Video"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 line-clamp-2 mb-6 min-h-[40px] leading-relaxed">{video.description || "No description provided."}</p>
                    
                    {/* Assign Panel */}
                    {assigningVideoId === video._id && (
                      <div className="mb-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-3">Manage Viewer Access</p>
                        <div className="flex flex-col gap-2">
                          {tenantUsers.filter(u => u.role === "Viewer").length === 0 ? (
                            <span className="text-xs text-indigo-400 italic">No available viewers in organization</span>
                          ) : (
                            tenantUsers.filter(u => u.role === "Viewer").map(vUser => {
                              const hasAccess = video.assignedTo?.includes(vUser._id);
                              return (
                                <div key={vUser._id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-50 shadow-sm">
                                  <span className="text-xs font-bold text-gray-700">@{vUser.username}</span>
                                  {hasAccess ? (
                                    <button 
                                      onClick={() => handleUnassignUser(video._id, vUser._id)}
                                      className="px-2 py-1 bg-rose-50 text-[10px] font-bold text-rose-600 rounded hover:bg-rose-100 transition-colors"
                                    >
                                      Revoke
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleAssignUser(video._id, vUser._id)}
                                      className="px-2 py-1 bg-emerald-50 text-[10px] font-bold text-emerald-600 rounded hover:bg-emerald-100 transition-colors"
                                    >
                                      Grant Access
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-50 rounded-md flex items-center justify-center text-[10px] font-black text-indigo-600">
                          {video.owner?.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-tighter">{video.owner?.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {video.assignedTo?.length > 0 && (
                          <div className="flex -space-x-2">
                            {video.assignedTo.slice(0, 3).map((id, idx) => (
                              <div key={idx} className="w-5 h-5 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[8px] font-black text-indigo-600" title="Assigned">
                                <Check className="w-2 h-2" />
                              </div>
                            ))}
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-gray-300">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "users" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Team Management</h2>
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">Organization Pool: {tenantUsers.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400 font-black">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tenantUsers.map((tUser) => (
                  <tr key={tUser._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs">
                          {tUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{tUser.fullName}</p>
                          <p className="text-xs text-gray-400">@{tUser.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user._id === tUser._id ? (
                        <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter bg-indigo-100 text-indigo-700">
                          {tUser.role} (You)
                        </span>
                      ) : (
                        <select 
                          value={tUser.role}
                          onChange={(e) => handleChangeRole(tUser._id, e.target.value)}
                          className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter outline-none cursor-pointer ${
                            tUser.role === 'Admin' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 
                            tUser.role === 'Editor' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                          } border`}
                        >
                          <option value="Viewer">Viewer</option>
                          <option value="Editor">Editor</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        {tUser.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        Verified
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user._id !== tUser._id && (
                        <button 
                          onClick={() => handleDeleteUser(tUser._id)}
                          className="text-gray-400 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Organization Overview
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Total Users</p>
                    <p className="text-3xl font-black text-indigo-900">{tenantUsers.length}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Total Videos</p>
                    <p className="text-3xl font-black text-emerald-900">{videos.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                Pipeline Health
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-gray-100 rounded-xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Safe Content</p>
                  <p className="text-lg font-bold text-emerald-600">{videos.filter(v => v.status === 'safe').length}</p>
                </div>
                <div className="p-4 border border-gray-100 rounded-xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Flagged Content</p>
                  <p className="text-lg font-bold text-rose-600">{videos.filter(v => v.status === 'flagged').length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100">
              <Globe className="w-8 h-8 mb-4 opacity-50" />
              <h3 className="text-lg font-bold mb-2 text-indigo-100">Tenant Info</h3>
              <p className="text-2xl font-black mb-4 uppercase tracking-tighter truncate" title={user.tenantId}>{user.tenantId}</p>
              <div className="space-y-2 text-sm text-indigo-200 font-medium">
                <div className="flex justify-between"><span>Admin:</span><span>{user.username}</span></div>
                <div className="flex justify-between"><span>Status:</span><span className="text-emerald-300">Operational</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

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
