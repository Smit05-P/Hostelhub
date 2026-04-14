import React from "react";
import { Badge } from "./Badge";

export function SectionLabel({ text, className = "" }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <Badge variant="solid" className="bg-[#4F46E5] text-white">
        {text}
      </Badge>
    </div>
  );
}
