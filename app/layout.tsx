import type { Metadata } from 'next';
import '@fontsource-variable/readex-pro';
import './globals.css';
export const metadata: Metadata = { title: 'التحقق من الإجازة | الأسانيد', description: 'تحقق من الإجازة المعتمدة بإدخال رقمها في سجل الأسانيد والإجازات.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body><main>{children}</main></body></html>;
}
