import { useEffect, useState } from "react";

export interface Restaurant {
  title: string;
  description: string;
  price: string;
  categoryName: string;
  address: string;
  neighborhood: string;
  street: string;
  city: string;
  postalCode: string;
  state: string;
  countryCode: string;
  website?: string;
  phone?: string;
  location: {
    lat: number;
    lng: number;
  };
  totalScore: number;
  permanentlyClosed: boolean;
  temporarilyClosed: boolean;
  placeId: string;
  categories: string[];
  reviewsCount: number;
  imagesCount: number;
  openingHours?: Array<{
    day: string;
    hours: string;
  }>;
  images?: string[];
}

export interface RestaurantCard {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  profileName: string;
  profileDesignation: string;
  tags: string[];
  isMasterBot: boolean;
  botData: {
    username: string;
    location?: string;
    specialties?: string[];
  };
  restaurant?: Restaurant;
}

export function useRestaurantData() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantCards, setRestaurantCards] = useState<RestaurantCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);

      // Fetch restaurant data from the JSON file
      const response = await fetch("/MasterBotBucket2.json");
      if (!response.ok) {
        throw new Error("Failed to fetch restaurant data");
      }

      const data = await response.json();

      // Filter out closed restaurants and limit to reasonable number
      const validRestaurants = data
        .filter(
          (restaurant: Restaurant) =>
            !restaurant.permanentlyClosed &&
            !restaurant.temporarilyClosed &&
            restaurant.totalScore >= 3.0
        )
        .slice(0, 1000); // Limit to 1000 restaurants for performance

      setRestaurants(validRestaurants);

      // Convert to restaurant cards
      const cards = validRestaurants.map((restaurant) =>
        convertRestaurantToCard(restaurant)
      );
      setRestaurantCards(cards);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch restaurant data"
      );
      console.error("Error fetching restaurant data:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    restaurants,
    restaurantCards,
    loading,
    error,
    refetch: fetchRestaurantData,
  };
}

function convertRestaurantToCard(restaurant: Restaurant): RestaurantCard {
  return {
    id: restaurant.placeId,
    image:
      restaurant.images?.[0] || `/images/restaurants/${restaurant.placeId}.jpg`,
    title: restaurant.title,
    subtitle: restaurant.description,
    profileName: restaurant.title,
    profileDesignation: restaurant.categoryName,
    tags: restaurant.categories.slice(0, 5), // Limit to 5 categories
    isMasterBot: false,
    botData: {
      username: restaurant.title.toLowerCase().replace(/\s+/g, "_"),
      location: `${restaurant.city}, ${getCountryName(restaurant.countryCode)}`,
      specialties: restaurant.categories.slice(0, 3),
    },
    restaurant: restaurant,
  };
}

// Convert country code to readable name
function getCountryName(countryCode: string): string {
  const countryMap: { [key: string]: string } = {
    US: "USA",
    GB: "UK",
    FR: "France",
    DE: "Germany",
    IT: "Italy",
    ES: "Spain",
    JP: "Japan",
    CN: "China",
    IN: "India",
    TH: "Thailand",
    VN: "Vietnam",
    KR: "South Korea",
    AU: "Australia",
    CA: "Canada",
    BR: "Brazil",
    MX: "Mexico",
    AR: "Argentina",
    NL: "Netherlands",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    FI: "Finland",
    CH: "Switzerland",
    AT: "Austria",
    BE: "Belgium",
    PT: "Portugal",
    GR: "Greece",
    TR: "Turkey",
    MA: "Morocco",
    EG: "Egypt",
    ZA: "South Africa",
    NZ: "New Zealand",
    SG: "Singapore",
    MY: "Malaysia",
    HK: "Hong Kong",
  };

  return countryMap[countryCode] || countryCode;
}
