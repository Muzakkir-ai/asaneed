import type {AdditionalReadingSanadsOutputType} from './api';

type SavedReading=AdditionalReadingSanadsOutputType['sanads'][number];

/** Reuse narrator identities only; a reviewed onward link is scoped to the original reading. */
export function copyPersonalSanadToReading(source:SavedReading){
 return {
  text:source.sanadText,
  personIds:[...(source.personalPersonIds||[])],
  preparation:source.preparedPeople||null,
  junction:source.junction,
  continuationId:null as null,
  unifiedSanad:null as null
 };
}
