import { useRef, useState } from 'react';
import { adminBackup, AdminBackupInputType, AdminBackupOutputType } from '../lib/api';
import { Button } from '@project/components/ui/button';
import { Checkbox } from '@project/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@project/components/ui/radio-group';
import { Label } from '@project/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import { Download, Upload, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

type Backup = NonNullable<AdminBackupInputType['backup']>;
type Stats = NonNullable<AdminBackupOutputType['stats']>;
type AccStats = NonNullable<AdminBackupOutputType['accountStats']>;

const LABELS: Record<string, string> = {
  qiraat: 'القراءات', asaneed: 'الأسانيد', certificates: 'الشهادات', sanadSections: 'أقسام الأسانيد', ijazahHoldings: 'إجازات المشايخ',
  sanadPrintStyles: 'تنسيقات الطباعة', preparedIjazahs: 'الإجازات المعدّة', certificateSnapshots: 'نسخ الشهادات المنشورة',
  sanadSectionVersions: 'سجل تعديلات الأقسام', shaykhPrintProfiles: 'بيانات تذييل المشايخ', riwayahPrintColors: 'ألوان الروايات',
  students: 'الطلاب', additionalShaykhs: 'المشايخ الإضافيون',
  assetSources:'مصدر الخطوط والزخارف',appAdmins:'المديرون',appUsers:'المستخدمون والصلاحيات',legacyUserDirectory:'دليل الحسابات السابقة',
  mutoonHoldings:'إجازات المتون',mutoonTextTemplates:'نماذج المتون',additionalShaykhExtensions:'بيانات المشايخ الإضافية',
  additionalShaykhReadingSanads:'أسانيد روايات المشايخ الإضافيين',certificateIssuers:'رموز المُجيزين',certificateRegistrations:'سجل أرقام الشهادات',
};

