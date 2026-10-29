import { useEffect, useState } from 'react';
import { assetSource } from '../lib/api';
import { Input } from '@project/components/ui/input';
import { Button } from '@project/components/ui/button';
import { Github,RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { applyAssets, hasAssets } from '../lib/assets';

/** Admin-only: link the GitHub repo hosting fonts/artwork. Included in application-data backups. */
export default function AssetSourcePanel() {
  const [repository, setRepository] = useState('');
  const [branch, setBranch] = useState('main');
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState(hasAssets());

  useEffect(() => { assetSource({}).then(r => { setRepository(r.repository); setBranch(r.branch); }).catch(() => {}); }, []);

  const save = async (repo: string, refresh=false) => {
    setSaving(true);
    try {
      const r = await assetSource(refresh?{refresh:true}:{ repository: repo, branch });
      applyAssets(r.repository, r.branch,r.revision);
      setRepository(r.repository); setBranch(r.branch); setConnected(hasAssets());
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
      <p className={connected ? 'text-sm font-medium text-primary' : 'text-sm font-medium text-destructive'}>
        {connected ? 'متصل ✓' : 'غير متصل — ستظهر الشهادات بدون الخطوط والزخارف'}
      </p>
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
