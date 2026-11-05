"use strict";
// Preparação local: não realiza requisições, não contém credenciais.
const {normalizeBrazilPhone,validateContactFields}=require('./contact-validation.cjs');
function buildContactPayload(fields,locationId) {
  if(typeof locationId!=="string"||!/^[A-Za-z0-9]{10,64}$/.test(locationId))throw new Error("Conta de destino não configurada");
  const checked=validateContactFields(fields);
  if(!checked.valid)throw new Error(Object.values(checked.errors)[0]);
  const payload={locationId,firstName:checked.value.first_name,lastName:checked.value.last_name,phone:checked.value.phone};
  if(checked.value.email)payload.email=checked.value.email;
  // Sem name/fullName, tags, DND ou assignedTo: decisões de CRM permanecem separadas.
  return payload;
}
function buildSiteWebhookPayload(fields) {
  // Apenas adaptação de formato. Não envia nem assegura persistência no CRM.
  const mapped=buildContactPayload(fields,"localMappingOnly123");
  const payload={first_name:mapped.firstName,last_name:mapped.lastName,phone:mapped.phone,
    resumo:"Pedido de retorno pelo novo site.\nPágina de origem: Contato e cotação.",
    formulario:"cotacao-completa",pagina_origem:"Contato e cotação",origem:"site"};
  if(mapped.email)payload.email=mapped.email;
  // Não transportar query strings, documentos, IP ou campos arbitrários do navegador.
  return payload;
}
module.exports={normalizeBrazilPhone,buildContactPayload,buildSiteWebhookPayload};
