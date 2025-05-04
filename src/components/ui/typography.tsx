
import React from "react";
import { cn } from "@/lib/utils";

type TypographyProps = {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "blockquote" | "lead" | "large" | "small" | "muted";
  children: React.ReactNode;
  className?: string;
};

export function Typography({
  variant = "p",
  className,
  children,
  ...props
}: TypographyProps & React.HTMLAttributes<HTMLElement>) {
  const Tag = getElementType(variant);
  
  return (
    <Tag 
      className={cn(getVariantClasses(variant), className)} 
      {...props}
    >
      {children}
    </Tag>
  );
}

// Helper function to determine the HTML element based on variant
function getElementType(variant: TypographyProps["variant"]) {
  switch (variant) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return variant;
    case "blockquote":
      return "blockquote";
    default:
      return "p";
  }
}

// Helper function to get Tailwind classes based on variant
function getVariantClasses(variant: TypographyProps["variant"]) {
  switch (variant) {
    case "h1":
      return "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl";
    case "h2":
      return "scroll-m-20 text-3xl font-semibold tracking-tight";
    case "h3":
      return "scroll-m-20 text-2xl font-semibold tracking-tight";
    case "h4":
      return "scroll-m-20 text-xl font-semibold tracking-tight";
    case "h5":
      return "scroll-m-20 text-lg font-semibold tracking-tight";
    case "h6":
      return "scroll-m-20 text-base font-semibold tracking-tight";
    case "p":
      return "leading-7";
    case "blockquote":
      return "mt-6 border-l-2 pl-6 italic";
    case "lead":
      return "text-xl text-muted-foreground";
    case "large":
      return "text-lg font-semibold";
    case "small":
      return "text-sm font-medium leading-none";
    case "muted":
      return "text-sm text-muted-foreground";
    default:
      return "";
  }
}

export default Typography;
