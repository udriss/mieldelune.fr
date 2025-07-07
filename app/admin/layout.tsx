import '../globals.css';
import './admin.css';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';

const roboto = Roboto({ 
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MielDeLune | Administration',
  description: 'Panneau d\'administration',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutClient fontClass={roboto.className}>
      {children}
    </AdminLayoutClient>
  );
}

