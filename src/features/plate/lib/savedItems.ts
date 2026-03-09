const getSavedUiId = (itemType: string, itemId: string) => {
  const prefixByType: Record<string, string> = {
    recipe: 'recipe',
    video: 'video',
    ad: 'ad',
    trivia: 'trivia',
  };

  const prefix = prefixByType[itemType];
  return prefix ? `${prefix}-${itemId}` : itemId;
};

const getSavedItemCategory = (itemType: string) => {
  if (itemType === 'video') return 'Studio Trim';
  if (itemType === 'recipe') return 'Recipe';
  if (itemType === 'ad') return 'Ad';
  if (itemType === 'trivia') return 'Trivia';
  return 'Saved Item';
};

export const inferItemTypeFromId = (idValue: string) => {
  if (idValue.startsWith('recipe-')) return 'recipe';
  if (idValue.startsWith('video-')) return 'video';
  if (idValue.startsWith('ad-')) return 'ad';
  if (idValue.startsWith('trivia-')) return 'trivia';
  return 'restaurant';
};

export const normalizeSavedItemForUI = (savedItem: any) => {
  const metadata = (savedItem?.metadata || {}) as Record<string, any>;
  const itemType = savedItem?.item_type || savedItem?.itemType || 'other';
  const itemId = String(savedItem?.item_id || savedItem?.itemId || savedItem?.id || Date.now());
  const uiId = getSavedUiId(itemType, itemId);
  const fallbackCategory = getSavedItemCategory(itemType);

  const lat = metadata.lat ?? metadata.latitude ?? savedItem?.lat;
  const lng = metadata.lng ?? metadata.longitude ?? savedItem?.lng;

  return {
    id: uiId,
    itemType,
    itemId,
    placeId: metadata.placeId || savedItem?.placeId,
    name: metadata.title || metadata.name || savedItem?.name || `Saved ${itemType}`,
    cat: metadata.cat || metadata.category || fallbackCategory,
    img: metadata.image || metadata.img || metadata.image_url || savedItem?.img || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400',
    lat: Number.isFinite(Number(lat)) ? Number(lat) : undefined,
    lng: Number.isFinite(Number(lng)) ? Number(lng) : undefined,
    address: metadata.address || savedItem?.address,
    rating: Number.isFinite(Number(metadata.rating)) ? Number(metadata.rating) : savedItem?.rating,
    reviews: Number.isFinite(Number(metadata.reviews)) ? Number(metadata.reviews) : savedItem?.reviews,
    phone: metadata.phone || savedItem?.phone,
    website: metadata.website || savedItem?.website,
    vibe: Array.isArray(metadata.vibe) ? metadata.vibe : savedItem?.vibe,
    metadata,
  };
};

export const normalizeItemForPlateSave = (item: any) => {
  const itemIdValue = String(item.id || '');

  // Keep Scout map fields in metadata so they survive round-trips through PlateService.
  const metadata = {
    ...(item.metadata && typeof item.metadata === 'object' ? item.metadata : {}),
    title: item.metadata?.title || item.name,
    name: item.metadata?.name || item.name,
    cat: item.metadata?.cat || item.cat,
    image: item.metadata?.image || item.img,
    ...(Number.isFinite(Number(item.lat)) ? { lat: Number(item.lat) } : {}),
    ...(Number.isFinite(Number(item.lng)) ? { lng: Number(item.lng) } : {}),
    ...(item.placeId ? { placeId: item.placeId } : {}),
    ...(item.address ? { address: item.address } : {}),
    ...(Number.isFinite(Number(item.rating)) ? { rating: Number(item.rating) } : {}),
    ...(Number.isFinite(Number(item.reviews)) ? { reviews: Number(item.reviews) } : {}),
    ...(item.phone ? { phone: item.phone } : {}),
    ...(item.website ? { website: item.website } : {}),
    ...(Array.isArray(item.vibe) ? { vibe: item.vibe } : {}),
  };

  return {
    ...item,
    itemType: item.itemType || inferItemTypeFromId(itemIdValue),
    itemId: item.itemId || itemIdValue.replace(/^recipe-/, '').replace(/^video-/, '').replace(/^post-/, ''),
    metadata,
  };
};
