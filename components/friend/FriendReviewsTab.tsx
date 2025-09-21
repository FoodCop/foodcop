import { MessageCircle, Star } from "lucide-react";
import { UserReview } from "../constants/profileData";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface FriendReviewsTabProps {
  reviews: UserReview[];
}

export function FriendReviewsTab({ reviews }: FriendReviewsTabProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "text-yellow-500 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#0B1F3A] mb-1">
          Food Reviews
        </h2>
        <p className="text-sm text-gray-600">
          {reviews.length} honest opinions shared
        </p>
      </div>

      {reviews.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-[#0B1F3A] mb-2">
            No reviews yet
          </h3>
          <p className="text-gray-600">
            This friend hasn't written any reviews yet.
          </p>
        </div>
      ) : (
        /* Reviews List */
        <div className="space-y-6">
          {reviews.map((review) => {
            const totalLikes = review.likes;

            return (
              <div
                key={review.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Restaurant Header */}
                <div className="flex items-center space-x-3 p-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={review.placeImage}
                      alt={review.placeName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#0B1F3A]">
                      {review.placeName}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-500">
                        • {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="p-4">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {review.reviewText}
                  </p>

                  {/* Review Photos */}
                  {review.photos && review.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {review.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="aspect-square rounded-lg overflow-hidden"
                        >
                          <ImageWithFallback
                            src={photo}
                            alt={`Review photo ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-[#0B1F3A] transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Stats */}
      <div className="bg-[#F8F9FA] rounded-xl p-4">
        <h3 className="font-medium text-[#0B1F3A] mb-3">Review Insights</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">
              {reviews.length}
            </p>
            <p className="text-xs text-gray-600">Reviews Written</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">
              {reviews.length > 0
                ? Math.round(
                    (reviews.reduce((sum, review) => sum + review.rating, 0) /
                      reviews.length) *
                      10
                  ) / 10
                : 0}
            </p>
            <p className="text-xs text-gray-600">Avg Rating Given</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">
              {reviews.reduce((sum, review) => sum + review.likes, 0)}
            </p>
            <p className="text-xs text-gray-600">Total Likes</p>
          </div>
        </div>
      </div>

      {/* Social Prompt */}
      <div className="bg-gradient-to-r from-[#F14C35]/5 to-[#A6471E]/5 rounded-xl p-4 border border-[#F14C35]/20">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">💭</div>
          <div>
            <h4 className="font-medium text-[#0B1F3A] mb-1">
              Trust Their Taste
            </h4>
            <p className="text-sm text-gray-600">
              Save their reviews and discover your next great meal!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
