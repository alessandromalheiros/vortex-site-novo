'use strict';
// Núcleo sem rota HTTP e sem transporte de rede. Desligado por padrão.
// Os adaptadores de proteção, registro de pedidos e GHL serão definidos antes da ativação.
const {randomUUID,createHmac}=require('node:crypto');
const {validateContactFields}=require('./contact-validation.cjs');
const {buildSiteWebhookPayload}=require('./ghl-contact.cjs');

const messages={
  unavailable:'O pedido de retorno ainda não está disponível. Você pode conversar pelo WhatsApp.',
  invalid:'Confira os campos indicados antes de continuar.',
  blocked:'Não foi possível validar este pedido. Você pode conversar pelo WhatsApp.',
  limited:'Você fez várias tentativas. Aguarde um pouco antes de tentar novamente.',
  processing:'Este pedido já está em processamento. Não é necessário reenviar.',
  accepted:'Sua solicitação foi encaminhada para processamento. O registro no atendimento ainda não foi confirmado.',
  confirmed:'Seu pedido de retorno foi registrado no atendimento da Vortex.',
  unknown:'Não conseguimos confirmar o recebimento. Evite reenviar agora; você pode conversar pelo WhatsApp.',
  conflict:'Não foi possível reutilizar este pedido com dados diferentes. Revise o preenchimento.',
};
function response(status,state,requestId,extra={}){
  return {status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},
    body:{state,message:messages[state],requestId,...extra}};
}
function createContactReceiver(options={}){
  const {enabled=false,allowedOrigins=[],checkAbuse,claimSubmission,settleSubmission,submit,confirmReceipt,signingKey,timeoutMs=6000}=options;
  const origins=new Set(allowedOrigins);
  const configured=enabled===true&&origins.size>0&&typeof signingKey==='string'&&signingKey.length>=32&&
    [checkAbuse,claimSubmission,settleSubmission,submit].every(fn=>typeof fn==='function');
  if(!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw new Error('Prazo inválido');
  return async function receive(request){
    const requestId=randomUUID();
    if(!configured)return response(503,'unavailable',requestId);
    if(request?.method!=='POST')return {...response(405,'blocked',requestId),headers:{...response(405,'blocked',requestId).headers,Allow:'POST'}};
    // Cabeçalhos normalizados e clientKey devem vir de um adaptador de servidor, nunca do JSON do navegador.
    const {headers={},body,clientKey}=request;
    if(typeof headers.origin!=='string'||!origins.has(headers.origin))return response(403,'blocked',requestId);
    if(typeof headers['content-type']!=='string'||!/^application\/json(?:\s*;|$)/i.test(headers['content-type']))return response(415,'blocked',requestId);
    if(typeof body!=='string')return response(400,'invalid',requestId);
    if(Buffer.byteLength(body,'utf8')>4096)return response(413,'invalid',requestId);
    let data;
    try{data=JSON.parse(body);}catch{return response(400,'invalid',requestId);}
    if(!data||Array.isArray(data)||typeof data!=='object')return response(400,'invalid',requestId);
    const checked=validateContactFields(data);
    if(!checked.valid)return response(422,'invalid',requestId,{fields:checked.errors});
    if(typeof data.submissionId!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(data.submissionId))return response(400,'invalid',requestId);
    if(typeof clientKey!=='string'||!clientKey||clientKey.length>200)return response(503,'unavailable',requestId);
    if(data.verification!=null&&(typeof data.verification!=='string'||data.verification.length>2048))return response(400,'invalid',requestId);
    const payload=buildSiteWebhookPayload(checked.value);
    // Chave privada evita fingerprint simples de telefone/e-mail; nunca enviada ao navegador.
    const fingerprint=createHmac('sha256',signingKey).update(JSON.stringify(payload)).digest('hex');
    const submission={id:data.submissionId,fingerprint};
    const controller=new AbortController();
    let sent=false,claimed=false,timer;
    const execute=async()=>{
      const guard=await checkAbuse({clientKey,origin:headers.origin,token:data.verification||'',signal:controller.signal});
      if(controller.signal.aborted)throw new Error('Prazo encerrado');
      if(guard==='limited')return response(429,'limited',requestId);
      if(guard!=='allowed')return response(403,'blocked',requestId);
      // Implementação obrigatoriamente atômica e persistente no ambiente final.
      const previous=await claimSubmission(submission,{signal:controller.signal});
      if(controller.signal.aborted)throw new Error('Prazo encerrado');
      if(previous!=='new'){
        const states={accepted:[202,'accepted'],confirmed:[200,'confirmed'],processing:[202,'processing'],unknown:[503,'unknown'],conflict:[409,'conflict']};
        const outcome=states[previous]||[503,'unavailable'];
        return response(...outcome,requestId);
      }
      claimed=true;sent=true;
      const receipt=await submit(payload,{requestId,submissionId:submission.id,signal:controller.signal});
      if(controller.signal.aborted)throw new Error('Prazo encerrado');
      if(receipt?.accepted!==true)throw new Error('Sem confirmação de aceitação');
      let state='accepted';
      // HTTP 2xx ou contactId isolado não comprovam gravação. Adaptador deverá verificar no CRM.
      if(typeof confirmReceipt==='function'&&await confirmReceipt(receipt,{signal:controller.signal})===true)state='confirmed';
      if(controller.signal.aborted)throw new Error('Prazo encerrado');
      await settleSubmission(submission,state,{signal:controller.signal});
      if(controller.signal.aborted)throw new Error('Prazo encerrado');
      return response(state==='confirmed'?200:202,state,requestId);
    };
    try{
      return await Promise.race([execute(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Prazo encerrado'));},timeoutMs);})]);
    }catch{
      // Um timeout não prova que o envio falhou. Nunca repetir automaticamente.
      // Uma reserva não concluída deve continuar bloqueada como processing/unknown no armazenamento final.
      controller.abort();
      return response(503,sent||claimed?'unknown':'unavailable',requestId);
    }finally{clearTimeout(timer);}
  };
}
module.exports={createContactReceiver};
