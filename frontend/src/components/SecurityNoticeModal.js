// Aviso de seguridad al entrar a "Proyectos": se pide una sola vez por
// usuario, igual que ScopeDisclaimerModal.js. Bloquea con un checkbox
// obligatorio -- el boton de continuar queda deshabilitado hasta que lo tildan.
function showSecurityNoticeModal(){
  return new Promise(function(resolve){
    var modal=document.getElementById('security-notice-modal');
    var checkbox=document.getElementById('security-notice-checkbox');
    var actionsBox=document.getElementById('security-notice-actions');
    checkbox.checked=false;
    actionsBox.innerHTML='';

    var confirmBtn=document.createElement('button');
    confirmBtn.type='button';
    confirmBtn.className='modal-btn primary';
    confirmBtn.textContent='Entendido';
    confirmBtn.disabled=true;
    confirmBtn.onclick=async function(){
      if(confirmBtn.disabled)return;
      confirmBtn.disabled=true;
      try{
        var result=await window.BaweApi.acceptSecurityNotice();
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

// Punto de entrada usado por appShell.js antes de mostrar "Proyectos". Si el
// usuario ya lo acepto antes (viene en /api/auth/me), no vuelve a mostrar nada.
async function ensureSecurityNoticeAccepted(){
  var user=window.BaweState.getCurrentUser();
  if(user&&user.security_notice_accepted_at)return true;
  return await showSecurityNoticeModal();
}
