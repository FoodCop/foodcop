import { expect, test } from "@playwright/test";

test.describe("Profile API Endpoints", () => {
  const API_BASE = "http://localhost:3000/make-server-5976446e";

  test("should create and retrieve user profile", async ({ request }) => {
    // Mock user authentication token
    const authToken = "mock-auth-token";

    // Test profile creation
    const profileData = {
      display_name: "API Test User",
      bio: "Testing API endpoints",
      dietary_preferences: ["vegetarian", "gluten-free"],
      cuisine_preferences: ["italian", "japanese"],
      onboarding_completed: true,
    };

    const createResponse = await request.patch(`${API_BASE}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      data: profileData,
    });

    expect(createResponse.status()).toBe(200);
    const createResult = await createResponse.json();
    expect(createResult.success).toBe(true);
    expect(createResult.profile.display_name).toBe("API Test User");
  });

  test("should save restaurant to user plate", async ({ request }) => {
    const authToken = "mock-auth-token";

    const restaurantData = {
      restaurant: {
        id: "test-restaurant-123",
        place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
        name: "Test Restaurant",
        image: "https://example.com/restaurant.jpg",
        rating: 4.5,
        cuisine: ["Italian", "Pizza"],
        price_level: 2,
        address: "123 Test Street, Test City",
        geometry: {
          location: {
            lat: 40.7128,
            lng: -74.006,
          },
        },
      },
    };

    const saveResponse = await request.post(
      `${API_BASE}/profile/save-restaurant`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: restaurantData,
      }
    );

    expect(saveResponse.status()).toBe(200);
    const saveResult = await saveResponse.json();
    expect(saveResult.success).toBe(true);
    expect(saveResult.savedRestaurant.name).toBe("Test Restaurant");
  });

  test("should retrieve saved restaurants", async ({ request }) => {
    const authToken = "mock-auth-token";

    const getResponse = await request.get(
      `${API_BASE}/profile/saved-restaurants`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(getResponse.status()).toBe(200);
    const getResult = await getResponse.json();
    expect(getResult.restaurants).toBeDefined();
    expect(Array.isArray(getResult.restaurants)).toBe(true);
  });

  test("should save photo to user profile", async ({ request }) => {
    const authToken = "mock-auth-token";

    const photoData = {
      photo: {
        image: "https://example.com/food-photo.jpg",
        caption: "Delicious pasta dish",
        tags: ["pasta", "italian", "dinner"],
        points: 15,
        location: "Test Restaurant",
      },
    };

    const saveResponse = await request.post(`${API_BASE}/profile/save-photo`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      data: photoData,
    });

    expect(saveResponse.status()).toBe(200);
    const saveResult = await saveResponse.json();
    expect(saveResult.success).toBe(true);
    expect(saveResult.savedPhoto.caption).toBe("Delicious pasta dish");
  });

  test("should retrieve saved photos", async ({ request }) => {
    const authToken = "mock-auth-token";

    const getResponse = await request.get(`${API_BASE}/profile/saved-photos`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(getResponse.status()).toBe(200);
    const getResult = await getResponse.json();
    expect(getResult.photos).toBeDefined();
    expect(Array.isArray(getResult.photos)).toBe(true);
  });

  test("should handle duplicate restaurant saves", async ({ request }) => {
    const authToken = "mock-auth-token";

    const restaurantData = {
      restaurant: {
        id: "duplicate-test-restaurant",
        place_id: "ChIJDuplicate123",
        name: "Duplicate Test Restaurant",
        image: "https://example.com/duplicate.jpg",
        rating: 4.0,
        cuisine: ["Mexican"],
        price_level: 1,
        address: "456 Duplicate Street",
      },
    };

    // Save restaurant first time
    const firstSave = await request.post(
      `${API_BASE}/profile/save-restaurant`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: restaurantData,
      }
    );

    expect(firstSave.status()).toBe(200);
    const firstResult = await firstSave.json();
    expect(firstResult.success).toBe(true);

    // Try to save same restaurant again
    const secondSave = await request.post(
      `${API_BASE}/profile/save-restaurant`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: restaurantData,
      }
    );

    expect(secondSave.status()).toBe(200);
    const secondResult = await secondSave.json();
    expect(secondResult.success).toBe(false);
    expect(secondResult.message).toBe("Restaurant is already saved");
  });

  test("should remove restaurant from plate", async ({ request }) => {
    const authToken = "mock-auth-token";

    // First save a restaurant
    const restaurantData = {
      restaurant: {
        id: "removal-test-restaurant",
        place_id: "ChIJRemoval123",
        name: "Removal Test Restaurant",
        image: "https://example.com/removal.jpg",
        rating: 3.5,
        cuisine: ["American"],
        price_level: 2,
        address: "789 Removal Street",
      },
    };

    await request.post(`${API_BASE}/profile/save-restaurant`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      data: restaurantData,
    });

    // Then remove it
    const removeResponse = await request.delete(
      `${API_BASE}/profile/saved-restaurants/${restaurantData.restaurant.place_id}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(removeResponse.status()).toBe(200);
    const removeResult = await removeResponse.json();
    expect(removeResult.success).toBe(true);
    expect(removeResult.message).toBe("Restaurant removed from plate");
  });

  test("should validate profile data", async ({ request }) => {
    const authToken = "mock-auth-token";

    // Test invalid profile data
    const invalidProfileData = {
      display_name: "", // Empty name should fail
      bio: "x".repeat(1001), // Bio too long should fail
      dietary_preferences: "not-an-array", // Should be array
    };

    const response = await request.patch(`${API_BASE}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      data: invalidProfileData,
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.error).toBe("Validation failed");
    expect(result.details).toBeDefined();
  });

  test("should handle authentication errors", async ({ request }) => {
    // Test without auth token
    const response = await request.get(`${API_BASE}/profile/saved-restaurants`);

    expect(response.status()).toBe(401);
    const result = await response.json();
    expect(result.error).toBe("Authentication required");
  });
});
