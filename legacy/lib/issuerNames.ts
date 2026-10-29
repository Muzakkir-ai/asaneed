export function personalIssuerName(accountName:string,printedName?:string|null,storedName?:string|null){
 return printedName?.trim()||accountName.trim()||storedName?.trim()||'شيخ غير مسمى';
}
