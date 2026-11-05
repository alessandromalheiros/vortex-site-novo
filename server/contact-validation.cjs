/* Mesma validação para a prévia no navegador e o futuro receptor. Sem rede. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.VortexContactValidation=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const ddds=new Set('11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'.split(' '));
  function normalizeBrazilPhone(value){
    if(typeof value!=='string'||value.length>25||!/^[+()\d\s.-]+$/.test(value))throw new Error('Informe seu WhatsApp com DDD, com 10 ou 11 dígitos.');
    let digits=value.replace(/\D/g,'');
    if((digits.length===12||digits.length===13)&&digits.startsWith('55'))digits=digits.slice(2);
    if(!/^\d{10,11}$/.test(digits)||!ddds.has(digits.slice(0,2))||/^(.)\1+$/.test(digits))throw new Error('Informe seu WhatsApp com um DDD válido, com 10 ou 11 dígitos.');
    return '+55'+digits;
  }
  function cleanName(value,label){
    if(typeof value!=='string')throw new Error('Informe seu '+label+'.');
    const name=value.normalize('NFC').trim().replace(/\s+/g,' ');
    if(!name||name.length>100||!/[\p{L}]/u.test(name)||/[<>\u0000-\u001f\u007f]/u.test(value))throw new Error('Confira seu '+label+'.');
    return name;
  }
  function validateContactFields(fields){
    const errors={},value={};
    for(const [key,label] of [['first_name','nome'],['last_name','sobrenome']]){
      try{value[key]=cleanName(fields[key],label);}catch(e){errors[key]=e.message;}
    }
    try{value.phone=normalizeBrazilPhone(fields.phone);}catch(e){errors.phone=e.message;}
    const email=fields.email==null?'':fields.email;
    if(typeof email!=='string'||email.length>254||(email.trim()&&!/^[^\s@<>\u0000-\u001f]+@[^\s@<>\u0000-\u001f]+\.[^\s@<>\u0000-\u001f]+$/.test(email.trim())))errors.email='Confira o e-mail informado ou deixe o campo em branco.';
    else if(email.trim())value.email=email.trim();
    return {valid:Object.keys(errors).length===0,errors,value};
  }
  return {normalizeBrazilPhone,validateContactFields};
});
