'use client';
import QurraTransmissionWorkspace from '../../app/studio/qurra-diagrams/client';
import '../../app/studio/studio.css';

/** Non-authenticated local visual test fixture. Screenshot examples use
 * synthetic narrator IDs and never call the real Supabase database.
 */
export default function QurraVisualPreview(){
 return <div className="zite-app min-h-screen bg-background text-foreground">
  <div dir="rtl" data-testid="visual-preview-label" className="border-b bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950">
   معاينة تجريبية محلية — الأسماء والروابط في هذا الاختبار أمثلة، وليست بيانات المستخدم الحقيقية
  </div>
  <QurraTransmissionWorkspace/>
 </div>;
}
