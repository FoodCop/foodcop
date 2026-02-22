
/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Search, ChefHat, MapPin, User, Heart, Clock, Zap, MessageSquare,
  ChevronRight, PlayCircle, Camera, X, Share2, Send,
  Bookmark, ChevronLeft, Settings, Map as MapIcon, RefreshCw, LayoutGrid, Sparkles, Bot,
  List, PieChart, CheckCircle2, Menu, SlidersHorizontal, Music2
} from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import { SpoonacularService } from "./src/services/spoonacularService";
import { PlacesService } from "./src/services/placesService";
import { YouTubeService } from "./src/services/youtubeService";
import { OpenAIService } from './src/services/openaiService';
import { supabase, hasSupabaseConfig } from './src/services/supabaseClient';
import { PlateService, type PlateItemType, type SavedPlateItem } from './src/services/plateService';

// --- CONFIGURATION & UTILS ---
const cleanEnv = (val: string | undefined) => {
  if (!val) {
    return '';
  }

  const trimmed = val.trim();
  const withoutLeading = (trimmed.startsWith('"') || trimmed.startsWith("'")) ? trimmed.slice(1) : trimmed;
  return (withoutLeading.endsWith('"') || withoutLeading.endsWith("'")) ? withoutLeading.slice(0, -1) : withoutLeading;
};

const API_KEYS = {
  OPENAI: cleanEnv(import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY),
  MAPS: cleanEnv(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.GOOGLE_MAPS_API_KEY),
  YOUTUBE: cleanEnv(import.meta.env.VITE_YOUTUBE_API_KEY || import.meta.env.YOUTUBE_API_KEY),
};

const mapSavedPlateItemToViewItem = (saved: SavedPlateItem) => {
  const metadata = saved.metadata || {};
  const title = String(metadata.name || metadata.title || saved.item_id || 'Saved item');
  const categoryByType: Record<PlateItemType, string> = {
    restaurant: 'Saved Place',
    recipe: 'Saved Recipe',
    video: 'Saved Trim',
    photo: 'Saved Post',
    other: 'Saved Item',
  };
  const category = String(metadata.cat || metadata.category || categoryByType[saved.item_type] || 'Saved Item');
  const image = String(
    metadata.img ||
    metadata.image ||
    metadata.photo_url ||
    metadata.thumbnail ||
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'
  );

  return {
    id: `${saved.item_type}-${saved.item_id}`,
    name: title,
    cat: category,
    img: image,
  };
};

const toPlateItemType = (item: any): PlateItemType => {
  const rawId = String(item?.id || '');
  const normalizedCategory = String(item?.cat || '').toLowerCase();

  if (rawId.startsWith('recipe-') || normalizedCategory.includes('recipe')) {
    return 'recipe';
  }
  if (rawId.startsWith('video-') || normalizedCategory.includes('trim') || normalizedCategory.includes('video')) {
    return 'video';
  }
  if (rawId.startsWith('post-') || normalizedCategory.includes('post') || normalizedCategory.includes('photo')) {
    return 'photo';
  }
  if (normalizedCategory.includes('place') || normalizedCategory.includes('restaurant')) {
    return 'restaurant';
  }
  return 'other';
};

const getAuthProfile = (user: any) => {
  const metadata = user?.user_metadata || {};
  const email = user?.email || null;
  const displayName =
    metadata.full_name ||
    metadata.name ||
    (email ? String(email).split('@')[0] : 'Chef Studio');
  const avatarUrl = metadata.avatar_url || metadata.picture || null;

  return {
    email,
    displayName,
    avatarUrl,
  };
};

// --- SHARED UI COMPONENTS ---

const Badge = ({ children, color = 'yellow' }: { children: React.ReactNode, color?: string }) => (
  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-${color}-100 text-${color}-800 whitespace-nowrap`}>
    {children}
  </span>
);

const NavIcon = ({ icon: Icon, active, onClick, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-stone-900' : 'text-stone-300 hover:text-stone-500'}`}
  >
    <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-yellow-400 shadow-lg' : ''}`}>
      <Icon size={24} strokeWidth={active ? 3 : 2} />
    </div>
    {label && <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>}
  </button>
);

// --- TINDER SWIPE ENGINE ---

const SwipeCard = ({ children, onSwipe, active }: any) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleStart = (e: any) => {
    if (!active) return;
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };
    setIsSwiping(true);
  };

  const handleMove = (e: any) => {
    if (!isSwiping || !active) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    setOffset({ x: clientX - startPos.current.x, y: clientY - startPos.current.y });
  };

  const handleEnd = () => {
    if (!isSwiping || !active) return;
    const threshold = 120;
    if (Math.abs(offset.x) > threshold) onSwipe(offset.x > 0 ? 'right' : 'left');
    else if (Math.abs(offset.y) > threshold) onSwipe(offset.y > 0 ? 'down' : 'up');
    else setOffset({ x: 0, y: 0 });
    setIsSwiping(false);
  };

  const rotation = offset.x * 0.05;
  const opacity = Math.min(Math.max(Math.abs(offset.x), Math.abs(offset.y)) / 150, 0.6);

  return (
    <button
      type="button"
      aria-label="Swipe card"
      className={`absolute inset-0 w-full h-full rounded-[3.5rem] border-4 border-white shadow-2xl overflow-hidden transition-transform duration-300 ${isSwiping ? 'ease-none' : 'ease-out'}`}
      style={{ 
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
        zIndex: active ? 10 : 1,
        touchAction: 'none'
      }}
      onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
      onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
    >
      {offset.x > 50 && <div className="absolute inset-0 bg-emerald-500 z-20 flex items-center justify-center pointer-events-none" style={{ opacity }}><h2 className="text-white text-6xl font-black uppercase">LIKE</h2></div>}
      {offset.x < -50 && <div className="absolute inset-0 bg-red-500 z-20 flex items-center justify-center pointer-events-none" style={{ opacity }}><h2 className="text-white text-6xl font-black uppercase">PASS</h2></div>}
      {offset.y < -50 && <div className="absolute inset-0 bg-yellow-400 z-20 flex items-center justify-center pointer-events-none" style={{ opacity }}><h2 className="text-stone-900 text-6xl font-black uppercase">SHARE</h2></div>}
      {offset.y > 50 && <div className="absolute inset-0 bg-blue-500 z-20 flex items-center justify-center pointer-events-none" style={{ opacity }}><h2 className="text-white text-6xl font-black uppercase">SAVE</h2></div>}
      {children}
    </button>
  );
};

// --- SHARE MODAL ---

