// Types for MasterSet JSON restaurant data

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface OpeningHoursEntry {
  day: string;
  hours: string;
}

export interface AdditionalInfoItem {
  [key: string]: boolean;
}

export interface AdditionalInfo {
  'Service options'?: AdditionalInfoItem[];
  'Highlights'?: AdditionalInfoItem[];
  'Popular for'?: AdditionalInfoItem[];
  'Accessibility'?: AdditionalInfoItem[];
  'Offerings'?: AdditionalInfoItem[];
  'Dining options'?: AdditionalInfoItem[];
  'Amenities'?: AdditionalInfoItem[];
  'Atmosphere'?: AdditionalInfoItem[];
  'Crowd'?: AdditionalInfoItem[];
  'Planning'?: AdditionalInfoItem[];
  'Payments'?: AdditionalInfoItem[];
  'Parking'?: AdditionalInfoItem[];
  'Children'?: AdditionalInfoItem[];
  [key: string]: AdditionalInfoItem[] | undefined;
}

export interface MasterSetLocation {
  // Core identification
  title: string;
  description: string;
  placeId: string;
  cid: string;
  fid: string;

  // Categorization
  categoryName: string;
  categories: string[];

  // Location
  address: string;
  neighborhood: string;
  street: string;
  city: string;
  postalCode: string;
  state: string;
  countryCode: string;
  location: LocationCoordinates;

  // Contact
  website: string | null;
  phone: string;
  phoneUnformatted: string;

  // Ratings & engagement
  totalScore: number;
  reviewsCount: number;
  imagesCount: number;
  price: string;

  // Status
  permanentlyClosed: boolean;
  temporarilyClosed: boolean;
  claimThisBusiness: boolean;

  // Hours & reservations
  openingHours: OpeningHoursEntry[];
  reserveTableUrl: string | null;
  googleFoodUrl: string | null;

  // Additional metadata
  additionalInfo: AdditionalInfo;
  imageCategories: string[];
  hotelAds: unknown[];
  peopleAlsoSearch: unknown[];
  placesTags: unknown[];
  reviewsTags: unknown[];

  // Scrape metadata
  scrapedAt: string;
}

// Query parameters for filtering locations
export interface LocationQueryParams {
  city?: string;
  categories?: string[];
  minRating?: number;
  maxPrice?: string;
  neighborhood?: string;
  limit?: number;
  offset?: number;
  nearLocation?: LocationCoordinates;
  radiusKm?: number;
}

