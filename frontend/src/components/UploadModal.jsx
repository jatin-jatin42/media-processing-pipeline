import React, { useState } from "react";
import { Upload, X } from "lucide-react";
import api from "../api/axios";

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError("Please select a video file.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("videoFile", videoFile);
    if (thumbnailFile) {
      formData.append("thumbnail", thumbnailFile);
    }

    try {
      const res = await api.post("/videos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      onUploadSuccess(res.data.data);
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setThumbnailFile(null);
      setUploadProgress(0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload video.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            Upload Video
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Video title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video File * (MP4, WebM)</label>
            <input 
              type="file" 
              accept="video/*"
              required
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              onChange={(e) => setVideoFile(e.target.files[0])}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              onChange={(e) => setThumbnailFile(e.target.files[0])}
            />
          </div>

          {loading && uploadProgress > 0 && (
            <div className="pt-2 pb-4">
              <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
                <span>Uploading to Cloudinary...</span>
                <span className="text-indigo-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-indigo-50 rounded-full h-2.5 overflow-hidden border border-indigo-100">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out relative" 
                  style={{ width: `${uploadProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {uploadProgress === 100 ? "Processing..." : "Uploading..."}
                </>
              ) : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
