import type { RecipeCard } from '../../../data/feed-content';
import { Clock, Users, ChefHat } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../ui/avatar';

interface RecipeCardContentProps {
  card: RecipeCard;
}

export function RecipeCardContent({ card }: RecipeCardContentProps) {
  const difficultyColors = {
    Easy: 'bg-green-500',
    Medium: 'bg-yellow-500',
    Hard: 'bg-red-500'
  };

  return (
    <>
      {/* Recipe Image */}
      <img
        src={card.imageUrl}
        alt={card.title}
        className="w-full h-full object-cover"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
      
      {/* Save Category Badge */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-orange-500 rounded-full">
        <span className="text-white">📖 Saved to {card.saveCategory}</span>
      </div>
      
      {/* Difficulty Badge */}
      <div className={`absolute top-4 right-4 px-3 py-1.5 ${difficultyColors[card.difficulty]} rounded-full`}>
        <span className="text-white">{card.difficulty}</span>
      </div>
      
      {/* Recipe Info */}
      <div className="absolute bottom-8 left-0 right-0 text-white px-6 py-6">
        <div className="flex items-center gap-2 mb-3">
          {card.authorImage && (
            <Avatar className="w-10 h-10 border-2 border-white">
              <AvatarImage src={card.authorImage} alt={card.author} />
              <AvatarFallback>{card.author[0]}</AvatarFallback>
            </Avatar>
          )}
          <div>
            <p className="text-white/70 text-[12px]">Recipe by</p>
            <p className="text-white">{card.author}</p>
          </div>
        </div>
        
        <h2 className="text-white mb-2">{card.title}</h2>
        
        <p className="text-white/90 mb-4">{card.description}</p>
        
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white text-[14px]">{card.prepTime} prep</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ChefHat className="w-4 h-4 text-white" />
            <span className="text-white text-[14px]">{card.cookTime} cook</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-[14px]">{card.servings} servings</span>
          </div>
        </div>
        
        {card.tags && card.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {card.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-[12px]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
