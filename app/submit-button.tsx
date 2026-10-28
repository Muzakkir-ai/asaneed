'use client';
import { useFormStatus } from 'react-dom';
export default function SubmitButton({children,pendingLabel}:{children:React.ReactNode;pendingLabel:string}) {
 const {pending}=useFormStatus();
 return <button type="submit" disabled={pending} aria-busy={pending}>{pending?pendingLabel:children}</button>;
}
