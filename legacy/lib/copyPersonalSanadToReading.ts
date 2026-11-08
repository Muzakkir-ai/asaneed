import type {PreparedSanadPeople} from './preparedSanadPeople';

/** Independent of endpoint modules so copying is safe in both the browser and tests. */
export type ReusablePersonalSanad={
 sanadText:string;
 personalPersonIds?:string[]|null;
 preparedPeople?:PreparedSanadPeople|null;
 junction:'ubaydi'|'jazari';
 continuationId?:string|null;
};

/** Reuse narrator identities only; a reviewed onward link is scoped to the original reading. */
export function copyPersonalSanadToReading(source:ReusablePersonalSanad){
 return {
  text:source.sanadText,
  personIds:[...(source.personalPersonIds||[])],
  preparation:source.preparedPeople||null,
  junction:source.junction,
  continuationId:null as null,
  unifiedSanad:null as null
 };
}