const ShareModal = ({ item, friends, onShare, onClose }: { item: any, friends: any[], onShare: (friendId: number, item: any) => void, onClose: () => void }) => {
  const [sentTo, setSentTo] = useState<number[]>([]);

  const handleShareClick = (friendId: number) => {
    if (sentTo.includes(friendId)) return;
    onShare(friendId, item);
    setSentTo(prev => [...prev, friendId]);
  };

  return (
    <div className="fixed inset-0 z-120 bg-stone-900/60 backdrop-blur-xl flex items-end md:items-center justify-center p-0 md:p-10 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-t-[4rem] md:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-20 duration-500">
        <header className="p-10 border-b flex justify-between items-center bg-stone-50">
          <div>
            <Badge color="yellow">Studio Share</Badge>
            <h3 className="text-3xl font-black uppercase tracking-tighter mt-1">Send to Friend</h3>
          </div>
          <button onClick={onClose} className="p-4 bg-white rounded-3xl shadow-sm hover:scale-105 transition-transform"><X size={24} /></button>
        </header>

        <div className="p-10 flex items-center gap-6 border-b">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg shrink-0">
            <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-black uppercase text-xl leading-none">{item.name}</h4>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mt-2">{item.cat}</p>
          </div>
        </div>

        <div className="p-8 max-h-[50vh] overflow-y-auto space-y-4">
          <h5 className="px-2 text-[10px] font-black uppercase tracking-widest text-stone-300">Active Contacts</h5>
          {friends.map(friend => (
            <button
              type="button"
              key={friend.id} 
              onClick={() => handleShareClick(friend.id)}
              className="flex items-center justify-between p-4 rounded-4xl hover:bg-stone-50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-4">
                <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full border-2 border-stone-100" />
                <span className="font-black uppercase text-xs tracking-widest">{friend.name}</span>
              </div>
              {sentTo.includes(friend.id) ? (
                <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase">
                  <CheckCircle2 size={16} /> Sent
                </div>
              ) : (
                <div className="p-3 bg-stone-100 rounded-2xl group-hover:bg-yellow-400 transition-colors">
                  <Send size={18} />
                </div>
              )}
            </button>
          ))}
        </div>
        
        <footer className="p-10 bg-stone-50 text-center">
          <button 
            onClick={onClose}
            className="w-full py-5 bg-stone-900 text-white rounded-4xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-transform"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
};

// --- VIEWS ---

const FeedView = ({ onSave, onShareRequest }: { onSave: (item: any) => void, onShareRequest: (item: any) => void }) => {
  const [items, setItems] = useState([
    { id: 'f1', name: "Oretta Toronto", cat: "High Italian", img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80" },
    { id: 'f2', name: "Kōjin Steak", cat: "Fire Hearth", img: "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=80" },
    { id: 'f3', name: "Zen Garden", cat: "Botanical Bar", img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80" },
  ]);

  const handleSwipe = async (dir: string) => {
    const currentItem = items[0];
    if (dir === 'up') {
      onShareRequest(currentItem);
    } else if (dir === 'down') {
      onSave(currentItem);
    }
    setItems(prev => prev.slice(1));
  };

  return (
    <div className="flex flex-col items-center gap-6 animate-in fade-in py-2">
      <div className="w-full max-w-sm px-4 hidden md:block">
        <Badge color="yellow">Studio Stack</Badge>
        <h2 className="text-4xl font-black uppercase tracking-tighter mt-1">Discovery</h2>
      </div>
      <div className="relative w-full max-w-100 aspect-[3/4.6]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-200 gap-4">
             <RefreshCw size={48} className="animate-spin-slow opacity-20" />
             <p className="font-black uppercase tracking-widest text-xs">End of the discovery</p>
             <button onClick={() => globalThis.location.reload()} className="px-6 py-3 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Reset Stack</button>
          </div>
        ) : (
          items.map((item, i) => (
            <SwipeCard key={item.id} active={i === 0} onSwipe={handleSwipe}>
              <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent" />
              <div className="absolute bottom-10 left-10 right-10 text-white">
                <h3 className="text-4xl font-black uppercase tracking-tighter mb-2 leading-none">{item.name}</h3>
                <Badge color="yellow">{item.cat}</Badge>
              </div>
            </SwipeCard>
          ))
        )}
      </div>
    </div>
  );
};

const BitesView = ({ onSave, onShareRequest }: { onSave: (item: any) => void, onShareRequest: (item: any) => void }) => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const bitesRequestSeq = useRef(0);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDiet, setActiveDiet] = useState<string | null>(null);
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const DIETS = ["Vegetarian", "Vegan", "Gluten Free", "Ketogenic", "Paleo"];
  const CUISINES = ["Italian", "Asian", "Mexican", "French", "Indian", "Japanese"];

  const fetchBites = useCallback(async (_isRefresh = false, queryOverride?: string) => {
    const requestId = ++bitesRequestSeq.current;
    const normalizedQuery = (queryOverride ?? searchQuery).trim();
    setLoading(true);
    try {
      const result = await SpoonacularService.searchRecipes({
        query: normalizedQuery || undefined,
        diet: activeDiet?.toLowerCase(),
        cuisine: activeCuisine?.toLowerCase(),
        number: normalizedQuery ? 12 : 6,
      });
      
      if (requestId !== bitesRequestSeq.current) {
        return;
      }

      if (result.success && result.data.results) {
        setRecipes(result.data.results);
      } else {
        console.error("Spoonacular Service Error:", result.error);
        throw new Error(result.error || "Failed to fetch recipes");
      }
    } catch (e) { 
      if (requestId !== bitesRequestSeq.current) {
        return;
      }

      console.error("Fetch Bites Error:", e);
      // Fallback Mock if service fails
      setRecipes([
        { 
          id: 1, title: 'Wagyu Truffle Burger', 
          image: 'https://images.unsplash.com/photo-1550317138-10000687ad32?auto=format&fit=crop&w=400',
          readyInMinutes: 20, servings: 2,
          dishTypes: ['Main Course'],
          extendedIngredients: [{ original: 'Wagyu Beef' }, { original: 'Black Truffle' }, { original: 'Brioche Bun' }],
          instructions: '1. Sear the wagyu. 2. Shave truffles. 3. Assemble and enjoy.',
          nutrition: { nutrients: [
            { name: 'Calories', amount: 850, unit: 'kcal' },
            { name: 'Fat', amount: 58, unit: 'g' },
            { name: 'Protein', amount: 42, unit: 'g' },
            { name: 'Carbohydrates', amount: 32, unit: 'g' }
          ] }
        },
        { 
          id: 2, title: 'Blueberry Matcha Bowl', 
          image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=400',
          readyInMinutes: 10, servings: 1,
          dishTypes: ['Breakfast'],
          extendedIngredients: [{ original: 'Matcha Powder' }, { original: 'Frozen Berries' }, { original: 'Greek Yogurt' }],
          instructions: '1. Blend matcha and berries. 2. Top with nuts. 3. Serve cold.',
          nutrition: { nutrients: [
            { name: 'Calories', amount: 320, unit: 'kcal' },
            { name: 'Fat', amount: 8, unit: 'g' },
            { name: 'Protein', amount: 18, unit: 'g' },
            { name: 'Carbohydrates', amount: 45, unit: 'g' }
          ] }
        }
      ]);
      if (normalizedQuery) {
        const lowerQuery = normalizedQuery.toLowerCase();
        setRecipes(prev => prev.filter(recipe => String(recipe?.title || '').toLowerCase().includes(lowerQuery)));
      }
    } finally {
      if (requestId === bitesRequestSeq.current) {
        setLoading(false);
      }
    }
  }, [activeDiet, activeCuisine, searchQuery]);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      fetchBites(false, searchQuery);
    }, 350);

    return () => globalThis.clearTimeout(timeoutId);
  }, [fetchBites, searchQuery]);

  const filteredRecipes = useMemo(() => recipes, [recipes]);

  const getKeyNutrients = (recipe: any) => {
    if (!recipe.nutrition?.nutrients) return [];
    const macroNames = new Set(['Calories', 'Protein', 'Fat', 'Carbohydrates', 'Sugar']);
    return recipe.nutrition.nutrients.filter((n: any) => macroNames.has(n.name)).slice(0, 4);
  };

  const handleRecipeAction = (recipe: any, action: 'save' | 'share') => {
    const formattedItem = {
      id: `recipe-${recipe.id}`,
      name: recipe.title,
      cat: recipe.dishTypes?.[0] || 'Recipe',
      img: recipe.image
    };
    if (action === 'save') onSave(formattedItem);
    else onShareRequest(formattedItem);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-24 px-4">
      {/* Search & Filter Header */}
      <div className="space-y-6">
        <header className="hidden md:flex justify-between items-end">
          <div><Badge color="yellow">Daily Bites</Badge><h2 className="text-4xl font-black uppercase tracking-tighter mt-1">Recipe Packs</h2></div>
          <button onClick={() => fetchBites(true)} className="p-4 bg-white rounded-2xl shadow-sm hover:scale-105 transition-transform"><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
        </header>

        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative grow">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
            <input 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Search specific tastes..." 
              className="w-full bg-white px-14 py-5 rounded-4xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-yellow-400/10 transition-all shadow-sm border border-stone-100"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-8 py-5 rounded-4xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${showFilters ? 'bg-stone-900 text-white shadow-xl' : 'bg-white text-stone-900 shadow-sm border'}`}
          >
            <SlidersHorizontal size={18} /> Filters {(activeDiet || activeCuisine) && <div className="w-2 h-2 rounded-full bg-yellow-400" />}
          </button>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-white space-y-8 animate-in slide-in-from-top-4 duration-500">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 px-2">Dietary Preferences</h4>
              <div className="flex flex-wrap gap-3">
                {DIETS.map(diet => (
                  <button 
                    key={diet} 
                    onClick={() => setActiveDiet(activeDiet === diet ? null : diet)}
                    className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeDiet === diet ? 'bg-yellow-400 text-stone-900 shadow-lg' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 px-2">Global Cuisines</h4>
              <div className="flex flex-wrap gap-3">
                {CUISINES.map(cuisine => (
                  <button 
                    key={cuisine} 
                    onClick={() => setActiveCuisine(activeCuisine === cuisine ? null : cuisine)}
                    className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCuisine === cuisine ? 'bg-yellow-400 text-stone-900 shadow-lg' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recipe Grid */}
      {loading && (
        <div className="py-20 text-center animate-pulse font-black uppercase text-stone-200 tracking-widest">Compiling Pack...</div>
      )}
      {!loading && filteredRecipes.length === 0 && (
        <div className="py-20 text-center space-y-6">
          <Search size={48} className="mx-auto text-stone-200" />
          <p className="font-black uppercase text-xs tracking-widest text-stone-400">No matches in current pack</p>
          <button onClick={() => { setSearchQuery(""); fetchBites(); }} className="px-8 py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Refresh Feed</button>
        </div>
      )}
      {!loading && filteredRecipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRecipes.map(recipe => (
            <button key={recipe.id} type="button" onClick={() => setSelectedRecipe(recipe)} className="group cursor-pointer text-left">
              <div className="relative aspect-4/5 rounded-[3.5rem] border-4 border-white shadow-xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent" />
                <div className="absolute bottom-10 left-10 right-10 text-white">
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 leading-none">{recipe.title}</h3>
                  <div className="flex gap-2 items-center text-[10px] font-bold uppercase tracking-widest opacity-80">
                    <Clock size={14} /> {recipe.readyInMinutes} Min
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-110 bg-stone-900/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in duration-300">
            <button onClick={() => setSelectedRecipe(null)} className="absolute top-6 right-6 z-20 p-4 bg-stone-900 text-white rounded-3xl active:scale-90 transition-transform"><X size={24} /></button>
            <div className="w-full md:w-1/2 h-64 md:h-auto overflow-hidden"><img src={selectedRecipe.image} alt={selectedRecipe.title} className="w-full h-full object-cover" /></div>
            <div className="w-full md:w-1/2 p-8 md:p-14 overflow-y-auto hide-scrollbar flex flex-col gap-10">
              <header className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge color="yellow">Studio Pack #{selectedRecipe.id}</Badge>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mt-2 leading-none">{selectedRecipe.title}</h2>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleRecipeAction(selectedRecipe, 'save')} 
                      className="p-4 bg-stone-50 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                    >
                      <Bookmark size={22} />
                    </button>
                    <button 
                      onClick={() => handleRecipeAction(selectedRecipe, 'share')} 
                      className="p-4 bg-stone-50 rounded-2xl hover:bg-yellow-100 hover:text-stone-900 transition-all active:scale-95 shadow-sm"
                    >
                      <Share2 size={22} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400"><Clock size={16} /> {selectedRecipe.readyInMinutes} Mins</div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400"><User size={16} /> {selectedRecipe.servings} Serves</div>
                </div>
              </header>
              <section className="space-y-4">
                <div className="flex items-center gap-4 text-stone-900"><PieChart size={20} /><h4 className="font-black uppercase text-xs tracking-widest">Nutritional Data</h4></div>
                <div className="grid grid-cols-2 gap-4">
                  {getKeyNutrients(selectedRecipe).map((n: any) => (
                    <div key={n.name} className="bg-stone-50 p-6 rounded-4xl border border-stone-100 flex flex-col justify-center">
                      <p className="text-xl font-black">{Math.round(n.amount)} <span className="text-[10px] text-stone-400 font-bold">{n.unit}</span></p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mt-1 truncate">{n.name}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section className="space-y-4">
                <div className="flex items-center gap-4 text-stone-900"><List size={20} /><h4 className="font-black uppercase text-xs tracking-widest">Ingredients</h4></div>
                <ul className="space-y-3">
                  {selectedRecipe.extendedIngredients?.map((ing: any) => (
                    <li key={String(ing.id || ing.name || ing.original)} className="flex gap-3 text-sm font-bold text-stone-500"><div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5 shrink-0" /> {ing.original}</li>
                  ))}
                </ul>
              </section>
              <section className="space-y-4 pb-10">
                <div className="flex items-center gap-4 text-stone-900"><ChefHat size={20} /><h4 className="font-black uppercase text-xs tracking-widest">Instructions</h4></div>
                <div className="text-sm font-bold text-stone-500 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: selectedRecipe.instructions || 'Consult Chef FUZO for detailed steps.' }} />
              </section>
              
              <div className="sticky bottom-0 inset-x-0 md:hidden pt-4 pb-2 bg-white/90 backdrop-blur-md flex gap-4 border-t border-stone-100">
                <button 
                  onClick={() => handleRecipeAction(selectedRecipe, 'save')}
                  className="grow py-5 bg-stone-900 text-white rounded-4xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                >
                  <Bookmark size={18} /> Save Pack
                </button>
                <button 
                  onClick={() => handleRecipeAction(selectedRecipe, 'share')}
                  className="py-5 px-10 bg-yellow-400 text-stone-900 rounded-4xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-xl"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TrimsView = ({ onSave }: { onSave: (item: any) => void }) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      const result = await YouTubeService.searchVideos('cooking food recipe shorts tutorial', 12);

      if (result.success && result.data?.items?.length) {
        const mapped = result.data.items
          .filter((item: any) => item?.id?.videoId)
          .map((item: any, idx: number) => ({
            id: item.id.videoId,
            title: item.snippet?.title || 'Cooking Trim',
            author: item.snippet?.channelTitle || 'FUZO Studio',
            likes: `${Math.max(1, 24 - idx)}k`,
            img: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
          }))
          .filter((item: any) => !!item.img);

        setVideos(mapped);
      } else {
        setVideos([
          { id: 1, title: 'Umami Searing Techniques', author: 'Chef Marcus', likes: '24k', img: 'https://images.unsplash.com/photo-1577308856961-8e9ec50d0c67?auto=format&fit=crop&w=400' },
          { id: 2, title: 'Perfect Carbonara Hack', author: 'Pasta Queen', likes: '158k', img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=400' },
          { id: 3, title: 'Secret Spicy Oil Recipe', author: 'Spice King', likes: '12k', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400' },
        ]);
      }

      setLoading(false);
    };

    loadVideos();
  }, []);

  const handleSaveVideo = (v: any) => {
    onSave({
      id: `video-${v.id}`,
      name: v.title,
      cat: 'Studio Trim',
      img: v.img
    });
  };

  return (
    <>
      {loading && <div className="text-center py-6 text-[10px] font-black uppercase tracking-widest text-stone-300">Loading Trims...</div>}
    <div className="h-[80vh] w-full max-w-md mx-auto relative snap-y snap-mandatory overflow-y-auto hide-scrollbar rounded-[3.5rem] bg-stone-900 shadow-2xl border-4 border-white">
      {videos.map(v => (
        <div key={v.id} className="h-full w-full snap-start relative">
          <img src={v.img} alt={v.title} className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-linear-to-t from-black via-transparent" />
          <div className="absolute bottom-12 left-8 right-8 text-white space-y-4">
             <Badge color="yellow">Studio Trim #{v.id}</Badge>
             <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight">{v.title}</h3>
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md" />
                <p className="text-[10px] font-black uppercase tracking-widest">@{v.author}</p>
             </div>
          </div>
          <div className="absolute right-6 bottom-32 flex flex-col gap-8 text-white items-center">
            <button onClick={() => handleSaveVideo(v)} className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
              <Heart size={28} className="fill-white" />
              <span className="text-[10px] font-black">{v.likes}</span>
            </button>
            <button className="flex flex-col items-center gap-1"><MessageSquare size={28} /><span className="text-[10px] font-black">2k</span></button>
            <button className="flex flex-col items-center gap-1"><Share2 size={28} /></button>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center animate-spin-slow"><Music2 size={20} /></div>
          </div>
        </div>
      ))}
    </div>
    </>
  );
};

const ChefAIView = () => {
  const [messages, setMessages] = useState([{ id: 'ai-welcome', role: 'ai', text: 'Chef FUZO here. What culinary secrets shall we unlock?' }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  const normalizeChefText = (raw: string) => {
    return raw
      .replaceAll('\r\n', '\n')
      .replaceAll(/\s*(#{1,6}\s+)/g, '\n$1')
      .replaceAll(/\s*(\d+\.\s+)/g, '\n$1')
      .replaceAll(/\s+-\s+/g, '\n- ')
      .replaceAll(/\*\*(.*?)\*\*/g, '$1')
      .replaceAll(/^#{1,6}\s*/gm, '')
      .replaceAll(/^-\s+/gm, '• ')
      .replaceAll(/\n{3,}/g, '\n\n')
      .trim();
  };

  const wait = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

  const typeAssistantReply = async (fullText: string) => {
    const prettyText = normalizeChefText(fullText);
    const messageId = `ai-${Date.now()}`;

    setMessages(prev => [...prev, { id: messageId, role: 'ai', text: '' }]);

    if (!prettyText) {
      setMessages(prev => prev.map(message => message.id === messageId ? { ...message, text: '...' } : message));
      return;
    }

    const chunkSize = 2;
    const tickMs = 16;

    for (let index = chunkSize; index <= prettyText.length; index += chunkSize) {
      if (!isMountedRef.current) {
        return;
      }

      const nextText = prettyText.slice(0, index);
      setMessages(prev => prev.map(message => message.id === messageId ? { ...message, text: nextText } : message));
      await wait(tickMs);
    }

    if (prettyText.length % chunkSize !== 0 && isMountedRef.current) {
      setMessages(prev => prev.map(message => message.id === messageId ? { ...message, text: prettyText } : message));
    }
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const txt = input; setInput("");
    const currentMessages = [...messages, { id: `user-${Date.now()}`, role: 'user' as const, text: txt }];
    setMessages(currentMessages);
    setLoading(true);
    try {
      const chatMessages = currentMessages.map(message => ({
        role: message.role === 'ai' ? 'assistant' as const : 'user' as const,
        content: message.text,
      }));

      const result = await OpenAIService.chatCompletion([
        {
          role: 'system',
          content: 'You are Chef FUZO, an elite culinary expert. Respond naturally like a real assistant in chat. Use plain text only, no markdown symbols, no headings, no bold markers. Prefer short paragraphs with clean spacing and practical cooking guidance.'
        },
        ...chatMessages,
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 700,
      });

      if (result.success && result.data?.text) {
        await typeAssistantReply(result.data.text);
      } else {
        await typeAssistantReply(result.error || 'Studio signal weak. Check connection.');
      }
    } catch {
      await typeAssistantReply('Studio signal weak. Check connection.');
    }
    finally { setLoading(false); }
  };

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  return (
    <div className="max-w-2xl mx-auto h-[75vh] flex flex-col bg-white rounded-[3.5rem] shadow-2xl border-4 border-white overflow-hidden">
      <header className="p-8 border-b bg-stone-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-yellow-400 shadow-xl"><Bot size={24} /></div>
          <div><h4 className="font-black text-xs uppercase tracking-widest">Chef FUZO AI</h4><p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">Online</p></div>
        </div>
      </header>
      <div className="grow p-8 overflow-y-auto hide-scrollbar space-y-6">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-6 rounded-[2.5rem] text-sm shadow-sm ${m.role === 'user' ? 'bg-stone-900 text-white font-semibold' : 'bg-stone-50 text-stone-900 font-medium whitespace-pre-wrap leading-7'}`}>{m.text}</div>
          </div>
        ))}
        {loading && <div className="flex gap-2 p-6"><div className="w-2 h-2 bg-stone-200 rounded-full animate-bounce" /><div className="w-2 h-2 bg-stone-200 rounded-full animate-bounce delay-100" /></div>}
        <div ref={endRef} />
      </div>
      <footer className="p-6 border-t flex gap-3 bg-white">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Consult the Chef..." className="grow bg-stone-50 px-8 py-5 rounded-4xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-yellow-400/10 transition-all" />
        <button onClick={sendMessage} className="w-16 h-16 bg-yellow-400 rounded-3xl flex items-center justify-center shadow-xl active:scale-95 transition-transform"><Send size={24} /></button>
      </footer>
    </div>
  );
};

