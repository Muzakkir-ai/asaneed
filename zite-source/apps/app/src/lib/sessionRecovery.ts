let refreshSession:(()=>Promise<unknown>)|undefined;
let refreshing:Promise<unknown>|undefined;
export const setSessionRefresher=(refresh?:()=>Promise<unknown>)=>{refreshSession=refresh;};
export const isSessionError=(error:unknown)=>error instanceof Error&&/\b401\b|unauthorized|session expired/i.test(error.message);
export class SessionExpiredError extends Error {
 constructor(){super('انتهت جلسة الدخول. سجّل الدخول مرة أخرى للمتابعة.');this.name='SessionExpiredError';}
}
export function sessionCall<I,O>(call:(input:I)=>Promise<O>):(input:I)=>Promise<O>{
 return async(input:I)=>{
  try{return await call(input);}catch(error){
   if(!isSessionError(error))throw error;
   if(refreshSession){
    try{if(!refreshing)refreshing=refreshSession().finally(()=>{refreshing=undefined;});await refreshing;}catch{/* Show sign-in if refresh fails. */}
    try{return await call(input);}catch(retry){if(!isSessionError(retry))throw retry;}
   }
   window.dispatchEvent(new Event('asaneed-session-expired'));
   throw new SessionExpiredError();
  }
 };
}
