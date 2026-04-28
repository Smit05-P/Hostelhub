import { useState, memo } from "react";
import { User } from "lucide-react";

/**
 * Shared Avatar component for displaying student profile images
 * with fallback to name initials and error handling.
 */
const Avatar = memo(({ src, name, size = 12, className = "" }) => {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  // Handle various size formats
  const sizeClass = typeof size === 'number' ? `w-${size} h-${size}` : size;

  return (
    <div 
      className={`${sizeClass} rounded-[1.2rem] overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-inner transition-all duration-500 ${className}`}
    >
      {src && !imgError ? (
        <img 
          src={src} 
          alt={name || "Avatar"} 
          className="w-full h-full object-cover" 
          onError={() => setImgError(true)} 
        />
      ) : (
        <span className="text-lg font-black text-slate-400 italic uppercase leading-none">
          {initial === "?" ? <User size={20} strokeWidth={2.5} /> : initial}
        </span>
      )}
    </div>
  );
});

Avatar.displayName = "Avatar";

export default Avatar;
