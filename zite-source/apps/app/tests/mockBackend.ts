export const createEndpoint=(config:any)=>config;
export class ZiteError extends Error {constructor(data:any){super(data.userFacingMessage||data.message);}}
