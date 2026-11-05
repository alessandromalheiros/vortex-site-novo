/* Navegação compartilhada: manter fechamento e foco coerentes em celular e computador. */
(()=>{
  const menu=document.querySelector('.menu'),nav=document.querySelector('#nav');
  if(!menu||!nav)return;
  const mobile=matchMedia('(max-width:850px)');
  const closeGroups=()=>nav.querySelectorAll('details[open]').forEach(group=>{group.open=false;});
  function closeMenu(returnFocus=false){
    menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu');nav.classList.remove('open');closeGroups();
    if(returnFocus&&mobile.matches)menu.focus();
  }
  menu.addEventListener('click',event=>{
    if(menu.getAttribute('aria-expanded')==='true')closeMenu();
    else{
      menu.setAttribute('aria-expanded','true');menu.setAttribute('aria-label','Fechar menu');nav.classList.add('open');
      // Ativação por teclado/leitor: começar pelo painel recém-aberto, sem pular seus itens.
      if(event.detail===0&&mobile.matches)nav.querySelector('summary,a[href]')?.focus();
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    if(menu.getAttribute('aria-expanded')==='true'){closeMenu(true);return;}
    const focusedGroup=document.activeElement.closest?.('nav details[open]');
    closeGroups();
    focusedGroup?.querySelector('summary')?.focus();
  });
  nav.querySelectorAll('details').forEach(group=>group.addEventListener('toggle',()=>{
    if(group.open)nav.querySelectorAll('details').forEach(other=>{if(other!==group)other.open=false;});
  }));
  document.addEventListener('click',event=>{
    if(!nav.contains(event.target)&&!menu.contains(event.target)){
      closeMenu(nav.contains(document.activeElement));
    }
  });
  nav.addEventListener('click',event=>{if(event.target.closest('a[href]'))closeMenu();});
  mobile.addEventListener('change',()=>closeMenu());
})();
