function saveBlob(blob, filename){
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download=filename||'descarga';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function(){URL.revokeObjectURL(url);},1000);
}

function saveTextFile(text, filename){
  saveBlob(new Blob([text],{type:'text/plain;charset=utf-8'}),filename);
}

function hideDeliveryModal(){
  var modal=document.getElementById('delivery-modal');
  if(modal)modal.hidden=true;
}

function setDeliveryModal(title,text,actions,project,showRating){
  document.getElementById('delivery-modal-title').textContent=title;
  document.getElementById('delivery-modal-text').textContent=text;
  var passBox=document.getElementById('delivery-modal-password');
  var password=project&&project.zipPassword;
  if(password){
    passBox.hidden=false;
    passBox.innerHTML='<span>Password del ZIP</span><code>'+esc(password)+'</code><small>No compartas esta contrasena con personas no autorizadas.</small>';
  }else{
    passBox.hidden=true;
    passBox.innerHTML='';
  }
  var rating=document.getElementById('delivery-modal-rating');
  rating.hidden=!showRating;
  rating.querySelectorAll('button').forEach(function(btn){
    btn.onclick=function(){
      rating.querySelectorAll('button').forEach(function(other){other.classList.remove('active');});
      btn.classList.add('active');
    };
  });
  var box=document.getElementById('delivery-modal-actions');
  box.innerHTML='';
  actions.forEach(function(action){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='modal-btn '+(action.kind||'secondary');
    btn.textContent=action.label;
    btn.onclick=action.onClick;
    box.appendChild(btn);
  });
  document.getElementById('delivery-modal').hidden=false;
}

function showDeliveryReadyModal(project){
  var name=(project&&project.project_name)||(project&&project.name)||'tu proyecto';
  var warning=(project&&project.deliveryWarning)||'Conserva el password del ZIP y no lo compartas con personas no autorizadas.';
  setDeliveryModal(
    'Proyecto listo',
    'Gracias por confiar en BaweStudio y por tu tiempo durante la entrevista. Para ver la preview y descargar el ZIP tambien podes entrar en Proyectos y usar las acciones del proyecto finalizado.',
    [
      {label:'Descargar ZIP',kind:'primary',onClick:function(){downloadProject(project.id,name);}},
      {label:'Guardar password',kind:'secondary',onClick:function(){downloadPasswordFile(project);}},
      {label:'Ver web',kind:'secondary',onClick:function(){previewProject(project.id,name);}},
      {label:'Ir a Proyectos',kind:'secondary',onClick:function(){hideDeliveryModal();goToProjects();}},
      {label:'Cerrar',kind:'secondary',onClick:function(){hideDeliveryModal();}}
    ],
    Object.assign({},project,{deliveryWarning:warning}),
    true
  );
}

function showDeliveryWarningAfterDownload(project){
  var name=(project&&project.project_name)||(project&&project.name)||'tu proyecto';
  setDeliveryModal(
    'Descarga iniciada',
    'El ZIP de '+name+' esta cifrado. Conserva el password en un lugar seguro y no lo compartas con personas no autorizadas.',
    [
      {label:'Guardar password',kind:'primary',onClick:function(){downloadPasswordFile(project);}},
      {label:'Cerrar',kind:'secondary',onClick:function(){hideDeliveryModal();}}
    ],
    project,
    false
  );
}

function downloadPasswordFile(project){
  if(!project||!project.zipPassword){alert('Password no disponible. Actualiza el proyecto e intenta nuevamente.');return;}
  var name=(project.project_name||project.name||'proyecto').replace(/[^\w.-]+/g,'_');
  var text='ZIP_PASSWORD='+project.zipPassword+'\n\n'+(project.deliveryWarning||'No compartas esta contrasena con personas no autorizadas.')+'\n';
  saveTextFile(text,name+'-password.txt');
}
