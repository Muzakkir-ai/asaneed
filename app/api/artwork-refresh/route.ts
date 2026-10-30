import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {verifyArtworkWorkflow} from '../../../legacy/lib/githubArtworkIdentity';
import {discoverArtwork} from '../../../legacy/lib/artworkCatalog';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){
 let stage='identity';
 try{
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if(!token)return NextResponse.json({error:'Unauthorized'},{status:401});
  await verifyArtworkWorkflow(token);
  stage='configuration';
  const secret=process.env.ARTWORK_REFRESH_CAPABILITY;
  if(!secret)throw Error('Refresh unavailable');
  stage='repository';
  const response=await fetch('https://api.github.com/repos/Muzakkir-ai/fonts/commits/main',{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Repository unavailable');
  const revision=(await response.json()).sha;if(!/^[a-f0-9]{40}$/.test(revision))throw Error('Invalid revision');
  stage='discovery';
  const artwork=await discoverArtwork('Muzakkir-ai/fonts',revision);
  const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  stage='catalog';
  const {data,error}=await client.rpc('refresh_github_artwork',{p_secret:secret,p_revision:revision,p_artwork:artwork});
  if(error)throw Error(error.message);
  return NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error('GitHub artwork refresh failed',stage,error instanceof Error?error.message:'failed');return NextResponse.json({error:'Artwork refresh failed; previous catalog retained',stage,reason:stage==='identity'&&error instanceof Error?error.message:undefined},{status:403});}
}
