import { PlateService } from '../../../services/plateService';
import { hasSupabaseConfig, supabase } from '../../../services/supabaseClient';

const snapDataUrlToBlob = (dataUrl: string): Blob => {
  const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.codePointAt(i) ?? 0;
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: 'image/jpeg' });
};

const uploadSnapImage = async (imageData: string): Promise<string> => {
  if (!hasSupabaseConfig || !supabase) {
    return imageData;
  }

  try {
    const filePath = `snaps/snap-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
    const imageBlob = snapDataUrlToBlob(imageData);

    const { error: uploadError } = await supabase.storage
      .from('snaps')
      .upload(filePath, imageBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.warn('SNAP image upload failed, using local image:', uploadError.message);
      return imageData;
    }

    const { data } = supabase.storage.from('snaps').getPublicUrl(filePath);
    return data.publicUrl || imageData;
  } catch (error) {
    console.warn('SNAP image upload failed, using local image:', error);
    return imageData;
  }
};

export const persistSnapData = async ({
  snapId,
  imageData,
  restaurant,
  cuisine,
  rating,
  description,
  location,
}: {
  snapId: string;
  imageData: string;
  restaurant: string;
  cuisine: string;
  rating: number;
  description: string;
  location?: { lat: number; lng: number } | null;
}) => {
  const imageUrl = await uploadSnapImage(imageData);

  const metadata = {
    title: restaurant || `Culinary Snap ${new Date().toLocaleDateString()}`,
    name: restaurant || `Culinary Snap ${new Date().toLocaleDateString()}`,
    cat: cuisine || 'Studio Post',
    image: imageUrl,
    image_url: imageUrl,
    rating,
    description,
    latitude: location?.lat ?? null,
    longitude: location?.lng ?? null,
    source: 'snap_feature',
  };

  if (hasSupabaseConfig && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (userId) {
        const contentParts = [`${metadata.title} - ${metadata.cat}`];
        if (description) contentParts.push(description);
        if (rating > 0) contentParts.push(`Rating: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`);

        await supabase.from('posts').insert({
          user_id: userId,
          content: contentParts.join('\n'),
          image_url: imageUrl,
          latitude: location?.lat ?? null,
          longitude: location?.lng ?? null,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn('SNAP posts persistence skipped:', error);
    }

    const plateResult = await PlateService.saveToPlate({
      itemId: snapId,
      itemType: 'photo',
      metadata,
    });

    if (!plateResult.success) {
      console.warn('SNAP plate persistence failed:', plateResult.error);
    }
  }

  return {
    id: `post-${snapId}`,
    itemType: 'photo',
    itemId: snapId,
    name: metadata.title,
    cat: metadata.cat,
    img: imageUrl,
    metadata,
  };
};
