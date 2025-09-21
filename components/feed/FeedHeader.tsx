import { Menu, MessageCircle, User } from "lucide-react";
import { Badge } from "../ui/badge";

interface FeedHeaderProps {
  onNavigateToChat?: () => void;
  onNavigateToPlate?: () => void;
  onTogglePageSelector?: () => void;
  unreadChatCount?: number;
}

export function FeedHeader({
  onNavigateToChat,
  onNavigateToPlate,
  onTogglePageSelector,
  unreadChatCount = 0,
}: FeedHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 z-40 sticky top-0">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <h1 className="text-lg font-bold text-[#F14C35]">FUZO</h1>
          <p className="text-xs text-gray-500">Feed</p>
        </div>

        {/* Action Icons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateToChat}
            className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors relative"
          >
            <MessageCircle className="w-4 h-4 text-gray-600" />
            {unreadChatCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 w-3.5 h-3.5 text-xs flex items-center justify-center p-0 bg-red-500 hover:bg-red-500"
              >
                {unreadChatCount > 9 ? "9+" : unreadChatCount}
              </Badge>
            )}
          </button>
          <button
            onClick={onNavigateToPlate}
            className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <User className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onTogglePageSelector}
            className="w-9 h-9 rounded-xl bg-[#F14C35] hover:bg-[#A6471E] text-white flex items-center justify-center transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
