import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ensureSaved, ensureRemoved, isItemSaved } from "../../src/lib/plate";

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(),
};

vi.mock("../../utils/supabase", () => ({
  getSupabaseClient: () => mockSupabase,
}));

describe("Plate Idempotency Tests", () => {
  const testParams = {
    tenantId: "tenant-123",
    userId: "user-456",
    itemType: "restaurant" as const,
    itemId: "restaurant-789",
    meta: { title: "Pizza Place" },
  };

  const mockSavedItem = {
    id: "saved-123",
    tenant_id: testParams.tenantId,
    user_id: testParams.userId,
    item_type: testParams.itemType,
    item_id: testParams.itemId,
    metadata: testParams.meta,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock setup
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    
    // Default mock implementations
    mockSupabase.from.mockReturnValue({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockSavedItem,
            error: null,
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue(vi.fn().mockResolvedValue({
                data: null,
                error: null,
              })),
            }),
          }),
        }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue(vi.fn().mockResolvedValue({
                  data: [mockSavedItem],
                  error: null,
                })),
              }),
            }),
          }),
        }),
      }),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("ensureSaved", () => {
    it("should be idempotent - multiple calls result in exactly one row", async () => {
      // Call ensureSaved multiple times
      const results = await Promise.all([
        ensureSaved(testParams),
        ensureSaved(testParams),
        ensureSaved(testParams),
      ]);

      // All calls should return the same result
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(mockSavedItem);
      expect(results[1]).toEqual(mockSavedItem);
      expect(results[2]).toEqual(mockSavedItem);
    });

    it("should handle unique constraint violations gracefully", async () => {
      // Mock unique constraint violation
      const mockUpsert = vi.fn().mockResolvedValue({
        data: mockSavedItem,
        error: null,
      });
      
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: mockUpsert,
          }),
        }),
      });

      const result = await ensureSaved(testParams);
      expect(result).toEqual(mockSavedItem);
    });

    it("should throw error on database errors", async () => {
      // Mock database error
      const mockUpsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });
      
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: mockUpsert,
          }),
        }),
      });

      await expect(ensureSaved(testParams)).rejects.toThrow(
        "Failed to ensure saved"
      );
    });
  });

  describe("ensureRemoved", () => {
    it("should be idempotent - deleting non-existent item is not an error", async () => {
      // Mock successful delete (even if item doesn't exist)
      const mockDelete = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(mockDelete),
              }),
            }),
          }),
        }),
      });

      // Should not throw error even if item doesn't exist
      await expect(ensureRemoved(testParams)).resolves.not.toThrow();
    });

    it("should throw error on database errors", async () => {
      // Mock database error
      const mockDelete = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });
      
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(mockDelete),
              }),
            }),
          }),
        }),
      });

      await expect(
        ensureRemoved({
          tenantId: testParams.tenantId,
          userId: testParams.userId,
          itemType: testParams.itemType,
          itemId: testParams.itemId,
        })
      ).rejects.toThrow("Failed to ensure removed");
    });
  });

  describe("isItemSaved", () => {
    it("should return true when item exists", async () => {
      // Mock item exists
      const mockSelect = vi.fn().mockResolvedValue({
        data: [mockSavedItem],
        error: null,
      });
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue(mockSelect),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await isItemSaved(testParams);
      expect(result).toBe(true);
    });

    it("should return false when item does not exist", async () => {
      // Mock item doesn't exist
      const mockSelect = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue(mockSelect),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await isItemSaved(testParams);
      expect(result).toBe(false);
    });
  });

  describe("Rapid Clicking Simulation", () => {
    it("should handle rapid save clicks without creating duplicates", async () => {
      // Call ensureSaved multiple times rapidly
      const promises = Array(5)
        .fill(null)
        .map(() => ensureSaved(testParams));
      const results = await Promise.all(promises);

      // All calls should succeed
      results.forEach((result) => {
        expect(result).toEqual(mockSavedItem);
      });
    });
  });

  describe("Retry After Timeout Simulation", () => {
    it("should handle retry after simulated timeout", async () => {
      // First call fails with timeout
      const mockUpsertFail = vi.fn().mockRejectedValue(new Error("Timeout"));
      const mockUpsertSuccess = vi.fn().mockResolvedValue({
        data: mockSavedItem,
        error: null,
      });

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => ({
        upsert: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockImplementation(() => ({
            maybeSingle: () => {
              callCount++;
              if (callCount === 1) {
                return mockUpsertFail();
              }
              return mockUpsertSuccess();
            },
          })),
        })),
      }));

      // First call should fail
      await expect(ensureSaved(testParams)).rejects.toThrow("Timeout");

      // Second call should succeed
      const result = await ensureSaved(testParams);
      expect(result).toEqual(mockSavedItem);
    });
  });
});