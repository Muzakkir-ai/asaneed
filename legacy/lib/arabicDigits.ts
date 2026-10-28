/** Preserve separators and leading zeroes while rendering Arabic-Indic digits. */
export const arabicDigits=(value:string|number)=>String(value).replace(/[0-9]/g,digit=>'٠١٢٣٤٥٦٧٨٩'[Number(digit)]);
