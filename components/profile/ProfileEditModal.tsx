import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  ArrowLeft,
  Check,
  ChefHat,
  Leaf,
  Moon,
  Upload,
  Wheat,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FuzoButton } from "../global/FuzoButton";
import { FuzoInput } from "../global/FuzoInput";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const cuisineOptions = [
  { id: "italian", name: "Italian", emoji: "🍝" },
  { id: "indian", name: "Indian", emoji: "🍛" },
  { id: "japanese", name: "Japanese", emoji: "🍣" },
  { id: "mexican", name: "Mexican", emoji: "🌮" },
  { id: "chinese", name: "Chinese", emoji: "🥟" },
  { id: "thai", name: "Thai", emoji: "🍜" },
  { id: "mediterranean", name: "Mediterranean", emoji: "🥗" },
  { id: "american", name: "American", emoji: "🍔" },
];

const dietaryOptions = [
  { id: "none", name: "No restrictions", icon: Check },
  { id: "vegetarian", name: "Vegetarian", icon: Leaf },
  { id: "vegan", name: "Vegan", icon: Apple },
  { id: "gluten-free", name: "Gluten-free", icon: Wheat },
  { id: "dairy-free", name: "Dairy-free", icon: Moon },
  { id: "keto", name: "Keto", icon: ChefHat },
];

export function ProfileEditModal({
  isOpen,
  onClose,
  onSave,
}: ProfileEditModalProps) {
  const { profile, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    display_name: "",
    username: "",
    bio: "",
    avatar_url: "",
    dietary_preferences: [] as string[],
    cuisine_preferences: [] as string[],
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
        dietary_preferences: profile.dietary_preferences || [],
        cuisine_preferences: profile.cuisine_preferences || [],
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await updateProfile({
        display_name: formData.display_name,
        username: formData.username,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        dietary_preferences: formData.dietary_preferences,
        cuisine_preferences: formData.cuisine_preferences,
      });

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCuisine = (cuisineId: string) => {
    setFormData((prev) => ({
      ...prev,
      cuisine_preferences: prev.cuisine_preferences.includes(cuisineId)
        ? prev.cuisine_preferences.filter((id) => id !== cuisineId)
        : [...prev.cuisine_preferences, cuisineId],
    }));
  };

  const toggleDietary = (dietaryId: string) => {
    setFormData((prev) => ({
      ...prev,
      dietary_preferences:
        dietaryId === "none"
          ? ["none"]
          : prev.dietary_preferences.includes(dietaryId)
          ? prev.dietary_preferences.filter((id) => id !== dietaryId)
          : [
              ...prev.dietary_preferences.filter((id) => id !== "none"),
              dietaryId,
            ],
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-3 h-3 text-red-600" />
                </div>
                <p className="text-red-800 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Avatar Section */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-[#F14C35] flex items-center justify-center mb-4">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#F14C35] rounded-full flex items-center justify-center text-white hover:bg-[#E63E26] transition-colors">
                  <span className="text-xl">+</span>
                </button>
              </div>
              <button className="text-[#F14C35] font-medium text-sm">
                Upload photo
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-6 mb-8">
              <FuzoInput
                label="Display Name"
                placeholder="Enter your display name"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    display_name: e.target.value,
                  }))
                }
                className="rounded-lg"
              />
              <FuzoInput
                label="Username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                className="rounded-lg"
              />
              <FuzoInput
                label="Bio"
                placeholder="Tell us about yourself"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="rounded-lg"
                multiline
                rows={3}
              />
            </div>

            {/* Cuisine Preferences */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cuisine Preferences
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {cuisineOptions.map((cuisine) => (
                  <button
                    key={cuisine.id}
                    onClick={() => toggleCuisine(cuisine.id)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                      formData.cuisine_preferences.includes(cuisine.id)
                        ? "border-[#F14C35] bg-[#F14C35]/5"
                        : "border-gray-200 hover:border-[#F14C35]/50"
                    }`}
                  >
                    <span className="text-2xl">{cuisine.emoji}</span>
                    <span className="font-medium text-gray-900 text-sm text-center">
                      {cuisine.name}
                    </span>
                    {formData.cuisine_preferences.includes(cuisine.id) && (
                      <Check className="w-4 h-4 text-[#F14C35]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Preferences */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Dietary Preferences
              </h3>
              <div className="space-y-3">
                {dietaryOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleDietary(option.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        formData.dietary_preferences.includes(option.id)
                          ? "border-[#F14C35] bg-[#F14C35]/5"
                          : "border-gray-200 hover:border-[#F14C35]/50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            formData.dietary_preferences.includes(option.id)
                              ? "bg-[#F14C35]"
                              : "bg-gray-100"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              formData.dietary_preferences.includes(option.id)
                                ? "text-white"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <span className="font-medium text-gray-900">
                          {option.name}
                        </span>
                      </div>
                      {formData.dietary_preferences.includes(option.id) && (
                        <Check className="w-5 h-5 text-[#F14C35]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex gap-3">
            <FuzoButton
              variant="tertiary"
              size="lg"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </FuzoButton>
            <FuzoButton
              variant="primary"
              size="lg"
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </FuzoButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


