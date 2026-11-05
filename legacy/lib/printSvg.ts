const cache=new Map<string,Promise<string>>();
/** Flatten only the SVG's alpha into a transparent, 600dpi coloured image.
 * Native image printing avoids CSS-mask edge seams; the original SVG stays untouched. */
export function printSvg(url:string,widthMm:number,heightMm:number,color:string):Promise<string>{
 if(!Number.isFinite(widthMm)||!Number.isFinite(heightMm)||widthMm<=0||heightMm<=0)return Promise.reject(Error('Invalid artwork dimensions'));
 const key=JSON.stringify([url,widthMm,heightMm,color]);
 const found=cache.get(key);if(found)return found;
 const job=new Promise<string>((resolve,reject)=>{
  const image=new Image();image.crossOrigin='anonymous';
  const timer=setTimeout(()=>{image.onload=null;image.onerror=null;reject(Error('Artwork timed out'));},15000);
  image.onerror=()=>{clearTimeout(timer);reject(Error('Cannot load issuer artwork'));};
  image.onload=()=>{clearTimeout(timer);try{
   const scale=Math.min(600/25.4,4096/Math.max(widthMm,heightMm));
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(widthMm*scale));canvas.height=Math.max(1,Math.ceil(heightMm*scale));
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
   ctx.drawImage(image,0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,canvas.width,canvas.height);
   resolve(canvas.toDataURL('image/png'));
  }catch(error){reject(error);}};
  image.src=url;
 });
 if(cache.size>=32)cache.delete(cache.keys().next().value!);
 cache.set(key,job);job.catch(()=>{if(cache.get(key)===job)cache.delete(key);});return job;
}
