export function normalizeRegistration(value: string): string {
 const normalized = value.normalize('NFKC')
  .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x660))
  .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x6f0))
  .replace(/[\s\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
  .replace(/[–—−]/g, '-');
 return /^\d{8}$/.test(normalized) ? `${normalized.slice(0,4)}-${normalized.slice(4)}` : normalized;
}
export function isRegistration(value: string): boolean { return /^\d{4}-\d{4}$/.test(value); }
export function arabicDigits(value: string): string { return value.replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]); }
