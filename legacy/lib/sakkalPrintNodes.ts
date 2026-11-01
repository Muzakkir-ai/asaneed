import {Children,cloneElement,createElement,isValidElement,type CSSProperties,type ReactNode} from 'react';
import {sakkalInitialBa} from './sakkalInitialBa';
import {cleanAllahSpelling} from './sanadPunctuation';

/** Apply the glyph only to text inheriting Sakkal; explicit other fonts opt out. */
export function sakkalPrintNodes(nodes:ReactNode,inherited=false,routeFont='Sakkal Kitab',prophet=false,inheritedFont='KSA Regular'):ReactNode{
 return Children.map(nodes,node=>{
  if(typeof node==='string'){
   const clean=inheritedFont.includes('KSA Regular')?cleanAllahSpelling(node):node,text=inherited?sakkalInitialBa(clean):clean;
   if(!inheritedFont.includes('KSA Regular'))return text;
   return text.split(/(الله)/u).map((part,i)=>part==='الله'?createElement('span',{key:i,style:{fontFeatureSettings:'"liga" 0'}},part):part);
  }
  if(!isValidElement<{style?:CSSProperties;className?:string;children?:ReactNode}>(node))return node;
  let font=node.props.style?.fontFamily;
  if(font?.includes('--certificate-route-source-font'))font=routeFont;
  const classes=node.props.className?.split(/\s+/)||[];
  const forced=prophet||classes.includes('certificate-prophet-chain');
  const exempt=classes.some(c=>['certificate-symbol','certificate-qcf','certificate-ayah-marker','certificate-verse-bracket'].includes(c));
  const active=exempt?false:forced||classes.includes('certificate-footer-name')||classes.includes('certificate-salawat')?true:font?font.includes('Sakkal Kitab'):inherited;
  if(node.props.children===undefined)return node;
  return cloneElement(node,{},sakkalPrintNodes(node.props.children,active,routeFont,forced&&!exempt,active?'Sakkal Kitab':font||inheritedFont));
 });
}
