function hideDeleteModal(){
  var modal=document.getElementById('delete-modal');
  if(modal)modal.hidden=true;
}

function setDeleteModal(title,text,actions,loading){
  document.getElementById('delete-modal-title').textContent=title;
  document.getElementById('delete-modal-text').textContent=text;
  document.getElementById('delete-modal-spinner').className=loading?'modal-spinner':'';
  var box=document.getElementById('delete-modal-actions');
  box.innerHTML='';
  actions.forEach(function(action){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='modal-btn '+(action.kind||'secondary');
    btn.textContent=action.label;
    btn.onclick=action.onClick;
    box.appendChild(btn);
  });
  document.getElementById('delete-modal').hidden=false;
}

function confirmProjectDeletion(projectName){
  return new Promise(function(resolve){
    setDeleteModal(
      'Eliminar proyecto',
      'Esta acción no se puede deshacer. Si confirmás, BaweStudio va a eliminar completamente '+projectName+'. Asegurate de haber descargado correctamente todos los archivos de tu proyecto antes de ejecutar esta acción.',
      [
        {label:'Cancelar',kind:'secondary',onClick:function(){hideDeleteModal();resolve(false);}},
        {label:'Eliminar',kind:'danger',onClick:function(){resolve(true);}}
      ],
      false
    );
  });
}

function showDeleteProgress(projectName){
  setDeleteModal('Eliminando proyecto','BaweStudio está eliminando '+projectName+'. Esto puede tardar unos segundos.',[],true);
}

function showDeleteSuccess(projectName){
  return new Promise(function(resolve){
    setDeleteModal(
      'Eliminación exitosa',
      projectName+' fue eliminado correctamente. Gracias por confiar en BaweStudio y por tu compromiso en ayudarnos a mantener la seguridad de tus datos y tu propiedad intelectual. Seguí disfrutando de la herramienta.',
      [{label:'Cerrar',kind:'primary',onClick:function(){hideDeleteModal();resolve();}}],
      false
    );
  });
}

function showDeleteError(message){
  return new Promise(function(resolve){
    setDeleteModal(
      'No se pudo eliminar',
      message,
      [{label:'Aceptar',kind:'primary',onClick:function(){hideDeleteModal();resolve();}}],
      false
    );
  });
}