export default function DataBackupPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [backup, setBackup] = useState<Backup | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [accStats, setAccStats] = useState<AccStats | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [mode, setMode] = useState<'addMissing' | 'restore'>('addMissing');
  const [confirmed, setConfirmed] = useState(false);
  const [dialog, setDialog] = useState(false);

  const doExport = async () => {
    setBusy('export');
    try {
      const { backup: b } = await adminBackup({ action: 'export' });
      const blob = new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `asaneed-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast.success('تم تصدير النسخة الاحتياطية');
    } catch { toast.error('تعذّر التصدير'); } finally { setBusy(null); }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy('preview'); setStats(null); setConfirmed(false);
    try {
      const parsed = JSON.parse(await f.text()) as Backup;
      const res = await adminBackup({ action: 'preview', backup: parsed });
      setBackup(parsed); setStats(res.stats ?? []); setWarnings(res.warnings ?? []); setAccStats(res.accountStats ?? null);
    } catch (err) {
      setBackup(null);
      toast.error(err instanceof SyntaxError ? 'الملف ليس JSON صالحاً' : (err as Error).message || 'تعذّرت قراءة الملف');
    } finally { setBusy(null); }
  };

  const doRestore = async () => {
    if (!backup) return;
    setDialog(false); setBusy('restore');
    try {
      const { result } = await adminBackup({ action: 'restore', backup, mode, confirmOverwrite: mode === 'restore' && confirmed });
      toast.success(`تمت الاستعادة: أُضيف ${result?.created ?? 0}، حُدّث ${result?.updated ?? 0}، حُذف ${result?.deleted ?? 0}، حسابات محدّثة ${result?.accountsUpdated ?? 0}`);
      setBackup(null); setStats(null);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) { toast.error((err as Error).message || 'تعذّرت الاستعادة'); } finally { setBusy(null); }
  };

  const total = (k: keyof Stats[0]) => (stats ?? []).reduce((s, r) => s + (r[k] as number), 0);

  return (
    <div className="space-y-4 rounded-lg border p-5">
      <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold">النسخ الاحتياطي للبيانات (للمدير)</h2></div>
      <p className="text-sm text-muted-foreground">يشمل التصدير جميع جداول المنصة مع الروابط ورموز التحقق للشهادات المنشورة، وبيانات الحسابات (المعرّف والاسم والبريد والصورة). يشمل إعداد مستودع الخطوط، أما ملفات الخطوط والصور نفسها فتبقى في GitHub. لا تُصدَّر كلمات المرور ولا جلسات الدخول ولا مفاتيح الخدمات الخارجية.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={doExport} disabled={!!busy}>{busy === 'export' ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Download className="h-4 w-4 me-2" />} تصدير JSON</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={!!busy}>{busy === 'preview' ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Upload className="h-4 w-4 me-2" />} استيراد JSON</Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
      </div>

      {backup && stats && (
        <div className="space-y-4 border-t pt-4">
          <div className="text-sm space-y-1">
            <p>تاريخ النسخة: <strong>{new Date(backup.exportedAt).toLocaleString('ar-EG')}</strong> — إصدار المخطط: <strong>{backup.schemaVersion}</strong></p>
            {warnings.map((w) => <p key={w} className="text-destructive">{w}</p>)}
          </div>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60"><tr>{['الجدول', 'في النسخة', 'جديد', 'متعارض', 'مطابق', 'غير موجود في النسخة'].map((h) => <th key={h} className="p-2 text-right font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.table} className="border-t">
                    <td className="p-2 whitespace-nowrap">{LABELS[s.table] ?? s.table}</td>
                    <td className="p-2">{s.inBackup}</td>
                    <td className="p-2 text-primary">{s.missing}</td>
                    <td className={`p-2 ${s.conflicts ? 'text-destructive font-semibold' : ''}`}>{s.conflicts}</td>
                    <td className="p-2 text-muted-foreground">{s.identical}</td>
                    <td className="p-2">{s.onlyInDatabase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {accStats && (
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p className="font-medium">الحسابات</p>
              <p>في النسخة: {accStats.inBackup} — موجودة حالياً: {accStats.matched} — بيانات مختلفة: {accStats.changed} — غير موجودة: <span className={accStats.missing ? 'text-destructive font-semibold' : ''}>{accStats.missing}</span></p>
              {accStats.missingEmails.length > 0 && <p className="text-muted-foreground break-all">{accStats.missingEmails.join('، ')}</p>}
            </div>
          )}
          <RadioGroup dir="rtl" value={mode} onValueChange={(v) => { setMode(v as typeof mode); setConfirmed(false); }} className="space-y-2">
            <div className="flex items-start gap-2"><RadioGroupItem value="addMissing" id="m1" className="mt-1" /><Label htmlFor="m1" className="leading-relaxed">إضافة السجلات المفقودة فقط ({total('missing')}) — لا يُعدَّل ولا يُحذف أي سجل موجود.</Label></div>
            <div className="flex items-start gap-2"><RadioGroupItem value="restore" id="m2" className="mt-1" /><Label htmlFor="m2" className="leading-relaxed">الاستعادة الكاملة من النسخة — إضافة {total('missing')}، واستبدال {total('conflicts')} سجلاً متعارضاً، وحذف {total('onlyInDatabase')} سجلاً غير موجود في النسخة، وإرجاع أسماء وصور {accStats?.changed ?? 0} حساباً.</Label></div>
          </RadioGroup>
          {mode === 'restore' && (
            <label className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <Checkbox checked={confirmed} onCheckedChange={(c) => setConfirmed(c === true)} className="mt-0.5" />
              أفهم أن البيانات الحالية المتعارضة ستُستبدل وأن السجلات غير الموجودة في النسخة ستُحذف نهائياً.
            </label>
          )}
          <div className="flex gap-2">
            <Button onClick={() => setDialog(true)} disabled={!!busy || (mode === 'restore' && !confirmed)} variant={mode === 'restore' ? 'destructive' : 'default'}>
              {busy === 'restore' && <Loader2 className="h-4 w-4 me-2 animate-spin" />} تنفيذ الاستيراد
            </Button>
            <Button variant="ghost" onClick={() => { setBackup(null); setStats(null); }} disabled={!!busy}>إلغاء</Button>
          </div>
        </div>
      )}

      <AlertDialog open={dialog} onOpenChange={setDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>تأكيد الاستيراد</AlertDialogTitle>
            <AlertDialogDescription>{mode === 'restore' ? 'سيتم استبدال البيانات الحالية بمحتوى النسخة الاحتياطية. لا يمكن التراجع عن هذه العملية.' : 'سيتم إضافة السجلات المفقودة فقط دون تعديل البيانات الحالية.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={doRestore} className={mode === 'restore' ? 'bg-destructive text-destructive-foreground' : ''}>متابعة</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
