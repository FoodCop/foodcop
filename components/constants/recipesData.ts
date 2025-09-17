export interface Author {
  name: string;
  avatar: string;
  verified: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  cookingTime: number; // in minutes
  calories: number;
  servings: number;
  cuisine: string;
  rating: number;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: Ingredient[];
  instructions: Instruction[];
  nutrition: Nutrition;
  author: Author;
  description: string;
  preparationTime: number;
  totalTime: number;
  isUserCreated?: boolean;
  isBackendRecipe?: boolean;
  reviews?: number;
  nutritionInfo?: any;
  isSaved?: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
  category?: string;
}

export interface Instruction {
  id: string;
  step: number;
  description: string;
  image?: string;
  timer?: number; // optional timer in minutes
}

export interface Nutrition {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  fiber: number; // in grams
  sugar: number; // in grams
  sodium: number; // in mg
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  photos?: string[];
}

export const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "Creamy Tuscan Pasta",
    image: "https://images.unsplash.com/photo-1693820206848-6ad84857832a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpY2lvdXMlMjBwYXN0YSUyMHJlY2lwZXxlbnwxfHx8fDE3NTY3NDE1NzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    cookingTime: 25,
    calories: 520,
    servings: 4,
    cuisine: "Italian",
    rating: 4.8,
    tags: ["creamy", "pasta", "quick", "comfort-food"],
    difficulty: "Easy",
    author: {
      name: "Chef Marco",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      verified: true
    },
    description: "A rich and creamy pasta dish with sun-dried tomatoes, spinach, and parmesan cheese.",
    preparationTime: 10,
    totalTime: 35,
    ingredients: [
      { id: "1", name: "Penne pasta", amount: "1", unit: "lb", category: "grains" },
      { id: "2", name: "Heavy cream", amount: "1", unit: "cup", category: "dairy" },
      { id: "3", name: "Sun-dried tomatoes", amount: "1/2", unit: "cup", category: "vegetables" },
      { id: "4", name: "Fresh spinach", amount: "2", unit: "cups", category: "vegetables" },
      { id: "5", name: "Parmesan cheese", amount: "1/2", unit: "cup", category: "dairy" },
      { id: "6", name: "Garlic cloves", amount: "3", unit: "cloves", category: "aromatics" },
      { id: "7", name: "Olive oil", amount: "2", unit: "tbsp", category: "oils" }
    ],
    instructions: [
      { id: "1", step: 1, description: "Cook pasta according to package directions. Reserve 1 cup pasta water before draining.", timer: 12 },
      { id: "2", step: 2, description: "In a large pan, heat olive oil over medium heat. Add minced garlic and cook for 1 minute." },
      { id: "3", step: 3, description: "Add sun-dried tomatoes and cook for 2 minutes until fragrant." },
      { id: "4", step: 4, description: "Pour in heavy cream and bring to a gentle simmer. Add spinach and cook until wilted." },
      { id: "5", step: 5, description: "Add cooked pasta and toss with sauce. Add pasta water if needed for consistency." },
      { id: "6", step: 6, description: "Remove from heat, add parmesan cheese, and toss until melted. Season with salt and pepper." }
    ],
    nutrition: {
      calories: 520,
      protein: 18,
      carbs: 65,
      fat: 22,
      fiber: 4,
      sugar: 8,
      sodium: 680
    }
  },
  {
    id: "2",
    title: "Mediterranean Quinoa Bowl",
    image: "https://images.unsplash.com/photo-1643750182373-b4a55a8c2801?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwc2FsYWQlMjBib3dsfGVufDF8fHx8MTc1Njc5MzU0NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    cookingTime: 20,
    calories: 385,
    servings: 2,
    cuisine: "Mediterranean",
    rating: 4.6,
    tags: ["healthy", "vegetarian", "high-protein", "gluten-free"],
    difficulty: "Easy",
    author: {
      name: "Chef Sofia",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      verified: true
    },
    description: "A nutritious and colorful bowl packed with quinoa, fresh vegetables, and tahini dressing.",
    preparationTime: 15,
    totalTime: 35,
    ingredients: [
      { id: "1", name: "Quinoa", amount: "1", unit: "cup", category: "grains" },
      { id: "2", name: "Cucumber", amount: "1", unit: "medium", category: "vegetables" },
      { id: "3", name: "Cherry tomatoes", amount: "1", unit: "cup", category: "vegetables" },
      { id: "4", name: "Red onion", amount: "1/4", unit: "medium", category: "vegetables" },
      { id: "5", name: "Chickpeas", amount: "1", unit: "can", category: "legumes" },
      { id: "6", name: "Feta cheese", amount: "1/4", unit: "cup", category: "dairy" },
      { id: "7", name: "Tahini", amount: "2", unit: "tbsp", category: "nuts" },
      { id: "8", name: "Lemon juice", amount: "2", unit: "tbsp", category: "citrus" }
    ],
    instructions: [
      { id: "1", step: 1, description: "Cook quinoa according to package directions. Let cool completely.", timer: 15 },
      { id: "2", step: 2, description: "Dice cucumber, halve cherry tomatoes, and thinly slice red onion." },
      { id: "3", step: 3, description: "Drain and rinse chickpeas. Pat dry with paper towels." },
      { id: "4", step: 4, description: "Whisk together tahini, lemon juice, olive oil, salt, and pepper for dressing." },
      { id: "5", step: 5, description: "Combine quinoa, vegetables, and chickpeas in a large bowl." },
      { id: "6", step: 6, description: "Drizzle with dressing, top with feta cheese, and toss gently to combine." }
    ],
    nutrition: {
      calories: 385,
      protein: 16,
      carbs: 52,
      fat: 14,
      fiber: 8,
      sugar: 12,
      sodium: 420
    }
  },
  {
    id: "3",
    title: "Herb-Crusted Grilled Chicken",
    image: "https://images.unsplash.com/photo-1496074620649-6b1b02e5c1c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwY2hpY2tlbiUyMGRpbm5lcnxlbnwxfHx8fDE3NTY4NDE5MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    cookingTime: 30,
    calories: 295,
    servings: 4,
    cuisine: "American",
    rating: 4.7,
    tags: ["high-protein", "low-carb", "grilled", "herbs"],
    difficulty: "Medium",
    author: {
      name: "Chef David",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      verified: true
    },
    description: "Juicy grilled chicken breast with a fragrant herb crust and garlic marinade.",
    preparationTime: 45,
    totalTime: 75,
    ingredients: [
      { id: "1", name: "Chicken breasts", amount: "4", unit: "pieces", category: "protein" },
      { id: "2", name: "Fresh rosemary", amount: "2", unit: "tbsp", category: "herbs" },
      { id: "3", name: "Fresh thyme", amount: "2", unit: "tbsp", category: "herbs" },
      { id: "4", name: "Garlic cloves", amount: "4", unit: "cloves", category: "aromatics" },
      { id: "5", name: "Olive oil", amount: "3", unit: "tbsp", category: "oils" },
      { id: "6", name: "Lemon zest", amount: "1", unit: "lemon", category: "citrus" },
      { id: "7", name: "Sea salt", amount: "1", unit: "tsp", category: "seasonings" }
    ],
    instructions: [
      { id: "1", step: 1, description: "Pound chicken breasts to even thickness. Mix herbs, garlic, oil, and lemon zest for marinade.", timer: 10 },
      { id: "2", step: 2, description: "Marinate chicken in herb mixture for at least 30 minutes or up to 4 hours.", timer: 30 },
      { id: "3", step: 3, description: "Preheat grill to medium-high heat. Remove chicken from marinade." },
      { id: "4", step: 4, description: "Grill chicken for 6-7 minutes per side until internal temperature reaches 165°F.", timer: 14 },
      { id: "5", step: 5, description: "Let chicken rest for 5 minutes before slicing. Serve with fresh herbs.", timer: 5 }
    ],
    nutrition: {
      calories: 295,
      protein: 54,
      carbs: 2,
      fat: 8,
      fiber: 0,
      sugar: 1,
      sodium: 380
    }
  },
  {
    id: "4",
    title: "Decadent Chocolate Lava Cake",
    image: "https://images.unsplash.com/photo-1736840334919-aac2d5af73e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBkZXNzZXJ0JTIwY2FrZXxlbnwxfHx8fDE3NTY4MjQ2NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    cookingTime: 12,
    calories: 420,
    servings: 2,
    cuisine: "French",
    rating: 4.9,
    tags: ["dessert", "chocolate", "quick", "romantic"],
    difficulty: "Medium",
    author: {
      name: "Chef Claire",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      verified: true
    },
    description: "Rich chocolate cake with a molten center that flows like lava when cut.",
    preparationTime: 15,
    totalTime: 27,
    ingredients: [
      { id: "1", name: "Dark chocolate", amount: "4", unit: "oz", category: "chocolate" },
      { id: "2", name: "Butter", amount: "4", unit: "tbsp", category: "dairy" },
      { id: "3", name: "Eggs", amount: "2", unit: "large", category: "dairy" },
      { id: "4", name: "Sugar", amount: "1/4", unit: "cup", category: "sweeteners" },
      { id: "5", name: "All-purpose flour", amount: "2", unit: "tbsp", category: "grains" },
      { id: "6", name: "Vanilla extract", amount: "1/2", unit: "tsp", category: "extracts" },
      { id: "7", name: "Powdered sugar", amount: "2", unit: "tbsp", category: "sweeteners" }
    ],
    instructions: [
      { id: "1", step: 1, description: "Preheat oven to 425°F. Butter two 6-oz ramekins and dust with cocoa powder." },
      { id: "2", step: 2, description: "Melt chocolate and butter in double boiler until smooth. Let cool slightly.", timer: 5 },
      { id: "3", step: 3, description: "Whisk eggs and sugar until thick and pale. Add vanilla extract." },
      { id: "4", step: 4, description: "Fold melted chocolate into egg mixture, then gently fold in flour." },
      { id: "5", step: 5, description: "Divide batter between ramekins. Bake for 12-14 minutes until edges are firm.", timer: 12 },
      { id: "6", step: 6, description: "Let cool for 1 minute, then invert onto plates. Dust with powdered sugar and serve immediately." }
    ],
    nutrition: {
      calories: 420,
      protein: 8,
      carbs: 32,
      fat: 28,
      fiber: 4,
      sugar: 26,
      sodium: 95
    }
  },
  {
    id: "5",
    title: "Spicy Ramen Bowl",
    image: "https://images.unsplash.com/photo-1677011454858-8ecb6d4e6ce0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMG5vb2RsZSUyMHNvdXB8ZW58MXx8fHwxNzU2ODQyMjAxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    cookingTime: 35,
    calories: 450,
    servings: 2,
    cuisine: "Japanese",
    rating: 4.7,
    tags: ["spicy", "comfort-food", "asian", "noodles"],
    difficulty: "Medium",
    author: {
      name: "Chef Yuki",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      verified: true
    },
    description: "Authentic Japanese ramen with rich tonkotsu broth, tender pork, and fresh vegetables.",
    preparationTime: 20,
    totalTime: 55,
    ingredients: [
      { id: "1", name: "Ramen noodles", amount: "2", unit: "packages", category: "grains" },
      { id: "2", name: "Pork belly", amount: "8", unit: "oz", category: "protein" },
      { id: "3", name: "Chicken broth", amount: "4", unit: "cups", category: "liquids" },
      { id: "4", name: "Miso paste", amount: "3", unit: "tbsp", category: "condiments" },
      { id: "5", name: "Soft-boiled eggs", amount: "2", unit: "eggs", category: "protein" },
      { id: "6", name: "Green onions", amount: "2", unit: "stalks", category: "vegetables" },
      { id: "7", name: "Nori sheets", amount: "2", unit: "sheets", category: "vegetables" }
    ],
    instructions: [
      { id: "1", step: 1, description: "Slice pork belly and cook until crispy. Set aside." },
      { id: "2", step: 2, description: "Prepare soft-boiled eggs and marinate in soy sauce mixture.", timer: 15 },
      { id: "3", step: 3, description: "Heat chicken broth and whisk in miso paste until dissolved." },
      { id: "4", step: 4, description: "Cook ramen noodles according to package instructions. Drain.", timer: 3 },
      { id: "5", step: 5, description: "Assemble bowls with noodles, broth, pork, eggs, and garnishes." }
    ],
    nutrition: {
      calories: 450,
      protein: 28,
      carbs: 45,
      fat: 18,
      fiber: 3,
      sugar: 6,
      sodium: 1200
    }
  },
  {
    id: "6",
    title: "Classic Margherita Pizza",
    image: "https://images.unsplash.com/photo-1672856398893-2fb52d807874?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHBpenphJTIwbWFyZ2hlcml0YXxlbnwxfHx8fDE3NTY3OTQwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    cookingTime: 15,
    calories: 380,
    servings: 4,
    cuisine: "Italian",
    rating: 4.9,
    tags: ["pizza", "vegetarian", "classic", "italian"],
    difficulty: "Medium",
    author: {
      name: "Chef Giuseppe",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      verified: true
    },
    description: "Traditional Neapolitan pizza with fresh mozzarella, tomatoes, and basil.",
    preparationTime: 90,
    totalTime: 105,
    ingredients: [
      { id: "1", name: "Pizza dough", amount: "1", unit: "ball", category: "grains" },
      { id: "2", name: "San Marzano tomatoes", amount: "1", unit: "can", category: "vegetables" },
      { id: "3", name: "Fresh mozzarella", amount: "8", unit: "oz", category: "dairy" },
      { id: "4", name: "Fresh basil", amount: "10", unit: "leaves", category: "herbs" },
      { id: "5", name: "Extra virgin olive oil", amount: "2", unit: "tbsp", category: "oils" },
      { id: "6", name: "Sea salt", amount: "1", unit: "tsp", category: "seasonings" }
    ],
    instructions: [
      { id: "1", step: 1, description: "Let pizza dough come to room temperature for 1 hour.", timer: 60 },
      { id: "2", step: 2, description: "Preheat oven to 500°F with pizza stone inside." },
      { id: "3", step: 3, description: "Stretch dough into a 12-inch circle on floured surface." },
      { id: "4", step: 4, description: "Spread thin layer of crushed tomatoes, leaving 1-inch border." },
      { id: "5", step: 5, description: "Add torn mozzarella and drizzle with olive oil." },
      { id: "6", step: 6, description: "Bake for 10-12 minutes until crust is golden and cheese bubbles.", timer: 12 },
      { id: "7", step: 7, description: "Top with fresh basil and serve immediately." }
    ],
    nutrition: {
      calories: 380,
      protein: 16,
      carbs: 48,
      fat: 14,
      fiber: 3,
      sugar: 8,
      sodium: 720
    }
  }
];

