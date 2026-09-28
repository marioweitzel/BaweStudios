// Disclaimer de alcance: se pide una sola vez por usuario, antes de habilitar
// el chat de "Nuevo Proyecto". Bloquea con un checkbox obligatorio -- el
// boton de continuar queda deshabilitado hasta que lo tildan.
function showScopeDisclaimerModal(){
  return new Promise(function(resolve){
    var modal=document.getElementById('scope-disclaimer-modal');
    var checkbox=document.getElementById('scope-disclaimer-checkbox');
    var actionsBox=document.getElementById('scope-disclaimer-actions');
    checkbox.checked=false;
    actionsBox.innerHTML='';

    var confirmBtn=document.createElement('button');
    confirmBtn.type='button';
    confirmBtn.className='modal-btn primary';
    confirmBtn.textContent='Continuar';
    confirmBtn.disabled=true;
    confirmBtn.onclick=async function(){
      if(confirmBtn.disabled)return;
      confirmBtn.disabled=true;
      try{
        var result=await window.BaweApi.acceptScopeDisclaimer();
        if(result.ok&&result.data){
          window.BaweState.setAuthSession(window.BaweState.getToken(),result.data);
        }
      }catch(err){
        console.error(err);
      }
      modal.hidden=true;
      resolve(true);
    };

    var cancelBtn=document.createElement('button');
    cancelBtn.type='button';
    cancelBtn.className='modal-btn secondary';
    cancelBtn.textContent='Cancelar';
    cancelBtn.onclick=function(){
      modal.hidden=true;
      resolve(false);
    };

    checkbox.onchange=function(){
      confirmBtn.disabled=!checkbox.checked;
    };

    actionsBox.appendChild(cancelBtn);
    actionsBox.appendChild(confirmBtn);
    modal.hidden=false;
  });
}

// Punto de entrada usado por appShell.js antes de abrir el chat de "Nuevo
// Proyecto". Si el usuario ya lo acepto antes (viene en /api/auth/me), no
// vuelve a mostrar nada.
async function ensureScopeDisclaimerAccepted(){
  var user=window.BaweState.getCurrentUser();
  if(user&&user.scope_disclaimer_accepted_at)return true;
  return await showScopeDisclaimerModal();
}
