import Link from "next/link";
import React from "react";

export function Button({
  children,
  variant = 'primary',
  href,
  className = '',
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-jakarta font-medium transition-all duration-300 pointer-events-auto";

  const variants = {
    primary: "bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] text-white rounded-full shadow-lp-glow hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(79,70,229,0.4)] px-6 py-3 text-[14px] font-semibold",
    secondary: "bg-white/5 border border-lp-border text-white rounded-full hover:bg-white/10 px-8 py-3 h-[56px] text-[14px]",
    ghost: "text-lp-text-secondary hover:text-white px-4 py-2 text-[16px]",
    outline: "bg-transparent border border-lp-border text-white rounded-full hover:bg-white hover:text-lp-accent-blue px-6 py-3 text-[14px] font-semibold"
  };

  const classes = `${baseStyles} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
