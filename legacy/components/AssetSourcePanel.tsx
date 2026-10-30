import { useEffect, useState } from 'react';
import type {AssetSourceOutputType} from '../lib/api';
import { assetSource } from '../lib/api';
import { Input } from '@project/components/ui/input';
import { Button } from '@project/components/ui/button';
import { Github,RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { applyAssets, hasAssets } from '../lib/assets';

/** Admin-only: link the GitHub repo hosting fonts/artwork. Included in application-data backups. */
export default function AssetSourcePanel() {
  const [catalog,setCatalog]=useState<AssetSourceOutputType|null>(null);
  const [repository, setRepository] = useState('');
  const [branch, setBranch] = useState('main');
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState(hasAssets());

  useEffect(() => { assetSource({}).then(r => { setCatalog(r); setRepository(r.repository); setBranch(r.branch); }).catch(() => {}); }, []);

  const save = async (repo: string, refresh=false) => {
    setSaving(true);
    try {
      const r = await assetSource(refresh?{refresh:true}:{ repository: repo, branch });
      applyAssets(r.repository, r.branch,r.revision,r.artwork);
      setCatalog(r); setRepository(r.repository); setBranch(r.branch); setConnected(hasAssets());
      toast.success(r.repository ? 'تم ربط المستودع وتحميل الخطوط والزخارف' : 'تم فصل المستودع');
    } catch (e) {
      toast.error((e as { userFacingMessage?: string }).userFacingMessage || (e instanceof Error?e.message:'تعذّر الحفظ'));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3 rounded-lg border p-5">
      <div className="flex items-center gap-2"><Github className="h-5 w-5" /><h2 className="text-xl font-bold">مصدر الخطوط والزخارف (GitHub)</h2></div>
      <p className="text-sm text-muted-foreground">
        الخطوط وإطار الشهادة والصور لا تُضمَّن في الموقع، بل تُحمَّل من هذا المستودع عند فتح الموقع. ينبغي أن يحتوي المستودع على مجلدي <span dir="ltr">fonts/</span> و<span dir="ltr">svg/</span>. إعداد المستودع مُضمَّن في النسخة الاحتياطية؛ ملفات المستودع الخارجية تُحفظ في GitHub.
      </p>
      <p className="text-xs text-muted-foreground">تُفحص تحديثات GitHub تلقائيًا كل دقيقة أثناء فتح الموقع للمشرف، وعند العودة إلى الصفحة. يبقى زر التحديث اليدوي متاحًا.</p><p className={connected ? 'text-sm font-medium text-primary' : 'text-sm font-medium text-destructive'}>
        {connected ? 'متصل ✓' : 'غير متصل — ستظهر الشهادات بدون الخطوط والزخارف'}
      </p>
      {catalog&&<details className="rounded border p-3"><summary className="cursor-pointer font-semibold">دليل أرقام المشايخ والكتب والصور ({catalog.artwork.length})</summary><div className="mt-3 space-y-2 text-sm"><p>اسم المجلد هو رقم المُجيز. الملفات: name.svg ثم line-02.svg ثم line-03.svg. أول سطرين باللون الأساسي، والثالث باللون الثانوي.</p>{catalog.issuerDirectory.map(i=><div key={i.number}><span dir="ltr" className="font-mono">svg/mashaykh/{i.number}/</span> — {i.name}</div>)}<p>الكتب: svg/books/01/heading.svg · الطرق: svg/turuq/01/heading.svg. كتب الطرق تُسجّل تلقائيًا بأرقامها؛ ارفع heading.svg في المسار المعروض ثم اضغط تحديث ملفات GitHub.</p>{catalog.routeBookDirectory.map(b=><div key={b.number}><span dir="ltr" className="font-mono">{b.path}</span> — {b.name}</div>)}{catalog.artwork.map(a=><div key={a.path} dir="ltr" className="break-all">✓ {a.path} {a.label&&'— '+a.label}</div>)}{!catalog.artwork.length&&<p>لم تُكتشف ملفات مرقمة بعد. يبقى العرض الحالي محفوظًا.</p>}</div></details>}
      <Input dir="ltr" placeholder="https://github.com/Muzakkir-ai/fonts" value={repository} onChange={e => setRepository(e.target.value)} />
      <Input dir="ltr" placeholder="main" value={branch} onChange={e => setBranch(e.target.value)} />
      <div className="flex gap-2">
        <Button variant="outline" disabled={saving||!connected} onClick={()=>save(repository,true)}><RefreshCw className="size-4 ml-2"/>تحديث ملفات GitHub</Button>
        <Button disabled={saving || !repository.trim()} onClick={() => save(repository)}>ربط وتحميل</Button>
        {connected && <Button variant="outline" disabled={saving} onClick={() => save('')}>فصل</Button>}
      </div>
    </div>
  );
}
