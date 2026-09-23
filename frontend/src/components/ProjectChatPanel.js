function renderDeliveryPanel(project){
  if(!project||projectState(project)!=='PROJECT_FINISHED')return;
  var msgs=document.getElementById('chatMessages');
  if(!msgs||msgs.querySelector('[data-delivery-panel="'+project.id+'"]'))return;
  var safeName=esc(project.project_name||project.name||'proyecto').replace(/'/g,'&#39;');
  var panel=document.createElement('div');
  panel.className='delivery-panel';
  panel.setAttribute('data-delivery-panel',project.id);
  panel.innerHTML='<h3>Tu proyecto esta listo.</h3><p>Gracias por confiar en BaweStudio y por tu tiempo. Para ver la preview y descargar el ZIP, entra en Proyectos y usa las acciones del proyecto finalizado.</p><div class="delivery-actions"><button class="ba ba-p" onclick="goToProjects()">Ir a Proyectos</button><button class="ba ba-g" onclick="downloadProject(\''+project.id+'\',\''+safeName+'\')">Descargar ZIP</button><button class="ba ba-g" onclick="downloadPasswordForProject(\''+project.id+'\')">Guardar password</button><button class="ba ba-g" onclick="previewProject(\''+project.id+'\',\''+safeName+'\')">Ver web</button><button class="ba ba-g" onclick="downloadChatHistoryPdf(\''+project.id+'\',\''+safeName+'\')">Historial PDF</button></div><div class="delivery-note">'+esc(project.deliveryWarning||'Conserva el password del ZIP y no lo compartas con personas no autorizadas.')+'</div><div class="delivery-rating-inline"><span>Valoracion</span><button>1</button><button>2</button><button>3</button><button>4</button><button>5</button></div>';
  msgs.appendChild(panel);
  msgs.scrollTop=msgs.scrollHeight;
}

function renderCentralProjectInfo(p,options){
  options=options||{};
  var view=projectStateView(p);
  if(hostStopping && view.execution_state!=='RUNNING' && view.execution_state!=='STOPPING' && Date.now()-hostStoppingStartedAt<900){
    var waitMs=Math.max(0,900-(Date.now()-hostStoppingStartedAt));
    setTimeout(function(){renderCentralProjectInfo(p,options);},waitMs);
    return;
  }
  currentProjectStateView=window.BaweState.setCurrentProjectStateView(view);
  document.getElementById('chat-proj-name').textContent=(p&&p.project_name)||(p&&p.name)||(p&&p.id)||'Nueva sesión de Diseño ADN';
  document.getElementById('chat-proj-sub').textContent=view.headerLabel;
  var msgs=document.getElementById('chatMessages');
  var hasVisibleMessages=msgs && !!msgs.querySelector('.mw');
  if(hasVisibleMessages){
    var empty=msgs.querySelector('.ch-empty');
    if(empty)empty.remove();
  }else if(!options.preserveMessages){
    if(view.project_state==='PROJECT_FINISHED'&&p){
      msgs.innerHTML='';
      renderDeliveryPanel(p);
    }else{
      msgs.innerHTML='<div class="ch-empty" id="chat-empty"><div class="ch-empty-ico"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg></div><h3>'+esc(view.centralTitle)+'</h3><p>'+esc(view.centralText||'')+'</p></div>';
    }
  }
  if(view.execution_state==='RUNNING'||view.execution_state==='STOPPING'){
    setPendingBubble(true,view.execution_state==='STOPPING'?'stopping':null);
  }else{
    hostPending=window.BaweState.setHostPending(false);
    hostStopping=window.BaweState.setHostStopping(false);
    renderSendButton();
    setUiLocked(false);
  }
  if(view.project_state==='PROJECT_FINISHED'&&p&&!window.supportSessionActive&&!window.editSessionActive)renderDeliveryPanel(p);
}
