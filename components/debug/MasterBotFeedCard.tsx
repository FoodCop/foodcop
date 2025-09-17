import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Bookmark, MapPin, Star, MoreHorizontal, Verified } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { BotPost, MasterBot, getMasterBotById } from './constants/masterBotsData';

interface MasterBotFeedCardProps {
  post: BotPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onViewLocation?: (location: string) => void;
  className?: string;
}

export function MasterBotFeedCard({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  onViewLocation,
  className = ''
}: MasterBotFeedCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  // Get the bot that created this post
  const bot = getMasterBotById(post.id.split('-')[1] || '');

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(post.id);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.(post.id);
  };

  const handleLocationClick = () => {
    if (post.location) {
      onViewLocation?.(post.location);
    }
  };

  const truncatedContent = post.content.length > 150 
    ? post.content.substring(0, 150) + '...' 
    : post.content;

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden relative">
            <ImageWithFallback
              src={bot?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'}
              alt={bot?.name || 'Master Bot'}
              className="w-full h-full object-cover"
            />
            {/* AI Bot Indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#F14C35] rounded-full flex items-center justify-center">
              <Verified className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-[#0B1F3A]">{bot?.name || 'Master Bot'}</h3>
              <span className="px-2 py-0.5 bg-[#FFD74A]/20 text-[#A6471E] rounded-full text-xs font-medium">
                Master Explorer
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{bot?.username || '@master_bot'}</span>
              <span>•</span>
              <span>{new Date(post.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <h4 className="font-bold text-[#0B1F3A] mb-2">{post.title}</h4>
        <p className="text-gray-700 leading-relaxed">
          {showFullContent ? post.content : truncatedContent}
          {post.content.length > 150 && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-[#F14C35] font-medium ml-1 hover:underline"
            >
              {showFullContent ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>
      </div>

      {/* Location */}
      {post.location && (
        <div className="px-4 pb-3">
          <button
            onClick={handleLocationClick}
            className="flex items-center space-x-1 text-[#F14C35] hover:underline group"
          >
            <MapPin className="w-4 h-4 group-hover:text-[#E63E26] transition-colors" />
            <span className="text-sm font-medium">{post.location}</span>
          </button>
        </div>
      )}

      {/* Image */}
      <div className="aspect-video relative overflow-hidden">
        <ImageWithFallback
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        {/* Rating Overlay */}
        {post.rating && (
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-white text-sm font-medium">{post.rating}</span>
          </div>
        )}
        {/* Cuisine Badge */}
        {post.cuisine && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
            <span className="text-sm font-medium text-[#0B1F3A]">{post.cuisine}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="p-4">
        <div className="flex flex-wrap gap-1 mb-4">
          {post.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-[#F14C35]/10 text-[#F14C35] rounded-full text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
          {post.tags.length > 4 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              +{post.tags.length - 4} more
            </span>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{post.likes + (isLiked ? 1 : 0)} likes</span>
            <span>{post.comments} comments</span>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <motion.button
              onClick={handleLike}
              className="flex items-center space-x-2 group"
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isLiked
                      ? 'text-red-500 fill-current'
                      : 'text-gray-600 group-hover:text-red-500'
                  }`}
                />
              </motion.div>
              <span
                className={`text-sm font-medium transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-600'
                }`}
              >
                Like
              </span>
            </motion.button>

            <button
              onClick={() => onComment?.(post.id)}
              className="flex items-center space-x-2 text-gray-600 hover:text-[#F14C35] transition-colors group"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Comment</span>
            </button>

            <button
              onClick={() => onShare?.(post.id)}
              className="flex items-center space-x-2 text-gray-600 hover:text-[#F14C35] transition-colors group"
            >
              <Share className="w-5 h-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>

          <motion.button
            onClick={handleSave}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ scale: isSaved ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Bookmark
                className={`w-5 h-5 transition-colors ${
                  isSaved
                    ? 'text-[#F14C35] fill-current'
                    : 'text-gray-600 hover:text-[#F14C35]'
                }`}
              />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Bot Voice Indicator */}
      <div className="px-4 pb-4">
        <div className="bg-[#F14C35]/5 rounded-lg p-3 border-l-4 border-[#F14C35]">
          <p className="text-xs text-gray-600">
            <span className="font-medium text-[#F14C35]">AI Explorer Voice:</span> {bot?.personalityTraits.join(', ') || 'Authentic food storytelling'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Master Bot Posts Feed Component
interface MasterBotPostsFeedProps {
  posts?: BotPost[];
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onViewLocation?: (location: string) => void;
  className?: string;
}

export function MasterBotPostsFeed({
  posts = [],
  onLike,
  onComment,
  onShare,
  onSave,
  onViewLocation,
  className = ''
}: MasterBotPostsFeedProps) {
  if (posts.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">🧑‍🚀</div>
        <h3 className="text-xl font-bold text-[#0B1F3A] mb-2">No Master Bot Posts Yet</h3>
        <p className="text-gray-600">Our AI explorers are discovering new food adventures!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {posts.map((post) => (
        <MasterBotFeedCard
          key={post.id}
          post={post}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          onSave={onSave}
          onViewLocation={onViewLocation}
        />
      ))}
    </div>
  );
}
