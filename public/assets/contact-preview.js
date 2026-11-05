
(()=>{
const form=document.querySelector('#quote-form');if(!form)return;
const validator=window.VortexContactValidation;if(!validator)return;
const clientFactory=window.VortexContactClient;if(!clientFactory)return;
// A prévia permanece desligada: nenhum transporte é configurado ou chamado.
const client=clientFactory.createContactClient({enabled:false});
const summary=document.querySelector('#quote-errors'),result=document.querySelector('#quote-result');
const submitButton=form.querySelector('button[type=submit]');let submitting=false;
const ids=['quote-name','quote-last-name','quote-phone','quote-email'];
function clearErrors(){summary.hidden=true;summary.textContent='';result.hidden=true;result.textContent='';ids.forEach(id=>{document.getElementById(id).removeAttribute('aria-invalid');document.getElementById(id+'-error').textContent='';});}

form.addEventListener('input',()=>{result.hidden=true;result.textContent='';});
form.addEventListener('change',()=>{result.hidden=true;result.textContent='';});
form.addEventListener('submit',async event=>{
event.preventDefault();if(submitting)return;clearErrors();const errors=[];
function invalid(id,message){document.getElementById(id).setAttribute('aria-invalid','true');document.getElementById(id+'-error').textContent=message;errors.push(message);}
const fields={first_name:document.querySelector('#quote-name').value,last_name:document.querySelector('#quote-last-name').value,phone:document.querySelector('#quote-phone').value,email:document.querySelector('#quote-email').value};
const checked=validator.validateContactFields(fields),fieldIds={first_name:'quote-name',last_name:'quote-last-name',phone:'quote-phone',email:'quote-email'};
Object.entries(checked.errors).forEach(([key,message])=>invalid(fieldIds[key],message));
if(errors.length){summary.textContent='Confira os campos indicados: '+errors.join(' ');summary.hidden=false;summary.focus();return;}
submitting=true;submitButton.disabled=true;let outcome;
try{outcome=await client.submit(fields);}
catch{outcome={state:'unknown',locked:true,message:'Não conseguimos confirmar o recebimento. Evite reenviar agora; você pode conversar pelo WhatsApp.'};}
finally{submitting=false;}
submitButton.disabled=outcome.locked===true;
const destination=['preview','accepted','confirmed','processing'].includes(outcome.state)?result:summary;
destination.textContent=outcome.message;destination.hidden=false;destination.focus();
});
submitButton.disabled=false;
})();
