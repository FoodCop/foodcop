import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useYesNoDialog } from '../../hooks/useYesNoDialog';
import { 
  Heart, 
  Share2, 
  Bookmark, 
  Download,
  Trash2,
  Edit,
  Plus,
  Check,
  X,
  AlertCircle,
  Info,
  Settings
} from 'lucide-react';

/**
 * UI Components Library - All buttons, toasts, dialogs with labels
 */
export function ComponentsShowcase() {
  const { showConfirm, ConfirmDialog } = useConfirmDialog();
  const { showYesNo, YesNoDialog } = useYesNoDialog();

  // Toast handlers
  const handleSuccessToast = () => {
    toast.success('Success!', {
      description: 'Your action completed successfully',
    });
  };

  const handleSuccessWithAction = () => {
    toast.success('Item saved to Plate', {
      description: 'Recipe added successfully',
      action: {
        label: 'View',
        onClick: () => console.log('View clicked')
      }
    });
  };

  const handleErrorToast = () => {
    toast.error('Error!', {
      description: 'Something went wrong. Please try again.',
    });
  };

  const handleInfoToast = () => {
    toast.info('Already saved', {
      description: 'This item is already in your collection',
    });
  };

  const handleWarningToast = () => {
    toast.warning('Warning', {
      description: 'This action cannot be undone',
    });
  };

  const handleLoadingToast = () => {
    toast.loading('Loading...', {
      description: 'Please wait while we process your request',
    });
  };

  // Dialog handlers
  const handleDestructiveDialog = async () => {
    const confirmed = await showConfirm({
      title: "Delete Item?",
      description: "Are you sure you want to delete this item? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
      icon: "warning"
    });
    if (confirmed) {
      toast.success('Item deleted');
    }
  };

  const handleWarningDialog = async () => {
    const confirmed = await showConfirm({
      title: "Confirm Action",
      description: "Are you sure you want to proceed with this action?",
      confirmText: "Proceed",
      cancelText: "Cancel",
      variant: "warning",
      icon: "warning"
    });
    if (confirmed) {
      toast.success('Action confirmed');
    }
  };

  const handleDefaultDialog = async () => {
    const confirmed = await showConfirm({
      title: "Save Changes?",
      description: "Do you want to save your changes before leaving?",
      confirmText: "Save",
      cancelText: "Cancel",
      variant: "default",
      icon: "info"
    });
    if (confirmed) {
      toast.success('Changes saved');
    }
  };

  const handleYesNoDialog = async () => {
    const result = await showYesNo({
      title: "Enable Notifications?",
      description: "Would you like to receive notifications about new content?",
      yesText: "Yes, Enable",
      noText: "No Thanks"
    });
    if (result) {
      toast.success('Notifications enabled');
    } else {
      toast.info('Notifications disabled');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.location.hash = '#/showcase'}
            className="mb-4"
          >
            ← Back to Showcase Hub
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎨 UI Components Library
          </h1>
          <p className="text-gray-600">
            All buttons, toasts, dialogs, and interactive elements with clear labels
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white p-4 rounded-lg border mb-8">
          <h3 className="font-semibold mb-3">Quick Navigation:</h3>
          <div className="flex flex-wrap gap-2">
            <a href="#buttons" className="text-blue-600 hover:underline">Buttons</a>
            <span>•</span>
            <a href="#toasts" className="text-blue-600 hover:underline">Toasts</a>
            <span>•</span>
            <a href="#dialogs" className="text-blue-600 hover:underline">Dialogs</a>
            <span>•</span>
            <a href="#icons" className="text-blue-600 hover:underline">Icons</a>
          </div>
        </div>

        {/* SECTION 1: BUTTONS */}
        <section id="buttons" className="mb-12">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-2xl font-bold mb-6 pb-3 border-b">
              1️⃣ Button Variants
            </h2>

            {/* Default Buttons */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Default Variant (Primary Actions)
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="text-center">
                  <Button variant="default">
                    Default Button
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">variant="default"</p>
                </div>
                <div className="text-center">
                  <Button variant="default" size="sm">
                    Small Button
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">size="sm"</p>
                </div>
                <div className="text-center">
                  <Button variant="default" size="lg">
                    Large Button
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">size="lg"</p>
                </div>
                <div className="text-center">
                  <Button variant="default" disabled>
                    Disabled
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">disabled</p>
                </div>
              </div>
            </div>

            {/* Destructive Buttons */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Destructive Variant (Delete/Remove Actions)
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="text-center">
                  <Button variant="destructive">
                    Delete
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">variant="destructive"</p>
                </div>
                <div className="text-center">
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">with icon</p>
                </div>
                <div className="text-center">
                  <Button variant="destructive" disabled>
                    Delete
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">disabled</p>
                </div>
              </div>
            </div>

            {/* Outline Buttons */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Outline Variant (Secondary Actions)
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="text-center">
                  <Button variant="outline">
                    Cancel
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">variant="outline"</p>
                </div>
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">with icon</p>
                </div>
                <div className="text-center">
                  <Button variant="outline" disabled>
                    Cancel
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">disabled</p>
                </div>
              </div>
            </div>

            {/* Secondary Buttons */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Secondary Variant
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="text-center">
                  <Button variant="secondary">
                    Secondary
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">variant="secondary"</p>
                </div>
                <div className="text-center">
                  <Button variant="secondary" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">with icon</p>
                </div>
              </div>
            </div>

            {/* Ghost Buttons */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Ghost Variant (Minimal Style)
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="text-center">
                  <Button variant="ghost">
                    Ghost Button
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">variant="ghost"</p>
                </div>
                <div className="text-center">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">with icon</p>
                </div>
              </div>
            </div>

            {/* Link Buttons */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Link Variant
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="text-center">
                  <Button variant="link">
                    Learn More
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">variant="link"</p>
                </div>
              </div>
            </div>

            {/* Icon Buttons */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Icon Buttons (size="icon")
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="text-center">
                  <Button size="icon" variant="default">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">Like</p>
                </div>
                <div className="text-center">
                  <Button size="icon" variant="outline">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">Save</p>
                </div>
                <div className="text-center">
                  <Button size="icon" variant="secondary">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">Share</p>
                </div>
                <div className="text-center">
                  <Button size="icon" variant="destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">Delete</p>
                </div>
                <div className="text-center">
                  <Button size="icon" variant="ghost">
                    <X className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">Close</p>
                </div>
              </div>
            </div>

            {/* Buttons with Icons */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Buttons with Icons (Various Combinations)
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="default">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
                <Button variant="default">
                  <Check className="w-4 h-4 mr-2" />
                  Confirm
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="secondary">
                  <Info className="w-4 h-4 mr-2" />
                  More Info
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: TOASTS */}
        <section id="toasts" className="mb-12">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-2xl font-bold mb-6 pb-3 border-b">
              2️⃣ Toast Notifications
            </h2>
            <p className="text-gray-600 mb-6">
              Click the buttons below to trigger different toast notifications
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 text-green-600">Success Toast</h4>
                <Button 
                  onClick={handleSuccessToast}
                  variant="outline"
                  className="w-full mb-2"
                >
                  Show Success
                </Button>
                <code className="text-xs text-gray-600 block">
                  toast.success(...)
                </code>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 text-green-600">Success + Action</h4>
                <Button 
                  onClick={handleSuccessWithAction}
                  variant="outline"
                  className="w-full mb-2"
                >
                  Show with Action
                </Button>
                <code className="text-xs text-gray-600 block">
                  toast.success(..., action)
                </code>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 text-red-600">Error Toast</h4>
                <Button 
                  onClick={handleErrorToast}
                  variant="outline"
                  className="w-full mb-2"
                >
                  Show Error
                </Button>
                <code className="text-xs text-gray-600 block">
                  toast.error(...)
                </code>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 text-blue-600">Info Toast</h4>
                <Button 
                  onClick={handleInfoToast}
                  variant="outline"
                  className="w-full mb-2"
                >
                  Show Info
                </Button>
                <code className="text-xs text-gray-600 block">
                  toast.info(...)
                </code>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 text-orange-600">Warning Toast</h4>
                <Button 
                  onClick={handleWarningToast}
                  variant="outline"
                  className="w-full mb-2"
                >
                  Show Warning
                </Button>
                <code className="text-xs text-gray-600 block">
                  toast.warning(...)
                </code>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-600">Loading Toast</h4>
                <Button 
                  onClick={handleLoadingToast}
                  variant="outline"
                  className="w-full mb-2"
                >
                  Show Loading
                </Button>
                <code className="text-xs text-gray-600 block">
                  toast.loading(...)
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: DIALOGS */}
        <section id="dialogs" className="mb-12">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-2xl font-bold mb-6 pb-3 border-b">
              3️⃣ Confirmation Dialogs
            </h2>
            <p className="text-gray-600 mb-6">
              Click the buttons below to open different dialog types
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg border-red-200 bg-red-50">
                <h4 className="font-semibold mb-3 text-red-700">Destructive Dialog</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Use for delete/remove actions
                </p>
                <Button 
                  onClick={handleDestructiveDialog}
                  variant="destructive"
                  className="w-full"
                >
                  Open Destructive Dialog
                </Button>
                <code className="text-xs text-gray-600 block mt-3">
                  variant: "destructive"
                </code>
              </div>

              <div className="p-4 border rounded-lg border-orange-200 bg-orange-50">
                <h4 className="font-semibold mb-3 text-orange-700">Warning Dialog</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Use for important confirmations
                </p>
                <Button 
                  onClick={handleWarningDialog}
                  variant="outline"
                  className="w-full"
                >
                  Open Warning Dialog
                </Button>
                <code className="text-xs text-gray-600 block mt-3">
                  variant: "warning"
                </code>
              </div>

              <div className="p-4 border rounded-lg border-blue-200 bg-blue-50">
                <h4 className="font-semibold mb-3 text-blue-700">Default Dialog</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Use for general confirmations
                </p>
                <Button 
                  onClick={handleDefaultDialog}
                  variant="outline"
                  className="w-full"
                >
                  Open Default Dialog
                </Button>
                <code className="text-xs text-gray-600 block mt-3">
                  variant: "default"
                </code>
              </div>

              <div className="p-4 border rounded-lg border-purple-200 bg-purple-50">
                <h4 className="font-semibold mb-3 text-purple-700">Yes/No Dialog</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Simple yes/no questions
                </p>
                <Button 
                  onClick={handleYesNoDialog}
                  variant="outline"
                  className="w-full"
                >
                  Open Yes/No Dialog
                </Button>
                <code className="text-xs text-gray-600 block mt-3">
                  useYesNoDialog()
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: COMMON ICONS */}
        <section id="icons" className="mb-12">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-2xl font-bold mb-6 pb-3 border-b">
              4️⃣ Common Icons (Lucide React)
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { icon: Heart, name: 'Heart' },
                { icon: Share2, name: 'Share2' },
                { icon: Bookmark, name: 'Bookmark' },
                { icon: Trash2, name: 'Trash2' },
                { icon: Edit, name: 'Edit' },
                { icon: Plus, name: 'Plus' },
                { icon: Check, name: 'Check' },
                { icon: X, name: 'X' },
                { icon: AlertCircle, name: 'AlertCircle' },
                { icon: Info, name: 'Info' },
                { icon: Download, name: 'Download' },
                { icon: Settings, name: 'Settings' },
              ].map(({ icon: Icon, name }) => (
                <div key={name} className="text-center p-3 border rounded hover:bg-gray-50">
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">{name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Back Button */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => window.location.hash = '#/showcase'}
          >
            ← Back to Showcase Hub
          </Button>
        </div>
      </div>

      {/* Dialog Components */}
      <ConfirmDialog />
      <YesNoDialog />
    </div>
  );
}
