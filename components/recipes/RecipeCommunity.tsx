import React, { useState } from 'react';
import { MessageCircle, Heart, Reply, MoreHorizontal, Camera, Send } from 'lucide-react';
import type { Comment } from '@/components/recipes/types';
import Image from 'next/image';

interface RecipeCommunityProps {
  recipeId: string;
  comments: Comment[];
}

export function RecipeCommunity({ recipeId, comments }: RecipeCommunityProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [newReply, setNewReply] = useState('');

  const handleAddComment = () => {
    if (newComment.trim()) {
      // TODO: Implement comment submission
      console.log('Adding comment:', newComment);
      setNewComment('');
    }
  };

  const handleAddReply = (commentId: string) => {
    if (newReply.trim()) {
      // TODO: Implement reply submission
      console.log('Adding reply to', commentId, ':', newReply);
      setNewReply('');
      setReplyingTo(null);
    }
  };

  const handleLikeComment = (commentId: string) => {
    // TODO: Implement comment liking
    console.log('Liking comment:', commentId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#0B1F3A] mb-4">Community Discussion</h2>
        
        {/* Add Comment Section */}
        <div className="bg-[#F8F9FA] rounded-xl p-4 mb-6">
          <div className="flex space-x-3">
            <div className="w-10 h-10 bg-[#F14C35] rounded-full flex items-center justify-center text-white font-medium">
              U
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this recipe..."
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
                rows={3}
              />
              <div className="flex justify-between items-center mt-3">
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-[#F14C35] transition-colors">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm">Add Photo</span>
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#E63E26] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>Post</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments List */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white border border-gray-100 rounded-xl p-4">
                {/* Comment Header */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-10 h-10 bg-[#F14C35] rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0B1F3A]">{comment.author.name}</h4>
                        <p className="text-sm text-gray-500">{comment.timestamp}</p>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comment Content */}
                <div className="ml-13 mb-3">
                  <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                </div>

                {/* Comment Actions */}
                <div className="ml-13 flex items-center space-x-4">
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-[#F14C35] transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{comment.likes}</span>
                  </button>
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-[#F14C35] transition-colors"
                  >
                    <Reply className="w-4 h-4" />
                    <span className="text-sm">Reply</span>
                  </button>
                </div>

                {/* Reply Input */}
                {replyingTo === comment.id && (
                  <div className="ml-13 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        U
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          placeholder="Write a reply..."
                          className="w-full p-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
                          rows={2}
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAddReply(comment.id)}
                            disabled={!newReply.trim()}
                            className="px-3 py-1 text-sm bg-[#F14C35] text-white rounded hover:bg-[#E63E26] transition-colors disabled:opacity-50"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-13 mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {reply.author.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium text-[#0B1F3A] text-sm">{reply.author.name}</h5>
                              <span className="text-xs text-gray-500">{reply.timestamp}</span>
                            </div>
                            <p className="text-sm text-gray-700">{reply.content}</p>
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <button
                              onClick={() => handleLikeComment(reply.id)}
                              className="flex items-center space-x-1 text-gray-500 hover:text-[#F14C35] transition-colors"
                            >
                              <Heart className="w-3 h-3" />
                              <span className="text-xs">{reply.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
            <p className="text-gray-600 mb-4">
              Be the first to share your thoughts about this recipe!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}