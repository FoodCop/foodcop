import { motion } from "framer-motion";
import { Clock, Heart, MapPin, MessageCircle, Share, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";

export interface MasterbotPost {
  id: string;
  type: "restaurant" | "recipe" | "story";
  title: string;
  content: string;
  image: string;
  location?: string;
  cuisine?: string;
  rating?: number;
  tags: string[];
  timestamp: string;
  likes: number;
  comments: number;
  voice: string;
  bot_username: string;
  bot_name: string;
  bot_avatar: string;
  restaurant_name?: string;
  price_range?: string;
  delivery_time?: string;
}

interface MasterbotPostCardProps {
  post: MasterbotPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSaveToPlate?: (postId: string) => void;
}

export function MasterbotPostCard({
  post,
  onLike,
  onComment,
  onShare,
  onSaveToPlate,
}: MasterbotPostCardProps) {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - postTime.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return postTime.toLocaleDateString();
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "restaurant":
        return "bg-blue-100 text-blue-800";
      case "recipe":
        return "bg-green-100 text-green-800";
      case "story":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <motion.div
      className="min-w-[300px] cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
        {/* Image */}
        <div className="relative h-48">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <Badge className={`${getPostTypeColor(post.type)} border-0`}>
              {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
            </Badge>
          </div>
          {post.rating && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-gray-900">
                {post.rating}
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Bot Profile */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={post.bot_avatar} alt={post.bot_name} />
              <AvatarFallback>{post.bot_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {post.bot_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {post.bot_username}
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {formatTimeAgo(post.timestamp)}
            </span>
          </div>

          {/* Title and Content */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {post.content}
          </p>

          {/* Location and Cuisine */}
          {(post.location || post.cuisine) && (
            <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
              {post.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{post.location}</span>
                </div>
              )}
              {post.cuisine && (
                <div className="flex items-center gap-1">
                  <span>•</span>
                  <span>{post.cuisine}</span>
                </div>
              )}
            </div>
          )}

          {/* Restaurant Details */}
          {post.restaurant_name && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {post.restaurant_name}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                {post.price_range && <span>{post.price_range}</span>}
                {post.delivery_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{post.delivery_time}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700"
                >
                  {tag}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700"
                >
                  +{post.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onLike?.(post.id)}
                className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span className="text-sm">{post.likes}</span>
              </button>
              <button
                onClick={() => onComment?.(post.id)}
                className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">{post.comments}</span>
              </button>
              <button
                onClick={() => onShare?.(post.id)}
                className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-colors"
              >
                <Share className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => onSaveToPlate?.(post.id)}
              className="text-xs text-[#F14C35] hover:text-[#E63E26] font-medium transition-colors"
            >
              Save to Plate
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
