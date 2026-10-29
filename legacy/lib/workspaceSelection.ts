export type WorkspaceSelection={accountId:string;issuerId:string;edit:boolean};
let selection:WorkspaceSelection={accountId:'',issuerId:'',edit:false};
export const setWorkspaceSelection=(next:WorkspaceSelection)=>{selection={...next};};
export const workspaceHeaders=()=>({'x-workspace-account':selection.accountId,'x-workspace-issuer':selection.issuerId,'x-workspace-edit':selection.edit?'confirmed':''});
export const getWorkspaceSelection=()=>({...selection});
