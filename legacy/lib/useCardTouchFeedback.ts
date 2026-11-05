import {useEffect} from 'react';

const CARD_SELECTOR='.zite-app .workspace-action-card, .zite-app .workspace-icon-card[role="button"]';

/** Touch feedback is visual only: never intercept or defer the native click. */
export function useCardTouchFeedback(){
 useEffect(()=>{
  let card:HTMLElement|null=null,timer:ReturnType<typeof setTimeout>|undefined;
  let pointer:number|undefined,startX=0,startY=0;
  const clear=()=>{clearTimeout(timer);card?.removeAttribute('data-card-touch');card=null;pointer=undefined;};
  const down=(event:PointerEvent)=>{
   if(event.pointerType==='mouse'||!event.isPrimary)return;
   clear();
   const target=event.target instanceof Element?event.target.closest<HTMLElement>(CARD_SELECTOR):null;
   if(!target||target.matches(':disabled,[aria-disabled="true"]'))return;
   card=target;pointer=event.pointerId;startX=event.clientX;startY=event.clientY;
   card.setAttribute('data-card-touch','true');
  };
  const move=(event:PointerEvent)=>{if(event.pointerId===pointer&&Math.hypot(event.clientX-startX,event.clientY-startY)>10)clear();};
  const up=(event:PointerEvent)=>{if(event.pointerId===pointer){pointer=undefined;timer=setTimeout(clear,380);}};
  const cancel=(event:PointerEvent)=>{if(event.pointerId===pointer)clear();};
  document.addEventListener('pointerdown',down,{passive:true});
  document.addEventListener('pointermove',move,{passive:true});
  document.addEventListener('pointerup',up,{passive:true});
  document.addEventListener('pointercancel',cancel,{passive:true});
  document.addEventListener('scroll',clear,{passive:true,capture:true});
  window.addEventListener('blur',clear);
  return()=>{
   clear();document.removeEventListener('pointerdown',down);document.removeEventListener('pointermove',move);
   document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',cancel);
   document.removeEventListener('scroll',clear,true);window.removeEventListener('blur',clear);
  };
 },[]);
}
