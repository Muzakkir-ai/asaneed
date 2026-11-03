export const normalizeUsername=(value:string)=>value.trim().toLowerCase();
export const validUsername=(value:string)=>/^[a-z][a-z0-9_]{2,29}$/.test(value);
