import React from "react";
import { cn } from "../ui/utils";

interface FuzoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function FuzoInput({
  label,
  error,
  icon,
  className,
  ...props
}: FuzoInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-[#0B1F3A]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{icon}</div>
          </div>
        )}
        <input
          className={cn(
            "block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-[#0B1F3A] placeholder-gray-400 transition-all duration-200",
            "focus:border-[#F14C35] focus:ring-2 focus:ring-[#F14C35]/20 focus:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            icon && "pl-10",
            error &&
              "border-red-300 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
