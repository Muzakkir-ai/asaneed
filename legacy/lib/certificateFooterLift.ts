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
 pageWidth,layoutWidth,bodyBottom,footerTop,previousLift=0,manualOffsetMm=0,
}:{
 pageWidth:number;layoutWidth:number;bodyBottom:number;footerTop:number;
 previousLift?:number;manualOffsetMm?:number;
}):number{
 const scale=pageWidth/layoutWidth;
 const pxPerMm=pageWidth/297;
 if(!Number.isFinite(scale)||scale<=0||!Number.isFinite(pxPerMm)||pxPerMm<=0)return 0;
 // Recover the footer's natural top before the previous CSS translateY, so
 // repeated resize/zoom measurements converge rather than walking upward.
 // Remove BOTH current transforms when measuring the unshifted footer.
 // Otherwise manually raising it would be partially cancelled by the
 // automatic lift on every render, which makes the control unpredictable.
 const naturalFooterTop=footerTop+previousLift*scale-manualOffsetMm*pxPerMm;
 const naturalGapMm=(naturalFooterTop-bodyBottom)/pxPerMm;
 if(!Number.isFinite(naturalGapMm)||!Number.isFinite(manualOffsetMm)||naturalGapMm<=12.001)return 0;
 // Preserve the original gentle 0–10mm automatic balancing baseline, but
 // never let that automatic portion consume the user's manual 12mm clearance.
 const desired=Math.max(0,Math.min(10,(naturalGapMm-12)*0.75,naturalGapMm-12));
 const allowed=Math.max(0,naturalGapMm+manualOffsetMm-12);
 return Math.min(desired,allowed)*layoutWidth/297;
}
