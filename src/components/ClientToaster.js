"use client";

import { useEffect, useState } from "react";
import { Toaster, ToastBar } from "react-hot-toast";
import { usePathname } from "next/navigation";

export default function ClientToaster() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 5000,
        className: 'premium-toast',
        style: {
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          color: '#0f172a',
          borderRadius: '1.25rem',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          padding: '16px 20px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: '11px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        },
        error: {
          style: {
            background: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid rgba(254, 205, 211, 1)',
            color: '#e11d48',
          },
          iconTheme: {
            primary: '#e11d48',
            secondary: '#fff',
          },
        },
        success: {
          style: {
            background: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid rgba(167, 243, 208, 1)',
            color: '#059669',
          },
          iconTheme: {
            primary: '#059669',
            secondary: '#fff',
          },
        }
      }}
    />
  );
}
