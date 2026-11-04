/** Shared edits never mutate copied personal chains or certificate snapshots.
 * Draft refresh is an explicit preparation action. Compatibility export only. */
export async function syncSharedSanads(_oldText?:string,_newText?:string){return {prepared:0,snapshots:0};}
