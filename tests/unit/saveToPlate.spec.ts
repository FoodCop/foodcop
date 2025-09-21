import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SaveToPlate } from "../../components/save/SaveToPlate";
import { useAuth } from "../../contexts/AuthContext";
import { savedItemsService } from "../../components/services/savedItemsService";

// Mock dependencies
vi.mock("../../contexts/AuthContext");
vi.mock("../../components/services/savedItemsService");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUseAuth = vi.mocked(useAuth);
const mockSavedItemsService = vi.mocked(savedItemsService);

describe("SaveToPlate", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
  };

  const defaultProps = {
    itemId: "restaurant-123",
    itemType: "restaurant" as const,
    title: "Test Restaurant",
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signUpWithEmail: vi.fn(),
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
    });

    mockSavedItemsService.saveItem.mockResolvedValue({
      success: true,
      message: "Saved to your Plate",
      savedItem: {
        id: "saved-123",
        user_id: "user-123",
        item_type: "restaurant",
        item_id: "restaurant-123",
        metadata: {},
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders save button with correct text", () => {
      render(<SaveToPlate {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /save to plate/i })
      ).toBeInTheDocument();
    });

    it("renders as icon variant", () => {
      render(<SaveToPlate {...defaultProps} variant="icon" />);

      const button = screen.getByRole("button", { name: /save to plate/i });
      expect(button).toBeInTheDocument();
      expect(button.querySelector("svg")).toBeInTheDocument(); // Bookmark icon
    });

    it("shows saved state when defaultSaved is true", () => {
      render(<SaveToPlate {...defaultProps} defaultSaved={true} />);

      expect(
        screen.getByRole("button", { name: /saved to plate/i })
      ).toBeInTheDocument();
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("opens confirmation dialog on click", async () => {
      const user = userEvent.setup();
      render(<SaveToPlate {...defaultProps} />);

      const saveButton = screen.getByRole("button", { name: /save to plate/i });
      await user.click(saveButton);

      expect(screen.getByText("Save to Plate?")).toBeInTheDocument();
      expect(
        screen.getByText('Save "Test Restaurant" to your Plate?')
      ).toBeInTheDocument();
    });

    it("shows item type when no title provided", async () => {
      const user = userEvent.setup();
      render(<SaveToPlate itemId="recipe-123" itemType="recipe" />);

      const saveButton = screen.getByRole("button", { name: /save to plate/i });
      await user.click(saveButton);

      expect(
        screen.getByText("Save this recipe to your Plate?")
      ).toBeInTheDocument();
    });

    it("closes dialog on cancel", async () => {
      const user = userEvent.setup();
      render(<SaveToPlate {...defaultProps} />);

      const saveButton = screen.getByRole("button", { name: /save to plate/i });
      await user.click(saveButton);

      expect(screen.getByText("Save to Plate?")).toBeInTheDocument();

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("Save to Plate?")).not.toBeInTheDocument();
      });
    });

    it("saves item on confirm", async () => {
      const user = userEvent.setup();
      const onSaved = vi.fn();
      render(<SaveToPlate {...defaultProps} onSaved={onSaved} />);

      const saveButton = screen.getByRole("button", { name: /save to plate/i });
      await user.click(saveButton);

      const confirmButton = screen.getByRole("button", { name: /save/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockSavedItemsService.saveItem).toHaveBeenCalledWith({
          itemId: "restaurant-123",
          itemType: "restaurant",
          metadata: {
            title: "Test Restaurant",
            image_url: undefined,
          },
        });
      });

      expect(onSaved).toHaveBeenCalled();
    });

    it("handles save failure gracefully", async () => {
      const user = userEvent.setup();
      mockSavedItemsService.saveItem.mockResolvedValue({
        success: false,
        message: "Save failed",
      });

      render(<SaveToPlate {...defaultProps} />);

      const saveButton = screen.getByRole("button", { name: /save to plate/i });
      await user.click(saveButton);

      const confirmButton = screen.getByRole("button", { name: /save/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockSavedItemsService.saveItem).toHaveBeenCalled();
      });

      // Should not call onSaved on failure
      expect(
        screen.queryByRole("button", { name: /saved to plate/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Authentication", () => {
    it("shows error when user is not authenticated", async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        signInWithGoogle: vi.fn(),
        signUpWithEmail: vi.fn(),
        signInWithEmail: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn(),
      });

      render(<SaveToPlate {...defaultProps} />);

      const saveButton = screen.getByRole("button", { name: /save to plate/i });
      await user.click(saveButton);

      // Should not open dialog, should show error toast instead
      expect(screen.queryByText("Save to Plate?")).not.toBeInTheDocument();
      expect(mockSavedItemsService.saveItem).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      render(<SaveToPlate {...defaultProps} />);

      const button = screen.getByRole("button", { name: /save to plate/i });
      expect(button).toHaveAttribute("aria-label", "Save to Plate");
    });

    it("has proper ARIA labels when saved", () => {
      render(<SaveToPlate {...defaultProps} defaultSaved={true} />);

      const button = screen.getByRole("button", { name: /saved to plate/i });
      expect(button).toHaveAttribute("aria-label", "Saved to Plate");
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<SaveToPlate {...defaultProps} />);

      const saveButton = screen.getByRole("button", { name: /save to plate/i });

      // Tab to button
      await user.tab();
      expect(saveButton).toHaveFocus();

      // Enter to open dialog
      await user.keyboard("{Enter}");
      expect(screen.getByText("Save to Plate?")).toBeInTheDocument();

      // Tab to cancel button
      await user.tab();
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toHaveFocus();

      // Enter to cancel
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.queryByText("Save to Plate?")).not.toBeInTheDocument();
      });
    });

    it("supports escape key to close dialog", async () => {
      const user = userEvent.setup();
      render(<SaveToPlate {...defaultProps} />);

      const saveButton = screen.getByRole("button", { name: /save to plate/i });
      await user.click(saveButton);

      expect(screen.getByText("Save to Plate?")).toBeInTheDocument();

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByText("Save to Plate?")).not.toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("shows loading state during save", async () => {
      const user = userEvent.setup();
      // Make save take some time
      mockSavedItemsService.saveItem.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  message: "Saved to your Plate",
                  savedItem: {} as any,
                }),
              100
            )
          )
      );

      render(<SaveToPlate {...defaultProps} />);

      const saveButton = screen.getByRole("button", { name: /save to plate/i });
      await user.click(saveButton);

      const confirmButton = screen.getByRole("button", { name: /save/i });
      await user.click(confirmButton);

      // Should show loading state
      expect(screen.getByText("Saving...")).toBeInTheDocument();
      expect(confirmButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
      });
    });

    it("disables button during loading", async () => {
      const user = userEvent.setup();
      mockSavedItemsService.saveItem.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  message: "Saved to your Plate",
                  savedItem: {} as any,
                }),
              100
            )
          )
      );

      render(<SaveToPlate {...defaultProps} />);

      const saveButton = screen.getByRole("button", { name: /save to plate/i });
      await user.click(saveButton);

      const confirmButton = screen.getByRole("button", { name: /save/i });
      await user.click(confirmButton);

      // Should be disabled during loading
      expect(confirmButton).toBeDisabled();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    });
  });

  describe("Different Item Types", () => {
    it("handles restaurant type", async () => {
      const user = userEvent.setup();
      render(
        <SaveToPlate
          itemId="rest-123"
          itemType="restaurant"
          title="Pizza Place"
        />
      );

      const saveButton = screen.getByRole("button", { name: /save to plate/i });
      await user.click(saveButton);

      expect(
        screen.getByText('Save "Pizza Place" to your Plate?')
      ).toBeInTheDocument();
    });

    it("handles recipe type", async () => {
      const user = userEvent.setup();
      render(
        <SaveToPlate
          itemId="recipe-123"
          itemType="recipe"
          title="Chocolate Cake"
        />
      );

      const saveButton = screen.getByRole("button", { name: /save to plate/i });
      await user.click(saveButton);

      expect(
        screen.getByText('Save "Chocolate Cake" to your Plate?')
      ).toBeInTheDocument();
    });

    it("handles photo type", async () => {
      const user = userEvent.setup();
      render(
        <SaveToPlate
          itemId="photo-123"
          itemType="photo"
          title="Beautiful Sunset"
        />
      );

      const saveButton = screen.getByRole("button", { name: /save to plate/i });
      await user.click(saveButton);

      expect(
        screen.getByText('Save "Beautiful Sunset" to your Plate?')
      ).toBeInTheDocument();
    });
  });
});
