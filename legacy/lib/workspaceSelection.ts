export type WorkspaceSelection={accountId:string;edit:boolean};
let selection:WorkspaceSelection={accountId:'',edit:false};
export const setWorkspaceSelection=(next:WorkspaceSelection)=>{selection={...next};};
export const workspaceHeaders=()=>({'x-workspace-account':selection.accountId,'x-workspace-edit':selection.edit?'confirmed':''});
export const getWorkspaceSelection=()=>({...selection});
