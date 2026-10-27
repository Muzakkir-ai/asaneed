import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'منصة الأسانيد والإجازات', description: 'إدارة الأسانيد والإجازات والتحقق منها' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body><main>{children}</main></body></html>;
}
