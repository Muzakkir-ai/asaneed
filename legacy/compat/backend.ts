import {z} from 'zod';
import {context} from './context';
export class ZiteError extends Error {constructor(details:{code:string;message:string;userFacingMessage?:string}){super(details.userFacingMessage||details.message);}}
export function createEndpoint<I extends z.ZodTypeAny,O extends z.ZodTypeAny>(definition:{description:string;authenticated?:boolean;inputSchema:I;outputSchema:O;execute:(args:{input:z.infer<I>;context:ReturnType<typeof context>})=>Promise<unknown>}){
 return {...definition,async invoke(value:unknown):Promise<z.infer<O>>{const input=definition.inputSchema.parse(value);return definition.outputSchema.parse(await definition.execute({input,context:context()}));}};
}
