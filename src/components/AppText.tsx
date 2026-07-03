import React from "react";
import { cn } from "../utils/cn";
import { StyleProp, Text, TextStyle } from "react-native";

interface TextProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "heading";
  color?: "default" | "primary" | "secondary" | "success" | "danger";
  center?: boolean;
  className?: string;
  weight?: "400" | "500" | "600" | "700";
  bold?: boolean;
  uppercase?: boolean;
  tracking?: "tight" | "wide" | "wider" | "widest";
  numberOfLines?: number;
}

export default function AppText({
  children,
  size = "md",
  color = "default",
  center,
  weight = "400",
  bold,
  uppercase,
  tracking,
  numberOfLines,
  className,
  style,
}: TextProps) {
  const activeWeight = bold ? "700" : weight;

  return (
    <Text
      numberOfLines={numberOfLines}
      ellipsizeMode="tail"
      className={cn(
        size === "xs" && "text-xs",
        size === "sm" && "text-[13px]",
        size === "md" && "text-base",
        size === "lg" && "text-lg",
        size === "xl" && "text-[26px]",
        size === "heading" && "text-3xl",
        color === "default" && "text-gray-900 dark:text-gray-100",
        color === "primary" && "text-sky-600 dark:text-sky-400",
        color === "secondary" && "text-gray-500 dark:text-gray-400",
        color === "success" && "text-emerald-600 dark:text-emerald-400",
        color === "danger" && "text-red-500 dark:text-red-400",
        tracking === "tight" && "tracking-tight",
        tracking === "wide" && "tracking-wide",
        tracking === "wider" && "tracking-wider",
        tracking === "widest" && "tracking-widest",
        center && "text-center",
        uppercase && "uppercase",
        "pb-0.5",
        className,
      )}
      style={[
        {
          fontFamily: `Inter-${activeWeight}`,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
