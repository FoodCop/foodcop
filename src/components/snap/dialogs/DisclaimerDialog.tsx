import { Camera } from 'lucide-react';
import { Button } from '../../ui/button';

interface DisclaimerDialogProps {
  readonly onContinue: () => void;
  readonly onClose: () => void;
}

export function DisclaimerDialog({ onContinue, onClose }: DisclaimerDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <Camera className="w-12 h-12 mx-auto mb-3 text-[#FFC909]" />
          <h2 className="font-[Poppins] font-bold text-xl text-gray-900 mb-2">Welcome to SNAP!</h2>
          <p className="text-gray-600 text-sm">Share your food discoveries</p>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm">
          <p className="text-gray-700">This is a family-friendly site focused solely on food photography.</p>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="font-semibold text-green-900 mb-2">✅ Please post:</p>
            <ul className="space-y-1 ml-4 text-green-800">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Food photos</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Restaurant frontages</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Meal presentations</span>
              </li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-semibold text-red-900 mb-2">❌ Please avoid:</p>
            <ul className="space-y-1 ml-4 text-red-800">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Selfies or people photos</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Inappropriate content</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={onContinue}
            className="w-full bg-linear-to-r from-[#FFC909] to-[#E6B508] text-white"
          >
            Continue to Camera
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
