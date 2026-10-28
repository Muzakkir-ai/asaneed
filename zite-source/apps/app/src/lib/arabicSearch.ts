/** Search keys only; the saved vocalized spelling remains unchanged. */
export const arabicSearchKey=(value:string)=>value.normalize('NFKC')
 .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/gu,'')
 .replace(/[أإآٱ]/gu,'ا').replace(/ى/gu,'ي')
 .replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
 .replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
 .toLocaleLowerCase('ar').replace(/\s+/gu,' ').trim();
export const matchesArabic=(value:string,query:string)=>arabicSearchKey(value).includes(arabicSearchKey(query));
