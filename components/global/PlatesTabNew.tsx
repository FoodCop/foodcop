import { motion } from "framer-motion";
import {
  Bookmark,
  Camera,
  ChefHat,
  Grid3X3,
  List,
  MapPin,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import {
  ItemType,
  SavedItem,
  savedItemsService,
} from "../services/savedItemsService";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";

type ViewMode = "grid" | "list";
type SortBy = "recent" | "name" | "type";
type FilterType = "all" | ItemType;

interface PlatesTabNewProps {
  variant?: "profile" | "scout";
  onItemClick?: (item: SavedItem) => void;
  onItemUnsave?: (item: SavedItem) => void;
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  showStats?: boolean;
  className?: string;
}

export function PlatesTabNew({
  variant = "profile",
  onItemClick,
  onItemUnsave,
  showSearch = true,
  showFilters = true,
  showViewToggle = true,
  showStats = true,
  className = "",
}: PlatesTabNewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<ItemType, number>>({
    restaurant: 0,
    recipe: 0,
    photo: 0,
    other: 0,
  });
  const { user } = useAuth();

  // Load saved items from backend
  useEffect(() => {
    if (user) {
      loadSavedItems();
    }
  }, [user]);

  const loadSavedItems = async () => {
    try {
      setLoading(true);
      const [items, itemCounts] = await Promise.all([
        savedItemsService.listSavedItems(),
        savedItemsService.getSavedItemsCount(),
      ]);

      setSavedItems(items);
      setCounts(itemCounts);
      console.log("✅ Loaded saved items:", items.length);
    } catch (error) {
      console.error("❌ Failed to load saved items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveItem = async (item: SavedItem) => {
    try {
      const result = await savedItemsService.unsaveItem({
        itemId: item.item_id,
        itemType: item.item_type,
      });

      if (result.success) {
        setSavedItems((prev) => prev.filter((i) => i.id !== item.id));
        setCounts((prev) => ({
          ...prev,
          [item.item_type]: prev[item.item_type] - 1,
        }));
        onItemUnsave?.(item);
      }
    } catch (error) {
      console.error("❌ Failed to unsave item:", error);
    }
  };

  // Filter and sort items
  const filteredItems = savedItems.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.metadata.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "all" || item.item_type === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.metadata.title || a.item_id).localeCompare(
          b.metadata.title || b.item_id
        );
      case "type":
        return a.item_type.localeCompare(b.item_type);
      case "recent":
      default:
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  });

  const getItemIcon = (itemType: ItemType) => {
    switch (itemType) {
      case "restaurant":
        return <MapPin className="w-4 h-4" />;
      case "recipe":
        return <ChefHat className="w-4 h-4" />;
      case "photo":
        return <Camera className="w-4 h-4" />;
      default:
        return <Bookmark className="w-4 h-4" />;
    }
  };

  const getItemTypeColor = (itemType: ItemType) => {
    switch (itemType) {
      case "restaurant":
        return "bg-blue-100 text-blue-800";
      case "recipe":
        return "bg-green-100 text-green-800";
      case "photo":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalItems = Object.values(counts).reduce(
    (sum, count) => sum + count,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F14C35] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your Plate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#0B1F3A] mb-2">Your Plate</h2>
        <p className="text-gray-600">
          {totalItems} {totalItems === 1 ? "item" : "items"} saved
        </p>
      </div>

      {/* Stats */}
      {showStats && totalItems > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(counts).map(([type, count]) => (
            <div key={type} className="text-center p-4 bg-[#F8F9FA] rounded-xl">
              <div className="flex items-center justify-center mb-2">
                {getItemIcon(type as ItemType)}
              </div>
              <p className="text-2xl font-bold text-[#0B1F3A]">{count}</p>
              <p className="text-sm text-gray-600 capitalize">{type}s</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        {showSearch && (
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search your saved items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="flex gap-2">
            {(["all", "restaurant", "recipe", "photo"] as FilterType[]).map(
              (filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                  className={
                    activeFilter === filter ? "bg-[#F14C35] text-white" : ""
                  }
                >
                  {filter === "all"
                    ? "All"
                    : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              )
            )}
          </div>
        )}

        {/* View Toggle */}
        {showViewToggle && (
          <div className="flex border border-gray-200 rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Sort by:</span>
        <div className="flex gap-2">
          {(["recent", "name", "type"] as SortBy[]).map((sort) => (
            <Button
              key={sort}
              variant={sortBy === sort ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy(sort)}
              className={sortBy === sort ? "bg-[#F14C35] text-white" : ""}
            >
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Items */}
      {sortedItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-[#0B1F3A] mb-2">
            {searchQuery || activeFilter !== "all"
              ? "No items found"
              : "Your Plate is empty"}
          </h3>
          <p className="text-gray-600">
            {searchQuery || activeFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Start exploring and save items you love!"}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {sortedItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => onItemClick?.(item)}
              >
                <div className="relative">
                  {item.metadata.image_url && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <ImageWithFallback
                        src={item.metadata.image_url}
                        alt={item.metadata.title || item.item_id}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Item Type Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge
                      className={`${getItemTypeColor(item.item_type)} border-0`}
                    >
                      {getItemIcon(item.item_type)}
                      <span className="ml-1 capitalize">{item.item_type}</span>
                    </Badge>
                  </div>

                  {/* Unsave Button */}
                  <div className="absolute top-3 right-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnsaveItem(item);
                      }}
                      className="w-8 h-8 p-0 bg-white/90 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-[#0B1F3A] mb-2 line-clamp-2">
                    {item.metadata.title || item.item_id}
                  </h3>

                  {item.metadata.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.metadata.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      Saved {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    {item.metadata.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span>{item.metadata.rating}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
