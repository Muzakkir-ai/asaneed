/** Raise only the issuer/footer block when the certificate text is short.
 *
 * The original layout remains anchored 16mm above the paper edge. This
 * optionally lifts the whole footer (signature, artwork, dates and number)
 * without changing the ijazah body, heading, font size or line spacing.
 *
 * Rectangles come from getBoundingClientRect() (scaled preview pixels);
 * return values are unscaled layout CSS pixels for the shared print styling.
 * Never reduce the clear vertical space between body and footer below 12mm.
 */
export function certificateFooterLift({
 pageWidth,layoutWidth,bodyBottom,footerTop,previousLift=0,
}:{
 pageWidth:number;layoutWidth:number;bodyBottom:number;footerTop:number;
 previousLift?:number;
}):number{
 const scale=pageWidth/layoutWidth;
 const pxPerMm=pageWidth/297;
 if(!Number.isFinite(scale)||scale<=0||!Number.isFinite(pxPerMm)||pxPerMm<=0)return 0;
 // Recover the footer's natural top before the previous CSS translateY, so
 // repeated resize/zoom measurements converge rather than walking upward.
 const naturalFooterTop=footerTop+previousLift*scale;
 const gapMm=(naturalFooterTop-bodyBottom)/pxPerMm;
 if(!Number.isFinite(gapMm)||gapMm<=12.001)return 0;
 // Gentle lift: maximum 10mm for short certificates, only a few mm for
 // medium ones, and no lift for long certificates with <=12mm free space.
 const liftMm=Math.max(0,Math.min(10,(gapMm-12)*0.75,gapMm-12));
 return liftMm*layoutWidth/297;
}
