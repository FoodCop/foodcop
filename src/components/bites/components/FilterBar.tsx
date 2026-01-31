import { Search } from "lucide-react";
import React from "react";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDiets: string[];
  onDietToggle: (diet: string) => void;
}

const DIET_OPTIONS = [
  "vegetarian",
  "vegan",
  "gluten free",
  "ketogenic",
  "pescatarian",
  "paleo",
  "dairy free",
];

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedDiets,
  onDietToggle,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-neutral-text-lighter)] w-5 h-5" />
        <Input
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white text-[var(--color-neutral-text-light)] placeholder:text-[var(--color-neutral-text-lighter)] border-[var(--color-border)]"
        />
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-2">Filter by diet:</p>
        <div className="flex flex-wrap gap-2">
          {DIET_OPTIONS.map((diet) => {
            const isSelected = selectedDiets.includes(diet);
            return (
              <Badge
                key={diet}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => onDietToggle(diet)}
              >
                {diet}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
