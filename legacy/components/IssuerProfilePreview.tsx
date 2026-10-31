import type {ShaykhPrintProfileOutputType} from '../lib/api';
import {currentArtwork,currentArtworkBase} from '../lib/assets';
type Profile=ShaykhPrintProfileOutputType['profile'];
export default function IssuerProfilePreview({profile,displayName='',issuerNumber=''}:{profile:Profile;displayName?:string;issuerNumber?:string}){
 const getStyles=()=>{try{return JSON.parse(profile.footerLineStyles||'{}') as Record<string,{bold?:boolean,size?:number}>;}catch{return {} as Record<string,{bold?:boolean,size?:number}>;}};
 const artwork=currentArtwork().filter(a=>a.kind==='mashaykh'&&a.number===issuerNumber).sort((a,b)=>['name','line-02','line-03'].indexOf(a.line)-['name','line-02','line-03'].indexOf(b.line));
 const hasArtwork=artwork.some(a=>a.line==='name');
 const lineStyle=(line:string)=>{const settings=getStyles()[line]||{};return {fontSize:`${Math.min(18,Math.max(7,settings.size??(line==='name'?11:9)))}pt`,fontWeight:settings.bold?700:400};};
 const teaching=[profile.showTeachingRole?profile.teachingRole.trim():'',profile.showMadrasaName?profile.madrasaName.trim():''].filter(Boolean).join(' ');
 return <div className="rounded-lg border bg-white p-5 text-center" aria-label="معاينة ظهور المجيز في الشهادة"><div className="mx-auto flex flex-col items-center" style={{fontFamily:"'Sakkal Kitab',serif",color:'#075f69'}}>
 {hasArtwork?artwork.map(a=><span key={a.path} role="img" aria-label={a.line==='name'?(profile.printedName.trim()||displayName):a.line==='line-02'?'الصفة العلمية':'بيانات التدريس'} style={{display:'block',width:`${a.width/artwork[0].height*10.5}mm`,height:`${a.height/artwork[0].height*10.5}mm`,maxWidth:'100%',backgroundColor:a.line==='line-03'?'#926e35':'#075f69',maskImage:`url("${currentArtworkBase()}/${a.path}")`,WebkitMaskImage:`url("${currentArtworkBase()}/${a.path}")`,maskSize:'contain',WebkitMaskSize:'contain',maskRepeat:'no-repeat',WebkitMaskRepeat:'no-repeat',maskPosition:'center',WebkitMaskPosition:'center'}}/>):<div style={lineStyle('name')}>{profile.printedName.trim()||displayName}</div>}
 {(!hasArtwork||!artwork.some(a=>a.line==='line-02'))&&profile.showScientificQualification&&profile.scientificQualification.trim()&&<div style={lineStyle('qualification')}>{profile.scientificQualification.trim()}</div>}
 {(!hasArtwork||!artwork.some(a=>a.line==='line-03'))&&<div style={{color:'#926e35'}}>{teaching&&<div style={lineStyle('teaching')}>{teaching}</div>}{profile.showMadrasaPlace&&profile.madrasaPlace.trim()&&<div style={lineStyle('place')}>{profile.madrasaPlace.trim()}</div>}</div>}
 </div><p className="mt-3 text-xs text-gray-500" style={{fontFamily:'inherit'}}>معاينة بلونين توضيحيين؛ تستخدم الشهادة ألوانها المختارة.{hasArtwork?' تُعرض صور الاسم المحفوظة عند توفرها.':''}</p></div>;
}
