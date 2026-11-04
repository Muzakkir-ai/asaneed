import type {MatnStyle} from './matnRichText';
export type EditorPreset={id:string;label:string;kind:'inline'|'paragraph';style:Partial<MatnStyle>};
/** Semantic IDs remain stable; callers may override template-specific typography. */
export const editorPresets:EditorPreset[]=[
 {id:'normal',label:'النص العادي',kind:'inline',style:{preset:'normal',bold:false,color:'default',sizePercent:100,font:'KSA Regular'}},
 {id:'heading',label:'العنوان',kind:'paragraph',style:{preset:'heading',bold:true,color:'primary',sizePercent:120,alignment:'center',paragraphSpacing:8}},
 {id:'teacher',label:'اسم الشيخ',kind:'inline',style:{preset:'teacher',bold:true,color:'secondary',font:'Sakkal Kitab'}},
 {id:'book',label:'اسم الكتاب',kind:'inline',style:{preset:'book',bold:true,color:'primary',font:'Sakkal Kitab'}},
 {id:'sanad',label:'نص السند',kind:'paragraph',style:{preset:'sanad',alignment:'justify',lastLineAlignment:'right',lineSpacing:2.25}},
 {id:'closing',label:'الخاتمة',kind:'paragraph',style:{preset:'closing',alignment:'center',paragraphSpacing:8}}
];
