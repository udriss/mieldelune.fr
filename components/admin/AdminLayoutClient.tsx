'use client';

import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@/app/admin/admin.css';
import { AdminStyleOverrides } from './AdminStyleOverrides';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  fontClass: string;
}

export function AdminLayoutClient({ children, fontClass }: AdminLayoutClientProps) {
  // Override any site-wide font settings specifically for admin pages
  useEffect(() => {
    // Save previous font settings
    const prevFontFamily = document.body.style.fontFamily;
    const prevFontSize = document.body.style.fontSize;
    
    // Apply admin-specific font settings
    document.body.style.fontFamily = `'Roboto', sans-serif`;
    document.body.style.fontSize = '1rem';
    
    // Add Roboto class to all elements with font-roboto class
    document.querySelectorAll('.font-roboto').forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.fontFamily = `'Roboto', sans-serif`;
      }
    });
    
    // Cleanup when component unmounts
    return () => {
      document.body.style.fontFamily = prevFontFamily;
      document.body.style.fontSize = prevFontSize;
    };
  }, []);

  return (
    <section className={`${fontClass} admin-content pt-6 m-0 min-h-screen granular-gradient pt-8 flex flex-col items-center justify-start w-full`}>
      <AdminStyleOverrides />
      {children}
      <ToastContainer 
        position="top-center" 
        autoClose={2000} 
        hideProgressBar 
        newestOnTop 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="dark"
        style={{ fontSize: 16 }}
      />
    </section>
  );
}
