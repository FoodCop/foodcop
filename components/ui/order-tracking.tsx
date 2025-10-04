"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft } from "lucide-react";

interface OrderStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  estimatedTime?: string;
}

interface OrderTrackingProps {
  orderId: string;
  orderDate: string;
  steps: OrderStep[];
  onBack?: () => void;
  onChatSupport?: () => void;
  className?: string;
}

export function OrderTracking({
  orderId,
  orderDate,
  steps,
  onBack,
  onChatSupport,
  className
}: OrderTrackingProps) {
  return (
    <div className={`min-h-screen bg-[#f6f9f9] relative ${className || ""}`}>
      {/* Status Bar Placeholder */}
      <div className="h-11 bg-white"></div>
      
      {/* Navigation Header */}
      <div className="relative h-[42px] flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="absolute left-5 p-0 h-auto"
        >
          <ChevronLeft className="h-4 w-4 text-[#0c1d2e]" />
        </Button>
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-[#0c1d2e] text-base font-normal">
          Track your order
        </h1>
      </div>

      {/* Order Information Card */}
      <div className="mx-5 mt-[10px] mb-4 bg-white rounded-[10px] border-2 border-[#ff9500] p-5">
        <div className="flex justify-between items-baseline mb-[15px]">
          <span className="text-[#748ba0] text-sm font-normal">Your order:</span>
          <span className="text-[#ff9500] text-sm font-medium capitalize">{orderId}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[#748ba0] text-sm font-normal">Date:</span>
          <span className="text-[#ff9500] text-sm font-medium">{orderDate}</span>
        </div>
      </div>

      {/* Order Progress Steps */}
      <div className="mx-5 mb-6 bg-white rounded-[10px] p-[30px]">
        <div className="space-y-[43px]">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              <div className="flex items-start">
                {/* Step Icon */}
                <div className="flex-shrink-0 mr-[24px] relative">
                  {step.completed ? (
                    <div className="w-[30px] h-[30px] bg-[#ff9500] rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-[30px] h-[30px] border-2 border-[#748ba0] rounded-full bg-white" />
                  )}
                  
                  {/* Connecting Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-[15px] top-[30px] w-px h-[43px] bg-[#ff9500]" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-[5px]">
                  <h3 className="text-[#0c1d2e] text-sm font-medium capitalize leading-[1.2] mb-[5px]">
                    {step.title}
                  </h3>
                  <p className="text-[#748ba0] text-sm font-normal leading-[1.5]">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Support Button */}
      <div className="mx-5 mb-8">
        <Button 
          className="w-full bg-[#ff9500] hover:bg-[#ff9500]/90 text-white py-[13px] rounded-[10px] font-bold text-sm capitalize border border-[#dbe9f5]"
          onClick={onChatSupport}
        >
          Chat support
        </Button>
      </div>

      {/* Home Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-[34px] flex items-end justify-center pb-2">
        <div className="w-[134px] h-[5px] bg-[#0c1d2e] rounded-full"></div>
      </div>
    </div>
  );
}

// Default export for easy importing
export default OrderTracking;