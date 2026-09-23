function renderProjects(projects){
  var grid=document.getElementById('p-grid');
  var empty=document.getElementById('p-empty');
  if(!projects.length){empty.style.display='';grid.innerHTML='';return;}
  empty.style.display='none';
  grid.innerHTML=projects.map(function(p){
    var cid=p.id.replace(/'/g,'&#39;').replace(/\\/g,'');
    var cn=p.name.replace(/'/g,'&#39;').replace(/"/g,'&quot;');
    var fallbackDesc=p.createdAt?('Iniciado el '+new Date(p.createdAt).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'})):'';
    var isFinished=projectState(p)==='PROJECT_FINISHED';
    var isBusy=executionState(p)==='RUNNING'||executionState(p)==='STOPPING';
    var supportEnabled=isFinished&&!isBusy;
    var supportTitle=supportEnabled?'Soporte':(isBusy?'Esperá a que termine la sesión activa':'Disponible cuando el proyecto esté listo');
    return '<div class="p-card">'
      +'<span class="p-status '+statusClass(p.status,p)+'">'+stateLabel(p)+'</span>'
      +'<div class="p-name-row"><span class="p-name">'+esc(p.name)+'</span><button class="p-edit-ico" onclick="editProject(\''+cid+'\',\''+cn+'\')" aria-label="Editar nombre del proyecto" title="Editar nombre"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></div>'
      +(p.description||fallbackDesc?'<div class="p-desc">'+(p.description?esc(p.description):fallbackDesc)+'</div>':'')
      +'<div class="p-actions">'
      +'<button class="ba ba-p" onclick="openChatProj(\''+cid+'\',\''+cn+'\')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Chat</button>'
      +'<button class="ba ba-g" onclick="downloadProject(\''+cid+'\',\''+cn+'\')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>ZIP</button>'
      +'<button class="ba ba-g" onclick="previewProject(\''+cid+'\',\''+cn+'\')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>Preview</button>'
      +'<button class="ba ba-g" onclick="downloadChatHistoryPdf(\''+cid+'\',\''+cn+'\')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>Historial PDF</button>'
      +'<button class="ba ba-c" '+(supportEnabled?'':'disabled')+' title="'+supportTitle+'" onclick="openSupportSession(\''+cid+'\',\''+cn+'\')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Soporte</button>'
      +'<button class="ba ba-danger" onclick="deleteProject(event,\''+cid+'\',\''+cn+'\')">Eliminar proyecto</button>'
      +'</div></div>';
  }).join('');
  setUiLocked(hostPending);
}