const ChatView = ({ friends, messagesByFriend }: { friends: any[], messagesByFriend: Record<number, any[]> }) => {
  const [activeId, setActiveId] = useState<number | null>(null);

  const active = friends.find(f => f.id === activeId);

  if (activeId && active) return (
    <div className="max-w-2xl mx-auto h-[75vh] flex flex-col bg-white rounded-[3.5rem] shadow-2xl border-4 border-white overflow-hidden animate-in slide-in-from-right duration-300">
      <header className="p-8 border-b flex items-center justify-between">
        <button onClick={() => setActiveId(null)} className="p-2 hover:bg-stone-50 rounded-xl transition-colors"><ChevronLeft size={28} /></button>
        <div className="flex items-center gap-3"><img src={active.avatar} alt={active.name} className="w-10 h-10 rounded-full border-2 border-yellow-400" /><h4 className="font-black text-xs uppercase tracking-widest">{active.name}</h4></div>
        <div className="w-10" />
      </header>
      <div className="grow p-10 space-y-6 overflow-y-auto hide-scrollbar">
        {messagesByFriend[activeId]?.map((m) => (
          <div key={m.id || `${m.role}-${m.text || m.item?.id || ''}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-6 rounded-[2.5rem] font-bold text-sm shadow-sm ${m.role === 'user' ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-900'}`}>
              {m.type === 'share' ? (
                <div className="space-y-3">
                  <p className="opacity-60 text-[10px] uppercase font-black tracking-widest mb-2">Check this out!</p>
                  <div className="rounded-2xl overflow-hidden shadow-md">
                    <img src={m.item.img} alt={m.item.name} className="w-full h-32 object-cover" />
                  </div>
                  <p className="font-black uppercase tracking-tighter">{m.item.name}</p>
                </div>
              ) : m.text}
            </div>
          </div>
        ))}
      </div>
      <footer className="p-6 border-t flex gap-3"><input placeholder="Message..." className="grow bg-stone-50 px-8 py-5 rounded-4xl font-bold outline-none" /><button className="w-16 h-16 bg-yellow-400 rounded-3xl flex items-center justify-center"><Send size={24} /></button></footer>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 animate-in fade-in">
      <header className="hidden md:flex justify-between items-end"><h2 className="text-4xl font-black uppercase tracking-tighter">Studio Inbox</h2><Badge color="yellow">Active</Badge></header>
      <div className="space-y-4">
        {friends.map(c => (
          <button type="button" key={c.id} onClick={() => setActiveId(c.id)} className="w-full bg-white p-6 rounded-[3rem] flex items-center gap-5 border shadow-sm cursor-pointer hover:bg-stone-50 transition-all hover:scale-[1.01] text-left">
            <img src={c.avatar} alt={c.name} className="w-16 h-16 rounded-3xl border-2 border-yellow-400 shadow-md" />
            <div className="grow">
              <div className="flex justify-between mb-1"><h4 className="font-black text-sm uppercase tracking-widest">{c.name}</h4><span className="text-[10px] text-stone-300 font-bold">{c.time}</span></div>
              <p className="text-xs text-stone-400 font-bold truncate">Open to chat...</p>
            </div>
            <ChevronRight className="text-stone-200" />
          </button>
        ))}
      </div>
    </div>
  );
};

