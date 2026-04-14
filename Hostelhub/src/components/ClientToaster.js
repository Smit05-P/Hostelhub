"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export default function ClientToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 5000,
        className: 'platinum-toast',
        style: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          color: '#0f172a',
          borderRadius: '24px',
          border: '1px solid rgba(241, 245, 249, 1)',
          padding: '16px 24px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontStyle: 'italic',
          fontSize: '10px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        },
      }}
    />
  );
}
