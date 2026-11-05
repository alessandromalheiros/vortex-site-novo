import contactHttp from '../server/contact-http.cjs';

// Prévia de infraestrutura: não lê segredos nem habilita qualquer envio ao CRM.
// A ativação futura exige proteção, reserva persistente e destino conferidos.
const handle = contactHttp.createContactHttpHandler({ enabled: false });

export default { fetch: handle };
