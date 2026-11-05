'use client';
import {useState} from 'react';
import {Eye, EyeOff} from 'lucide-react';
export default function PasswordField({showLabel,hideLabel,autoComplete='current-password',minLength}:{showLabel:string;hideLabel:string;autoComplete?:'current-password'|'new-password';minLength?:number}) {
 const [visible,setVisible]=useState(false);
 return <div className="password-field">
  <input id="password" name="password" type={visible?'text':'password'} autoComplete={autoComplete} minLength={minLength} dir="ltr" required maxLength={1024}/>
  <button type="button" className="password-toggle" onClick={()=>setVisible(value=>!value)} aria-label={visible?hideLabel:showLabel} aria-pressed={visible} aria-controls="password" title={visible?hideLabel:showLabel}>{visible?<EyeOff aria-hidden="true"/>:<Eye aria-hidden="true"/>}</button>
 </div>;
}
