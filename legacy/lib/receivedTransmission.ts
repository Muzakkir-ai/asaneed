/** Locate a transmission segment without changing its saved Arabic spelling. */
function searchable(text:string){
 const chars:string[]=[],offsets:number[]=[];
 for(let i=0;i<text.length;i++){let c=text[i];if(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/u.test(c))continue;c=c.replace(/[أإآٱ]/u,'ا').replace(/ى/u,'ي');if(/\s/u.test(c)){if(!chars.length||chars.at(-1)===' ')continue;c=' ';}chars.push(c);offsets.push(i);}
 return {text:chars.join(''),offsets};
}
export function extractTeacherTransmission(chain:string,personalChain='',conclusions:string[]=[]){
 const original=chain.replace(/^【بيان القراءة:[^】]+】\s*/u,'');
 const indexed=searchable(original);
 const anchor=personalChain?searchable(personalChain.trim().replace(/[.،؛\s]+$/u,'')).text:'';
 let start=anchor?indexed.text.indexOf(anchor):-1;
 if(start<0)start=indexed.text.indexOf('كما اخذته');
 if(start<0)throw Error('تعذر فصل السند من الشهادة؛ أضفه يدويًا في أسانيدي');
 let end=original.length;
 for(const conclusion of conclusions){const target=searchable(conclusion).text.trim();if(target.length<15)continue;const p=indexed.text.indexOf(target,start);if(p>=0)end=Math.min(end,indexed.offsets[p]);}
 // Historical certificates may predate structured transmission snapshots.
 for(const marker of ['هذا واوصيه','واوصيه بتقوى الله']){const p=indexed.text.indexOf(marker,start);if(p>=0)end=Math.min(end,indexed.offsets[p]);}
 let body=original.slice(indexed.offsets[start],end).trim();
 const leading=searchable(body);const phrase=leading.text.match(/^كما اخذته\s*/u);
 if(phrase)body=body.slice(leading.offsets[phrase[0].length]??body.length).trim();
 body=body.replace(/^[،؛.\s]+|[،؛\s]+$/gu,'');
 if(body.length<100)throw Error('السند المنقول غير مكتمل؛ راجعه يدويًا');
 return body;
}
export function receivedPersonalChain(issuerName:string,teacherChain:string){
 if(!issuerName.trim()||teacherChain.trim().length<100)throw Error('اسم المجيز وسنده الكامل مطلوبان');
 return `كما أخذته عن الشيخ ${issuerName.trim()}، ${teacherChain.trim()}`;
}
