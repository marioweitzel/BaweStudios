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
      'Esta accion no se puede deshacer. Si confirmas, BaweStudio va a eliminar '+projectName+' y esperara confirmacion del motor.',
      [
        {label:'Cancelar',kind:'secondary',onClick:function(){hideDeleteModal();resolve(false);}},
        {label:'Eliminar',kind:'danger',onClick:function(){resolve(true);}}
      ],
      false
    );
  });
}

function showDeleteProgress(projectName){
  setDeleteModal('Eliminando proyecto','BaweStudio esta eliminando '+projectName+'. Esto puede tardar unos segundos porque debe confirmarlo el motor.',[],true);
}

function showDeleteSuccess(projectName){
  return new Promise(function(resolve){
    setDeleteModal(
      'Eliminacion exitosa',
      projectName+' fue eliminado correctamente.',
      [{label:'Cerrar',kind:'primary',onClick:function(){hideDeleteModal();resolve();}}],
      false
    );
  });
}
