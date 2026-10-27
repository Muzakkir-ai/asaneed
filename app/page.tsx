import Link from 'next/link';
export default function Home() {
  return <><p className="eyebrow">منصة الأسانيد والإجازات</p><h1>حفظ الأسانيد وتوثيق الإجازات</h1><section className="panel"><h2>التحقق من الإجازة</h2><p>ستتوفر خدمة التحقق هنا بعد اكتمال نقل الإجازات ومراجعتها.</p></section><Link href="/login">دخول المشرفين والمشايخ</Link></>;
}
