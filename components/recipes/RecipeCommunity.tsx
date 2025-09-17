import React, { useState } from 'react';
import { Heart, MessageCircle, Camera, Send, MoreHorizontal } from 'lucide-react';
import { Comment } from '../constants/recipesData';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface RecipeCommunityProps {
  recipeId: string;
  comments: Comment[];
}

export function RecipeCommunity({ recipeId, comments }: RecipeCommunityProps) {
  const [newComment, setNewComment] = useState('');
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const handleLikeComment = (commentId: string) => {
    const newLiked = new Set(likedComments);
    if (newLiked.has(commentId)) {
      newLiked.delete(commentId);
    } else {
      newLiked.add(commentId);
    }
    setLikedComments(newLiked);
  };

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      // In a real app, this would post to the backend
      console.log('New comment:', newComment);
      setNewComment('');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Community Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0B1F3A]">Community</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPhotoUpload(!showPhotoUpload)}
            className="px-4 py-2 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors flex items-center space-x-2"
          >
            <Camera className="w-4 h-4" />
            <span>Share Photo</span>
          </button>
        </div>
      </div>

      {/* Photo Upload Section */}
      {showPhotoUpload && (
        <div className="p-4 bg-[#F8F9FA] rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-[#0B1F3A] mb-2">Share your creation!</h3>
            <p className="text-sm text-gray-600 mb-4">Show others how your dish turned out</p>
            <div className="flex space-x-3">
              <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                Choose Photo
              </button>
              <button className="flex-1 px-4 py-2 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors">
                Take Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment */}
      <div className="space-y-3">
        <div className="flex space-x-3">
          <div className="w-10 h-10 bg-[#F14C35] rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">You</span>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this recipe..."
              className="w-full p-3 border border-gray-200 rounded-xl bg-[#F8F9FA] focus:outline-none focus:border-[#F14C35] focus:ring-2 focus:ring-[#F14C35]/20 resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {newComment.length}/500 characters
              </span>
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Post</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-500 mb-1">No comments yet</h3>
            <p className="text-sm text-gray-400">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-[#F8F9FA] rounded-xl p-4">
              <div className="flex space-x-3">
                <ImageWithFallback
                  src={comment.userAvatar}
                  alt={comment.userName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-[#0B1F3A]">{comment.userName}</h4>
                      <p className="text-sm text-gray-500">{formatTimestamp(comment.timestamp)}</p>
                    </div>
                    <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  <p className="text-gray-700 mb-3 leading-relaxed">{comment.content}</p>

                  {/* Comment Photos */}
                  {comment.photos && comment.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {comment.photos.map((photo, index) => (
                        <ImageWithFallback
                          key={index}
                          src={photo}
                          alt={`Photo by ${comment.userName}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Comment Actions */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center space-x-1 text-sm transition-colors ${
                        likedComments.has(comment.id)
                          ? 'text-[#F14C35]'
                          : 'text-gray-500 hover:text-[#F14C35]'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                      <span>{comment.likes + (likedComments.has(comment.id) ? 1 : 0)}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-[#F14C35] transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Community Stats */}
      <div className="bg-[#F8F9FA] rounded-xl p-4">
        <h3 className="font-medium text-[#0B1F3A] mb-3">Recipe Stats</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">142</p>
            <p className="text-sm text-gray-600">Made it</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">89</p>
            <p className="text-sm text-gray-600">Photos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">4.8</p>
            <p className="text-sm text-gray-600">Avg Rating</p>
          </div>
        </div>
      </div>
    </div>
  );
}
