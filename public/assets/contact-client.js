/* Cliente compartilhado com o navegador. Sem transporte real ou persistência por padrão. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./contact-validation.cjs').validateContactFields);
  else root.VortexContactClient=factory(root.VortexContactValidation?.validateContactFields);
})(typeof globalThis==='object'?globalThis:this,function(validate){
  'use strict';
  const messages={
    preview:'Preenchimento conferido. Nesta prévia, nenhuma solicitação foi enviada e nenhum contato foi criado. Você pode revisar os campos. O pedido de retorno será habilitado após a integração com o atendimento.',
    invalid:'Confira os campos indicados antes de continuar.',
    unavailable:'O pedido de retorno ainda não está disponível. Você pode conversar pelo WhatsApp.',
    accepted:'Sua solicitação foi encaminhada para processamento. O registro no atendimento ainda não foi confirmado.',
    confirmed:'Seu pedido de retorno foi registrado no atendimento da Vortex.',
    processing:'Seu pedido está em processamento. Não é necessário reenviar.',
    unknown:'Não conseguimos confirmar o recebimento. Evite reenviar agora; você pode conversar pelo WhatsApp.',
    blocked:'Não foi possível validar este pedido. Você pode conversar pelo WhatsApp.',
    limited:'Você fez várias tentativas. Aguarde um pouco antes de tentar novamente.',
    conflict:'Não foi possível reutilizar este pedido. Você pode conversar pelo WhatsApp.'
  };
  const statuses={confirmed:[200],accepted:[202],processing:[202],invalid:[400,413,422],blocked:[403,405,415],limited:[429],unavailable:[503],unknown:[503],conflict:[409]};
  const result=(state,extra={})=>({state,message:messages[state],...extra});
  function createContactClient({enabled=false,send,createId=()=>globalThis.crypto.randomUUID(),timeoutMs=10000}={}){
    if(!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw new Error('Prazo inválido');
    let busy=false,locked=null,previous=null;
    return {async submit(fields){
      if(busy)return result('processing',{locked:true});
      if(locked)return {...locked};
      if(typeof validate!=='function')return result('unavailable');
      const checked=validate(fields||{});
      if(!checked.valid)return result('invalid',{fields:checked.errors});
      if(enabled!==true)return result('preview');
      if(typeof send!=='function')return result('unavailable');
      // Só a memória desta página: não guardar nomes ou telefones em storage, URL ou logs.
      const content=JSON.stringify(checked.value);
      let id;
      try{id=previous?.content===content?previous.id:createId();}catch{return result('unavailable');}
      if(typeof id!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id))return result('unavailable');
      previous={id,content};busy=true;
      const controller=new AbortController();let timer;
      try{
        const response=await Promise.race([
          Promise.resolve().then(()=>send({...checked.value,submissionId:id},{signal:controller.signal})),
          new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('timeout'));},timeoutMs);})
        ]);
        const state=response?.body?.state;
        if(!Object.prototype.hasOwnProperty.call(statuses,state)||!statuses[state].includes(response.status))throw new Error('Resposta desconhecida');
        const next=result(state);
        // Recebimento incerto ou em andamento nunca gera repetição automática ou outro ID.
        if(['accepted','confirmed','processing','unknown','conflict'].includes(state))locked={...next,locked:true};
        return locked?{...locked}:next;
      }catch{
        controller.abort();locked=result('unknown',{locked:true});return {...locked};
      }finally{clearTimeout(timer);busy=false;}
    }};
  }
  // Disponível para a futura rota privada do site. Criar o transporte não faz requisições.
  function createSameOriginTransport({fetchImpl,endpoint='/api/contact'}={}){
    if(endpoint!=='/api/contact')throw new Error('Destino não permitido');
    return async function send(payload,{signal}={}){
      const transport=fetchImpl||globalThis.fetch;
      if(typeof transport!=='function')throw new Error('Transporte indisponível');
      const response=await transport(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal,credentials:'same-origin',redirect:'error',cache:'no-store'});
      const type=response.headers.get('content-type')||'';
      if(!/^application\/json(?:\s*;|$)/i.test(type))throw new Error('Formato não permitido');
      return {status:response.status,body:await response.json()};
    };
  }
  return {createContactClient,createSameOriginTransport};
});
