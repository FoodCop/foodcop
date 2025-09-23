import { RestaurantCard } from "../scout/RestaurantCard";
import { Restaurant } from "../ScoutPage";

interface NearbyRestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
}

export function NearbyRestaurantCard({
  restaurant,
  onClick,
}: NearbyRestaurantCardProps) {
  return (
    <RestaurantCard
      restaurant={restaurant}
      onClick={onClick}
      variant="horizontal"
    />
  );
}
