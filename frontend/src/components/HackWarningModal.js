// Advertencia por uso indebido del chat. El LLM respondio "Intento de hack" y
// BS lo convierte en este modal. Primer intento: advertencia con tilde
// obligatorio y "Aceptar". Segundo intento: aviso de cuenta bloqueada y cierre
// de sesion. No muestra nada interno de BaweStudio.
function showHackWarningModal(){
  return new Promise(function(resolve){
    var modal=document.getElementById('hack-warning-modal');
    var text=document.getElementById('hack-warning-text');
    var checkbox=document.getElementById('hack-warning-checkbox');
    var checkRow=document.getElementById('hack-warning-check-row');
    var actionsBox=document.getElementById('hack-warning-actions');
    text.textContent='Detectamos mensajes que no tienen que ver con tu proyecto. Si volvés a intentarlo, tu cuenta va a ser bloqueada.';
    document.getElementById('hack-warning-title').textContent='Advertencia';
    checkRow.style.display='';
    checkbox.checked=false;
    actionsBox.innerHTML='';

    var acceptBtn=document.createElement('button');
    acceptBtn.type='button';
    acceptBtn.className='modal-btn primary';
    acceptBtn.textContent='Aceptar';
    acceptBtn.disabled=true;
    acceptBtn.onclick=function(){
      if(acceptBtn.disabled)return;
      modal.hidden=true;
      resolve(true);
    };
    checkbox.onchange=function(){
      acceptBtn.disabled=!checkbox.checked;
    };
    actionsBox.appendChild(acceptBtn);
    modal.hidden=false;
  });
}

function showAccountBlockedModal(){
  return new Promise(function(resolve){
    var modal=document.getElementById('hack-warning-modal');
    var text=document.getElementById('hack-warning-text');
    var checkRow=document.getElementById('hack-warning-check-row');
    var actionsBox=document.getElementById('hack-warning-actions');
    text.textContent='Tu cuenta fue bloqueada por uso indebido de BaweStudio. Si creés que es un error, escribinos y lo revisamos.';
    // "hidden" pierde contra el display:flex de la clase de la casilla.
    document.getElementById('hack-warning-title').textContent='Cuenta bloqueada';
    checkRow.style.display='none';
    actionsBox.innerHTML='';

    var acceptBtn=document.createElement('button');
    acceptBtn.type='button';
    acceptBtn.className='modal-btn primary';
    acceptBtn.textContent='Aceptar';
    acceptBtn.onclick=function(){
      modal.hidden=true;
      resolve(true);
    };
    actionsBox.appendChild(acceptBtn);
    modal.hidden=false;
  });
}
