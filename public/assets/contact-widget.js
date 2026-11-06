/* Prévia: um widget e uma chamada principal por página. */
(() => {
  const returnUrl = 'contato-e-cotacao.html#cotacao';
  window.addEventListener('LC_chatWidgetLoaded', () => {
    const api = window.leadConnector?.chatWidget;
    if (typeof api?.localizeWidget === 'function') {
      api.localizeWidget({name:'Nome',phone:'WhatsApp com DDD',message:'Mensagem',send:'Continuar no WhatsApp'});
    }
  });
  document.querySelectorAll('[data-whatsapp-open]').forEach(button => {
    button.addEventListener('click', () => {
      const api = window.leadConnector?.chatWidget;
      if (typeof api?.openWidget === 'function') {
        try { api.openWidget(); return; } catch {}
      }
      // Alternativa funcional se o serviço não carregar; não abre um segundo WhatsApp.
      window.location.assign(returnUrl);
    });
  });
  const loader = document.createElement('script');
  loader.src = 'https://widgets.leadconnectorhq.com/loader.js';
  loader.dataset.resourcesUrl = 'https://widgets.leadconnectorhq.com/chat-widget/loader.js';
  loader.dataset.widgetId = '6aee13015c2083470fb857ee';
  loader.async = true;
  document.body.append(loader);
})();