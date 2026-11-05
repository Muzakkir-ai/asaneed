type Issuer={id:string;print_profile?:{personalAccount?:string;loginLinked?:boolean;loginLinkedAt?:string}};
/** A linked login must not reinterpret older guest drafts as newly prepared personal sanads. */
export function issuerAccountIdentity(issuer:Issuer|undefined,createdAt:string|undefined,explicitGuest:unknown,currentUser:string,users:{id:string;authUserId?:string}[]){
 const profile=issuer?.print_profile;
 const linkedGuest=profile?.loginLinked===true&&(typeof explicitGuest==='string'&&explicitGuest||!createdAt||!profile.loginLinkedAt||Date.parse(createdAt)<=Date.parse(profile.loginLinkedAt));
 const guest=!profile?.personalAccount||linkedGuest;
 return {additionalShaykh:guest?issuer?.id||'':'',shaykh:[guest?currentUser:users.find(u=>u.id===profile.personalAccount)?.authUserId||'guest:'+issuer?.id]};
}
