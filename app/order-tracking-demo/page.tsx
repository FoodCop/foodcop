"use client";

import OrderTracking from "@/components/ui/order-tracking";

const mockOrderSteps = [
  {
    id: "confirmed",
    title: "Order confirmed",
    description: "Your order has been confirmed",
    completed: true,
  },
  {
    id: "cooking",
    title: "Order is being cooked", 
    description: "Estimated for 9:12 pm",
    completed: true,
    estimatedTime: "Estimated for 9:12 pm"
  },
  {
    id: "delivering",
    title: "Courier delivering",
    description: "Estimated for 9:12 pm", 
    completed: false,
    estimatedTime: "Estimated for 9:12 pm"
  },
  {
    id: "receiving",
    title: "Receiving",
    description: "Estimated for 9:32 pm",
    completed: false,
    estimatedTime: "Estimated for 9:32 pm"
  }
];

export default function OrderTrackingDemo() {
  const handleBack = () => {
    console.log("Back button clicked");
  };

  const handleChatSupport = () => {
    console.log("Chat support clicked");
  };

  return (
    <div className="container mx-auto max-w-md">
      <OrderTracking
        orderId="456654"
        orderDate="Aug 31 at 8:32 pm"
        steps={mockOrderSteps}
        onBack={handleBack}
        onChatSupport={handleChatSupport}
      />
    </div>
  );
}