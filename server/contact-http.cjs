'use strict';
// Adaptador Fetch Request/Response. Não registra rota, não abre porta e não lê segredos.
const {createContactReceiver}=require('./contact-receiver.cjs');
function reply(status,state,message,extra={}){
  return new Response(JSON.stringify({state,message}),{status,headers:{
    'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',...extra}});
}
function createContactHttpHandler({enabled=false,receiverOptions={},getClientKey,bodyTimeoutMs=3000}={}){
  if(!Number.isFinite(bodyTimeoutMs)||bodyTimeoutMs<1||bodyTimeoutMs>10000)throw new Error('Prazo inválido');
  const receive=createContactReceiver({...receiverOptions,enabled:enabled===true});
  const origins=new Set(receiverOptions.allowedOrigins||[]);
  return async function handle(request,serverContext){
    if(enabled!==true||typeof getClientKey!=='function')return reply(503,'unavailable','O pedido de retorno ainda não está disponível. Você pode conversar pelo WhatsApp.');
    if(request.method!=='POST')return reply(405,'blocked','Método não permitido.',{Allow:'POST'});
    const origin=request.headers.get('origin');
    if(!origin||!origins.has(origin))return reply(403,'blocked','Não foi possível validar este pedido.');
    const contentType=request.headers.get('content-type')||'';
    if(!/^application\/json(?:\s*;|$)/i.test(contentType))return reply(415,'blocked','Formato não permitido.');
    const encoding=request.headers.get('content-encoding');
    if(encoding&&encoding.toLowerCase()!=='identity')return reply(415,'blocked','Formato não permitido.');
    const length=request.headers.get('content-length');
    if(length!==null&&(!/^\d+$/.test(length)||Number(length)>4096))return reply(413,'invalid','Pedido maior que o permitido.');
    // Identificador vem do contexto confiável da hospedagem, nunca do formulário/cabeçalhos do visitante.
    let clientKey;
    try{clientKey=await getClientKey(serverContext);}catch{return reply(503,'unavailable','Atendimento indisponível neste momento.');}
    if(typeof clientKey!=='string'||!clientKey||clientKey.length>200)return reply(503,'unavailable','Atendimento indisponível neste momento.');
    let reader,timer,bytes=0;
    const chunks=[];
    const read=async()=>{
      if(!request.body)return '';
      reader=request.body.getReader();
      while(true){
        const part=await reader.read();
        if(part.done)break;
        bytes+=part.value.byteLength;
        if(bytes>4096){void reader.cancel().catch(()=>{});return null;}
        chunks.push(Buffer.from(part.value));
      }
      return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));
    };
    let body;
    try{
      body=await Promise.race([read(),new Promise((_,reject)=>{
        timer=setTimeout(()=>{if(reader)void reader.cancel().catch(()=>{});reject(new Error('Prazo encerrado'));},bodyTimeoutMs);
      })]);
    }catch{return reply(400,'invalid','Não foi possível ler este pedido.');}
    finally{clearTimeout(timer);}
    if(body===null)return reply(413,'invalid','Pedido maior que o permitido.');
    try{
      const result=await receive({method:'POST',headers:{origin,'content-type':contentType},body,clientKey});
      return new Response(JSON.stringify(result.body),{status:result.status,headers:{...result.headers,'X-Content-Type-Options':'nosniff'}});
    }catch{return reply(503,'unavailable','Atendimento indisponível neste momento.');}
  };
}
module.exports={createContactHttpHandler};
