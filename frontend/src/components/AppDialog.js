// Reemplazo de alert() y prompt() nativos del navegador por un modal propio.
// showAppNotice(texto, titulo) -> Promise (se resuelve al cerrar).
// askAppText(titulo, texto, valorInicial) -> Promise<string|null> (null = cancelo).
// Si llega un aviso mientras hay otro abierto, se encola y se muestra al cerrar el anterior.
var appDialogQueue=[];
var appDialogBusy=false;

function appDialogNext(){
  if(appDialogBusy||!appDialogQueue.length)return;
  appDialogBusy=true;
  var job=appDialogQueue.shift();
  var modal=document.getElementById('app-dialog');
  var input=document.getElementById('app-dialog-input');
  document.getElementById('app-dialog-title').textContent=job.title;
  document.getElementById('app-dialog-text').textContent=job.text;
  input.hidden=!job.withInput;
  input.value=job.withInput?(job.initial||''):'';
  var box=document.getElementById('app-dialog-actions');
  box.innerHTML='';
  function close(value){
    modal.hidden=true;
    input.onkeydown=null;
    appDialogBusy=false;
    job.resolve(value);
    appDialogNext();
  }
  if(job.withInput){
    var cancel=document.createElement('button');
    cancel.type='button';cancel.className='modal-btn secondary';cancel.textContent='Cancelar';
    cancel.onclick=function(){close(null);};
    box.appendChild(cancel);
  }
  var ok=document.createElement('button');
  ok.type='button';ok.className='modal-btn primary';ok.textContent=job.withInput?'Guardar':'Aceptar';
  ok.onclick=function(){close(job.withInput?input.value:undefined);};
  box.appendChild(ok);
  input.onkeydown=function(e){
    if(e.key==='Enter'){e.preventDefault();ok.onclick();}
    else if(e.key==='Escape'){e.preventDefault();close(null);}
  };
  modal.hidden=false;
  (job.withInput?input:ok).focus();
  if(job.withInput)input.select();
}

function showAppNotice(text,title){
  return new Promise(function(resolve){
    appDialogQueue.push({title:title||'Aviso',text:String(text==null?'':text),withInput:false,resolve:resolve});
    appDialogNext();
  });
}

function askAppText(title,text,initial){
  return new Promise(function(resolve){
    appDialogQueue.push({title:title,text:text||'',withInput:true,initial:initial,resolve:resolve});
    appDialogNext();
  });
}
