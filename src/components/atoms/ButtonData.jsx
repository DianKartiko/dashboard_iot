import React from "react";
import { Download } from "lucide-react"; // Contoh impor ikon

const ButtonData = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  icon: Icon,
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    outline:
      "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {/* Merender ikon jika ada */}
      {Icon && (
        <Icon className={`mr-2 h-5 w-5 ${size === "sm" ? "h-4 w-4" : ""}`} />
      )}
      {/* Merender konten (anak-anak) */}
      {children}
    </button>
  );
};

export default ButtonData;