export const mockComments: Record<string, Comment[]> = {
  "1": [
    {
      id: "c1",
      userId: "u1",
      userName: "Sarah M.",
      userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b3d6?w=150",
      content: "Made this last night and it was absolutely delicious! My family loved it.",
      timestamp: "2024-01-15T18:30:00Z",
      likes: 12,
      photos: ["https://images.unsplash.com/photo-1693820206848-6ad84857832a?w=400"]
    },
    {
      id: "c2",
      userId: "u2",
      userName: "Mike Chen",
      userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      content: "Pro tip: add a splash of white wine for extra flavor!",
      timestamp: "2024-01-14T14:22:00Z",
      likes: 8
    }
  ],
  "2": [
    {
      id: "c3",
      userId: "u3",
      userName: "Emma Wilson",
      userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      content: "Perfect for meal prep! Made 4 servings on Sunday.",
      timestamp: "2024-01-16T12:15:00Z",
      likes: 15
    }
  ],
  "5": [
    {
      id: "c4",
      userId: "u4",
      userName: "Alex Kumar",
      userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      content: "This is my new favorite ramen recipe! The broth is so rich and flavorful.",
      timestamp: "2024-01-17T19:45:00Z",
      likes: 23,
      photos: ["https://images.unsplash.com/photo-1677011454858-8ecb6d4e6ce0?w=400"]
    },
    {
      id: "c5",
      userId: "u5",
      userName: "Jessica Lee",
      userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      content: "Added extra chili oil for more heat - perfect!",
      timestamp: "2024-01-16T20:30:00Z",
      likes: 7
    }
  ],
  "6": [
    {
      id: "c6",
      userId: "u6",
      userName: "Marco Rossi",
      userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      content: "As an Italian, I approve! This is how real pizza should be made. 🇮🇹",
      timestamp: "2024-01-18T16:20:00Z",
      likes: 31
    },
    {
      id: "c7",
      userId: "u7",
      userName: "Lisa Brown",
      userAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150",
      content: "Made this for date night - it was amazing! The crust was perfectly crispy.",
      timestamp: "2024-01-17T21:10:00Z",
      likes: 18,
      photos: ["https://images.unsplash.com/photo-1672856398893-2fb52d807874?w=400"]
    }
  ]
};