const ScoutView = () => {
  const [coords, setCoords] = useState({ lat: 43.65, lng: -79.38 });
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const mapMarkersRef = useRef<any[]>([]);
  const mapLoaderRef = useRef<Loader | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      p => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setCoords({ lat: 43.65, lng: -79.38 })
    );
  }, []);

  useEffect(() => {
    const loadNearby = async () => {
      setLoading(true);
      setError(null);
      const result = await PlacesService.searchNearby(coords.lat, coords.lng, 5000);

      if (result.success && result.data?.results) {
        setPlaces(result.data.results.slice(0, 6));
      } else {
        setError(result.error || 'Could not load nearby restaurants');
        setPlaces([]);
      }

      setLoading(false);
    };

    loadNearby();
  }, [coords]);

  useEffect(() => {
    const initMap = async () => {
      if (!API_KEYS.MAPS) {
        setMapError(null);
        return;
      }

      try {
        setMapError(null);
        if (!mapLoaderRef.current) {
          mapLoaderRef.current = new Loader({
            apiKey: API_KEYS.MAPS,
            version: 'weekly',
            libraries: ['places'],
          });
        }

        await mapLoaderRef.current.importLibrary('maps');
        const googleMaps = (globalThis as any).google?.maps;

        if (!mapRef.current || !googleMaps?.Map) {
          return;
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(coords);
        } else {
          mapInstanceRef.current = new googleMaps.Map(mapRef.current, {
            center: coords,
            zoom: 14,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
        }
      } catch (e) {
        console.error('Scout map load failed:', e);
        setMapError('Google Maps JavaScript API unavailable (check key restrictions and API enablement).');
      }
    };

    initMap();
  }, [coords]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const googleMaps = (globalThis as any).google?.maps;

    if (!map || !googleMaps?.Marker) {
      return;
    }

    mapMarkersRef.current.forEach((marker) => marker.setMap(null));
    mapMarkersRef.current = [];

    places.forEach((place) => {
      const lat = place?.geometry?.location?.lat;
      const lng = place?.geometry?.location?.lng;

      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return;
      }

      const marker = new googleMaps.Marker({
        position: { lat, lng },
        map,
        title: place.name,
      });

      mapMarkersRef.current.push(marker);
    });
  }, [places]);

  return (
    <div className="space-y-8 px-4 animate-in fade-in">
      <header className="hidden md:block"><Badge color="emerald">Scout v2.5</Badge><h2 className="text-4xl font-black uppercase tracking-tighter mt-1">Nearby Discovery</h2></header>
      <div className="aspect-video w-full max-w-5xl mx-auto rounded-[3.5rem] overflow-hidden border-12 border-white shadow-2xl bg-stone-100">
        {API_KEYS.MAPS && !mapError ? (
          <div ref={mapRef} className="w-full h-full" aria-label="Nearby restaurants map" />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-300 gap-4 px-6 text-center">
            <MapIcon size={64} strokeWidth={1} />
            <p className="font-black uppercase text-[10px] tracking-widest">
              {API_KEYS.MAPS ? 'Map unavailable' : 'API Key Required'}
            </p>
            {API_KEYS.MAPS && (
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
                Check Maps JavaScript API enablement and key referrer restrictions.
              </p>
            )}
          </div>
        )}
      </div>
      <div className="max-w-5xl mx-auto space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 px-2">Nearby from Services</h4>
        {loading && <div className="text-[10px] font-black uppercase tracking-widest text-stone-300 px-2">Loading nearby places...</div>}
        {error && <div className="text-[10px] font-black uppercase tracking-widest text-red-400 px-2">{error}</div>}
        {!loading && !error && places.length === 0 && (
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-300 px-2">No nearby results</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {places.map((place, idx) => (
            <div key={place.place_id || place.id || idx} className="bg-white rounded-4xl p-5 shadow-sm border border-stone-100">
              <p className="font-black uppercase text-xs tracking-widest text-stone-900 leading-tight">{place.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-2">{place.vicinity || place.formatted_address || 'Address unavailable'}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600 mt-2">⭐ {place.rating ?? 'N/A'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileView = ({
  savedItems,
  profileName,
  profileAvatar,
}: {
  savedItems: any[];
  profileName: string;
  profileAvatar: string | null;
}) => {
  const [activeTab, setActiveTab] = useState('places');

  const tabs = [
    { id: 'places', label: 'Saved Places', icon: MapPin },
    { id: 'recipes', label: 'Recipes', icon: ChefHat },
    { id: 'videos', label: 'Videos', icon: PlayCircle },
    { id: 'posts', label: 'Posts', icon: LayoutGrid },
  ];

  const filteredItems = useMemo(() => {
    if (activeTab === 'places') return savedItems.filter(i => !i.id.startsWith('recipe-') && !i.id.startsWith('video-') && !i.id.startsWith('post-'));
    if (activeTab === 'recipes') return savedItems.filter(i => i.id.startsWith('recipe-'));
    if (activeTab === 'videos') return savedItems.filter(i => i.id.startsWith('video-'));
    if (activeTab === 'posts') return savedItems.filter(i => i.id.startsWith('post-'));
    return [];
  }, [savedItems, activeTab]);

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in pb-20">
      <div className="relative h-64 bg-stone-900 rounded-[4rem] overflow-hidden shadow-2xl">
        <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" alt="Profile cover" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent" />
        <div className="absolute -bottom-2 right-12"><div className="w-28 h-28 rounded-[2.5rem] border-8 border-white bg-white shadow-2xl overflow-hidden"><img src={profileAvatar || "https://i.pravatar.cc/150?u=me"} alt={profileName} className="w-full h-full object-cover" /></div></div>
      </div>
      <div className="px-8 space-y-4">
        <h2 className="text-5xl font-black uppercase tracking-tighter">{profileName}</h2>
        <p className="text-stone-500 font-bold max-w-md">Discovery engine architect. Exploring the world of fine dining and culinary hacks.</p>
        <div className="flex gap-4 pt-4">
          <div className="text-center"><p className="text-2xl font-black">{savedItems.length}</p><p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Saves</p></div>
          <div className="w-px h-10 bg-stone-100" />
          <div className="text-center"><p className="text-2xl font-black">42</p><p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Reviews</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8">
        <div className="flex bg-stone-100 p-2 rounded-[2.5rem] gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-4xl transition-all ${activeTab === t.id ? 'bg-white shadow-md text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <t.icon size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="px-8 space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="font-black uppercase text-xs tracking-widest text-stone-900">
            {tabs.find(t => t.id === activeTab)?.label}
          </h4>
          <Badge color="yellow">{filteredItems.length} Items</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-2 p-12 bg-stone-100 rounded-[3rem] text-center text-stone-300 font-black uppercase text-[10px] tracking-widest">
              No {activeTab} saved yet
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="aspect-square bg-stone-100 rounded-[3rem] border-4 border-white shadow-md overflow-hidden relative group">
                <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4 text-center">
                  <p className="font-black uppercase text-[10px] tracking-tighter leading-tight mb-2">{item.name}</p>
                  <Badge color="yellow">{item.cat}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const SnapView = ({ onPost, onClose }: { onPost: (item: any) => void, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        streamRef.current = s;
      })
      .catch(console.error);
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const handleSnap = () => {
    // Mocking a snap with a random food image
    onPost({
      id: `post-${Date.now()}`,
      name: `Culinary Snap ${new Date().toLocaleDateString()}`,
      cat: 'Studio Post',
      img: `https://picsum.photos/seed/${Date.now()}/800/800`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-150 bg-black animate-in slide-in-from-bottom duration-500">
      <header className="absolute top-0 inset-x-0 p-10 flex justify-between items-center z-10">
        <button onClick={onClose} className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center text-white"><X size={32} /></button>
        <button className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center text-white"><Zap size={28} /></button>
      </header>
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover">
        <track kind="captions" />
      </video>
      <footer className="absolute bottom-12 inset-x-0 flex justify-around items-center z-10 px-10">
        <div className="w-16 h-16 rounded-2xl border-4 border-white/20 bg-stone-800 shadow-2xl overflow-hidden">
           <img src="https://picsum.photos/seed/last/100/100" alt="Last capture" className="w-full h-full object-cover" />
        </div>
        <button 
          onClick={handleSnap}
          className="w-32 h-32 rounded-full border-10 border-white bg-white/20 shadow-2xl backdrop-blur-sm active:scale-90 transition-transform"
        >
          <div className="w-24 h-24 bg-white rounded-full m-auto" />
        </button>
        <button className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center text-white"><RefreshCw size={28} /></button>
      </footer>
    </div>
  );
};

// --- MAIN APP ---

const App = () => {
  const [tab, setTab] = useState('home');
  const [showSnap, setShowSnap] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authDisplayName, setAuthDisplayName] = useState('Chef Studio');
  const [authAvatarUrl, setAuthAvatarUrl] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [plateLoading, setPlateLoading] = useState(false);
  const [plateError, setPlateError] = useState<string | null>(null);
  const [activeShareItem, setActiveShareItem] = useState<any>(null);

  const [friends] = useState([
    { id: 1, name: "Marcus Chef", avatar: "https://i.pravatar.cc/150?u=1", time: "12m" },
    { id: 2, name: "Sarah Foodie", avatar: "https://i.pravatar.cc/150?u=2", time: "1h" },
    { id: 3, name: "Chef Elena", avatar: "https://i.pravatar.cc/150?u=3", time: "3h" },
  ]);
  const [messagesByFriend, setMessagesByFriend] = useState<Record<number, any[]>>({
    1: [{ role: 'ai', text: 'Yo! Ready for the tasting session?' }],
    2: [{ role: 'ai', text: 'That hidden gem was 10/10!' }],
    3: [{ role: 'ai', text: 'Found some great fresh herbs today.' }],
  });

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (!supabase) {
        if (mounted) {
          setAuthEmail(null);
          setAuthLoading(false);
        }
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (mounted) {
        const profile = getAuthProfile(user);
        setAuthEmail(profile.email);
        setAuthDisplayName(profile.displayName);
        setAuthAvatarUrl(profile.avatarUrl);
        setAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
      const profile = getAuthProfile(session?.user);
      setAuthEmail(profile.email);
      setAuthDisplayName(profile.displayName);
      setAuthAvatarUrl(profile.avatarUrl);
      setAuthLoading(false);
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadPlateItems = async () => {
      if (!authEmail) {
        setSavedItems([]);
        setPlateError(null);
        return;
      }

      setPlateLoading(true);
      setPlateError(null);

      const result = await PlateService.listSavedItems();
      if (!result.success) {
        setPlateError(result.error || 'Failed to load plate items');
        setPlateLoading(false);
        return;
      }

      const mapped = (result.data || []).map(mapSavedPlateItemToViewItem);
      setSavedItems(mapped);
      setPlateLoading(false);
    };

    loadPlateItems();
  }, [authEmail]);

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setAuthError('Missing Supabase env vars.');
      return;
    }

    setAuthBusy(true);
    setAuthError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: globalThis.location.origin,
        },
      });

      if (error) {
        setAuthError(error.message);
      }
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    setAuthBusy(true);
    setAuthError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError(error.message);
      }
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Sign out failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSave = (item: any) => {
    setSavedItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev;
      return [item, ...prev];
    });

    if (!supabase || !authEmail) {
      return;
    }

    const itemType = toPlateItemType(item);
    const metadata = {
      name: item.name,
      title: item.name,
      cat: item.cat,
      category: item.cat,
      img: item.img,
      image: item.img,
      source: 'new_UI',
      saved_at: new Date().toISOString(),
    };

    const rawId = String(item.id || '');
    const itemId = rawId.replace(/^recipe-|^video-|^post-/, '');

    void PlateService.saveToPlate({
      itemId,
      itemType,
      metadata,
    }).then((result) => {
      if (!result.success) {
        setPlateError(result.error || 'Failed to save to plate');
      }
    });
  };

  const handleShare = (friendId: number, item: any) => {
    setMessagesByFriend(prev => ({
      ...prev,
      [friendId]: [...(prev[friendId] || []), { id: `share-${Date.now()}`, role: 'user', type: 'share', item }]
    }));
  };

  // Split Nav Items for logical grouping
  const BottomNavItems = [
    { id: 'home', icon: LayoutGrid, label: 'Feed' },
    { id: 'bites', icon: ChefHat, label: 'Bites' },
    { id: 'snap', icon: Camera, label: 'Snap' }, // Central Action
    { id: 'trims', icon: PlayCircle, label: 'Trims' },
    { id: 'scout', icon: MapPin, label: 'Scout' },
  ];

  const DrawerNavItems = [
    { id: 'profile', icon: User, label: 'Plate' },
    { id: 'chat', icon: MessageSquare, label: 'Inbox' },
    { id: 'chef', icon: Bot, label: 'Chef AI' },
    { id: 'settings', icon: Settings, label: 'Prefs' },
  ];

  let authStatusLabel = 'Not connected';
  if (authLoading) {
    authStatusLabel = 'Checking session...';
  } else if (authEmail) {
    authStatusLabel = `Connected: ${authEmail}`;
  }

  const settingsView = (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in pb-32">
          <h2 className="text-4xl font-black uppercase tracking-tighter px-4 hidden md:block">Studio Prefs</h2>
          <div className="bg-white rounded-[3.5rem] border-4 border-white overflow-hidden divide-y shadow-2xl mx-4">
            <div className="p-10 flex items-center justify-between hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-6"><div className="p-4 bg-stone-100 rounded-2xl text-stone-900"><Sparkles size={24} /></div><p className="font-black uppercase text-xs tracking-widest">OpenAI Chef Engine</p></div>
              <Badge color={OpenAIService.isConfigured() || API_KEYS.OPENAI ? 'emerald' : 'red'}>{OpenAIService.isConfigured() || API_KEYS.OPENAI ? 'Active' : 'Missing'}</Badge>
            </div>
            <div className="p-10 flex items-center justify-between hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-6"><div className="p-4 bg-stone-100 rounded-2xl text-stone-900"><MapIcon size={24} /></div><p className="font-black uppercase text-xs tracking-widest">Maps Routing</p></div>
              <Badge color={API_KEYS.MAPS ? 'emerald' : 'red'}>{API_KEYS.MAPS ? 'Active' : 'Missing'}</Badge>
            </div>
            <div className="p-10 space-y-4 hover:bg-stone-50 transition-colors">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-stone-100 rounded-2xl text-stone-900"><User size={24} /></div>
                  <div>
                    <p className="font-black uppercase text-xs tracking-widest">Google Auth Test</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">
                      {authStatusLabel}
                    </p>
                  </div>
                </div>
                <Badge color={authEmail ? 'emerald' : 'red'}>{authEmail ? 'Connected' : 'Missing'}</Badge>
              </div>
              <div className="flex items-center gap-3">
                {authEmail ? (
                  <button
                    onClick={handleSignOut}
                    disabled={authBusy}
                    className="px-5 py-3 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-60"
                  >
                    {authBusy ? 'Working...' : 'Sign Out'}
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={authBusy || !hasSupabaseConfig}
                    className="px-5 py-3 bg-yellow-400 text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-60"
                  >
                    {authBusy ? 'Working...' : 'Sign In with Google'}
                  </button>
                )}
                {!hasSupabaseConfig && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</p>
                )}
              </div>
              {authError && <p className="text-[10px] font-black uppercase tracking-widest text-red-400">{authError}</p>}
              {plateError && <p className="text-[10px] font-black uppercase tracking-widest text-red-400">{plateError}</p>}
              {plateLoading && <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Loading plate items...</p>}
            </div>
          </div>
        </div>
      );

  const viewByTab: Record<string, React.ReactNode> = {
    home: <FeedView onSave={handleSave} onShareRequest={(item) => setActiveShareItem(item)} />,
    bites: <BitesView onSave={handleSave} onShareRequest={(item) => setActiveShareItem(item)} />,
    trims: <TrimsView onSave={handleSave} />,
    chef: <ChefAIView />,
    chat: <ChatView friends={friends} messagesByFriend={messagesByFriend} />,
    scout: <ScoutView />,
    profile: <ProfileView savedItems={savedItems} profileName={authDisplayName} profileAvatar={authAvatarUrl} />,
    settings: settingsView,
  };

  const renderView = () => viewByTab[tab] ?? viewByTab.home;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row pb-[env(safe-area-inset-bottom)] overflow-x-hidden">
      {showSnap && <SnapView onPost={handleSave} onClose={() => setShowSnap(false)} />}
      {activeShareItem && (
        <ShareModal 
          item={activeShareItem} 
          friends={friends} 
          onShare={handleShare} 
          onClose={() => setActiveShareItem(null)} 
        />
      )}
      
      {/* Desktop Navigation Sidebar / Mobile Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-200 w-80 bg-white border-r border-stone-100 transform ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0 md:static transition-transform duration-500 ease-in-out`}>
        <div className="flex flex-col h-full p-12 overflow-y-auto hide-scrollbar">
          <header className="flex items-center justify-between mb-16 md:mb-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-stone-900 rounded-3xl flex items-center justify-center text-yellow-400 shadow-2xl rotate-3"><ChefHat size={32} /></div>
              <div><h1 className="text-3xl font-black uppercase tracking-tighter leading-none">FUZO</h1><p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mt-1">Studio Lab</p></div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-4 bg-stone-50 rounded-2xl"><X size={20} /></button>
          </header>
          
          <nav className="space-y-3 grow">
            <p className="px-10 mb-4 text-[8px] font-black uppercase tracking-[0.4em] text-stone-200">Main Channels</p>
            {BottomNavItems.filter(item => item.id !== 'snap').map(item => (
              <button 
                key={item.id}
                onClick={() => { setTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-6 px-10 py-5 rounded-4xl transition-all ${tab === item.id ? 'bg-yellow-400 text-stone-900 font-black shadow-2xl' : 'text-stone-300 hover:bg-stone-50 font-black uppercase tracking-widest text-[10px]'}`}
              >
                <item.icon size={26} strokeWidth={tab === item.id ? 3 : 2.5} /> {item.label}
              </button>
            ))}

            <div className="my-10 h-px bg-stone-50" />
            <p className="px-10 mb-4 text-[8px] font-black uppercase tracking-[0.4em] text-stone-200">Studio Tools</p>
            
            {DrawerNavItems.map(item => (
              <button 
                key={item.id}
                onClick={() => { setTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-6 px-10 py-5 rounded-4xl transition-all ${tab === item.id ? 'bg-stone-900 text-white font-black shadow-2xl' : 'text-stone-300 hover:bg-stone-50 font-black uppercase tracking-widest text-[10px]'}`}
              >
                <item.icon size={26} strokeWidth={tab === item.id ? 3 : 2.5} /> {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="grow max-w-6xl mx-auto w-full px-6 md:px-12 relative pt-8 pb-32 md:pb-12">
        <header className="flex items-center justify-between mb-8 md:hidden px-2">
          <button onClick={() => setSidebarOpen(true)} className="p-3 bg-white rounded-2xl shadow-sm text-stone-900 active:scale-90 transition-transform flex items-center gap-2">
            <Menu size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>
          </button>
          <h1 className="text-xl font-black uppercase tracking-[0.5em] text-stone-900">FUZO</h1>
          <div className="w-12" />
        </header>

        {renderView()}
      </main>

      {/* Mobile Bottom Navigation - Restructured */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-2xl border-t border-stone-100 px-8 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex justify-between items-center md:hidden z-1000 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <NavIcon icon={LayoutGrid} active={tab === 'home'} onClick={() => setTab('home')} label="Feed" />
        <NavIcon icon={ChefHat} active={tab === 'bites'} onClick={() => setTab('bites')} label="Bites" />
        
        {/* SNAP Central Action */}
        <button 
          onClick={() => setShowSnap(true)} 
          className="w-20 h-20 -mt-16 bg-stone-900 rounded-[2.5rem] flex items-center justify-center text-yellow-400 shadow-[0_20px_40px_rgba(0,0,0,0.3)] border-4 border-white active:scale-90 transition-transform"
        >
          <Camera size={32} strokeWidth={3} />
        </button>

        <NavIcon icon={PlayCircle} active={tab === 'trims'} onClick={() => setTab('trims')} label="Trims" />
        <NavIcon icon={MapPin} active={tab === 'scout'} onClick={() => setTab('scout')} label="Scout" />
      </nav>

      {sidebarOpen && <button type="button" aria-label="Close menu" className="fixed inset-0 bg-stone-900/40 backdrop-blur-xl z-190 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
