export class RequestTooLarge extends Error {}

export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > maxBytes) throw new RequestTooLarge();
  if (!request.body) throw new SyntaxError('Missing request body');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8',{fatal:true});
  let bytes = 0;
  let text = '';
  try {
    for (;;) {
      const {done,value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        void reader.cancel().catch(() => {});
        throw new RequestTooLarge();
      }
      text += decoder.decode(value,{stream:true});
    }
    return JSON.parse(text + decoder.decode());
  } catch(error) {
    if(error instanceof TypeError)throw new SyntaxError('Malformed request body');
    throw error;
  } finally {
    reader.releaseLock();
  }
}
