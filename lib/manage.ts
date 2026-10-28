export function normalizeName(value:string) {
 return value.normalize('NFKC').replace(/[ـً-ٰٟۖ-ۭ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').toLowerCase().replace(/\s+/g,' ').trim();
}
export function validName(value:string) { return value.trim().length>0 && value.length<=200; }
export function validId(value:string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
