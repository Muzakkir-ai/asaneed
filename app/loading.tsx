'use client';
import { useLanguage } from './language-provider';
export default function Loading() { const {t}=useLanguage(); return <p role="status">{t.loading}</p>; }
