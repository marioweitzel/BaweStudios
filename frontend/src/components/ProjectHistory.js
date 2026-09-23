function renderChatHistory(projects){
  var el=document.getElementById('chat-hist-items');
  if(!projects.length){el.innerHTML='<div style="font-size:.75rem;color:#6b7280;padding:12px 8px;text-align:center;font-style:italic">Sin proyectos creados</div>';return;}
  el.innerHTML=projects.map(function(p){
    var state=projectState(p);
    var exec=executionState(p);
    var bc=state==='PROJECT_FINISHED'?'hb-r':(state==='PROJECT_BUILDING'||exec==='RUNNING'||exec==='STOPPING')?'hb-b':'hb-d';
    var active=currentProjectId===p.id?' active':'';
    var cid=p.id.replace(/'/g,'&#39;');
    var cn=p.name.replace(/'/g,'&#39;').replace(/"/g,'&quot;');
    return '<button class="hist-item'+active+'" onclick="openChatProj(\''+cid+'\',\''+cn+'\')">'
      +'<div class="hist-item-name"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span class="hist-item-title">'+esc(p.name)+'</span><span class="hist-delete" role="button" aria-label="Eliminar proyecto" onclick="deleteProject(event,\''+cid+'\',\''+cn+'\')">×</span></div>'
      +'<div class="hist-item-meta"><span class="hbadge '+bc+'">'+stateLabel(p)+'</span></div>'
      +'</button>';
  }).join('');
  setUiLocked(hostPending);
}
