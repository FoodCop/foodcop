# Master Bot Datasets

This directory contains specialized restaurant datasets for each of the 7 Master Bots in the FUZO AI Connoisseur System.

## 📊 Dataset Summary

| Master Bot            | Specialty                   | Restaurants | Top Countries                          | Top Rating |
| --------------------- | --------------------------- | ----------- | -------------------------------------- | ---------- |
| **Anika Kapoor**      | Indian/Asian Cuisine Expert | 159         | India (24), Japan (22), Hong Kong (18) | 5.0⭐      |
| **Sebastian LeClair** | Fine Dining Expert          | 434         | Japan (47), France (47), Spain (45)    | 5.0⭐      |
| **Lila Cheng**        | Vegan Specialist            | 147         | France (17), Hong Kong (16), US (16)   | 5.0⭐      |
| **Jun Tanaka**        | Japanese Cuisine Master     | 102         | Japan (22), Spain (10), Mexico (10)    | 5.0⭐      |
| **Omar Darzi**        | Coffee Culture Expert       | 101         | UK (13), Mexico (12), Japan (12)       | 4.9⭐      |
| **Rafael Mendez**     | Adventure Foodie            | 122         | Mexico (23), UK (15), US (13)          | 5.0⭐      |
| **Aurelia Voss**      | Street Food Explorer        | 70          | UK (9), India (8), US (8)              | 5.0⭐      |

## 🎯 Dataset Files

### Individual Bot Datasets

- `spice_scholar_anika-data.json` - Indian/Asian cuisine restaurants
- `sommelier_seb-data.json` - Fine dining establishments
- `plant_pioneer_lila-data.json` - Vegan and plant-based restaurants
- `zen_minimalist_jun-data.json` - Japanese cuisine restaurants
- `coffee_pilgrim_omar-data.json` - Coffee shops and cafes
- `adventure_rafa-data.json` - Adventure and outdoor dining
- `aurelia-street-food-data.json` - Street food and food courts

### Summary Files

- `README.md` - This overview file
- `../aurelia-street-food-summary.md` - Detailed Aurelia analysis

## 🌍 Global Coverage

The datasets cover restaurants from **20+ countries** including:

- 🇺🇸 United States
- 🇬🇧 United Kingdom
- 🇯🇵 Japan
- 🇫🇷 France
- 🇪🇸 Spain
- 🇮🇳 India
- 🇭🇰 Hong Kong
- 🇹🇭 Thailand
- 🇸🇬 Singapore
- 🇲🇽 Mexico
- And many more...

## 📈 Quality Metrics

- **Total Restaurants**: 1,135 across all datasets
- **Average Rating**: 4.2+ stars
- **Price Ranges**: $ to $$$$ (Budget to Luxury)
- **Categories**: 50+ different restaurant types
- **Geographic Spread**: 6 continents

## 🔧 Usage in FUZO App

These datasets can be used for:

1. **Feed Generation**: Create authentic posts for each master bot
2. **Recommendations**: Suggest restaurants based on user preferences
3. **Location Discovery**: Show nearby options in user's area
4. **Cultural Stories**: Share authentic dining experiences
5. **Travel Inspiration**: Inspire users to explore global cuisine

## 📝 Data Structure

Each dataset follows this structure:

```json
{
  "masterBot": {
    "id": "bot-id",
    "username": "bot_username",
    "display_name": "Bot Name",
    "specialty": "Specialty Description",
    "emoji": "🌍",
    "description": "Bot description",
    "avatar_url": "/images/users/Bot Name.png",
    "personality_traits": ["Trait1", "Trait2"],
    "cuisines": ["Cuisine1", "Cuisine2"],
    "price_range": ["Budget", "Affordable"],
    "ambiance": ["Authentic", "Local"]
  },
  "metadata": {
    "total_restaurants": 100,
    "extracted_at": "2025-01-20T15:14:20.813Z",
    "source_file": "MasterBotBucket2.json",
    "keywords_used": ["keyword1", "keyword2"],
    "price_ranges": ["$", "$$"],
    "categories": ["Category1", "Category2"]
  },
  "restaurants": [
    // Array of restaurant objects
  ]
}
```

## 🚀 Next Steps

1. **Integration**: Integrate datasets into the feed system
2. **Testing**: Test feed generation with real data
3. **Optimization**: Refine keyword matching and filtering
4. **Expansion**: Add more specialized datasets as needed
5. **Analytics**: Track user engagement with different bot content

---

_Generated on 2025-01-20 - FUZO AI Connoisseur System_
