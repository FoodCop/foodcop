import { RestaurantCard } from "../scout/RestaurantCard";
import { Restaurant } from "../ScoutPage";

interface NearbyRestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
  onMapClick?: () => void;
}

export function NearbyRestaurantCard({
  restaurant,
  onClick,
  onMapClick,
}: NearbyRestaurantCardProps) {
  return (
    <RestaurantCard
      restaurant={restaurant}
      onClick={onClick}
      variant="horizontal"
      showMapIcon={true}
      onMapClick={onMapClick}
    />
  );
}
