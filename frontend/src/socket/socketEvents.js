// ---- SOCKET EVENTS ----
var socket = window.BaweSocket.getSocket();

socket.on('agent-question', function(data) {
  setPendingBubble(false);
  removeTemporaryNotices();
  lastAgentQuestionText=window.BaweState.setLastAgentQuestionText(data.question||'');
  if(!isBrandAssetsQuestion(lastAgentQuestionText))clearSelectedLogo();
  appendChatMessage('agent', lastAgentQuestionText, true);
  setUiLocked(false);
});

socket.on('agent-event', function(data) {
  if (!data || (data.type !== 'interview_complete' && data.type !== 'project_finalized')) return;
  setPendingBubble(false);
  activeHostSessionId=window.BaweState.setActiveHostSessionId(null);
  if(data.project){
    updateKnownProject(data.project);
    currentProjectStateView=window.BaweState.setCurrentProjectStateView(projectStateView(data.project));
    renderCentralProjectInfo(data.project);
    renderChatHistory(allProjects);
  }else if(currentProjectId){
    window.BaweApi.getProject(currentProjectId)
    .then(function(result){var project=result.data;if(result.ok){updateKnownProject(project);currentProjectStateView=window.BaweState.setCurrentProjectStateView(projectStateView(project));renderCentralProjectInfo(project);renderChatHistory(allProjects);}})
    .catch(function(err){console.error('Project detail error:',err);});
  }
  if(data.type==='project_finalized' && data.project){
    renderDeliveryPanel(data.project);
    showDeliveryReadyModal(data.project);
  }else{
    appendChatMessage('agent', data.text||'Listo! Ya tenemos la informacion necesaria para preparar tu proyecto. Cuando este terminado, te avisaremos y te daremos un enlace para descargarlo y otro para verlo funcionando.', true);
  }
  setUiLocked(false);
});

socket.on('agent-status', function(data) {
  console.log(data.status);
});

socket.on('host:pending', function(data) {
  setPendingBubble(!!(data && data.pending));
});

socket.on('resume:invalid-command', function(data) {
  setPendingBubble(false);
  removeTemporaryNotices();
  removeLastUserMessage();
  activeHostSessionId=window.BaweState.setActiveHostSessionId(null);
  appendTemporaryAgentNotice((data&&data.message)||'Escribi "continuar" para seguir este proyecto.','continue');
  if(currentProjectStateView){
    currentProjectStateView.project_state='INTERVIEW_NOT_COMPLETED';
    currentProjectStateView.state='INTERVIEW_NOT_COMPLETED';
    currentProjectStateView.execution_state='IDLE';
    currentProjectStateView.canAcceptInput=true;
  }
  setUiLocked(false);
});

socket.on('new-project-blocked', function(data) {
  setPendingBubble(false);
  var project=data&&data.project?updateKnownProject(data.project):null;
  alert((data&&data.message)||newProjectBlockedMessage());
  if(project)openChatProj(project.id,project.name);
  else setUiLocked(false);
});

socket.on('interview-started', function(data) {
  activeHostSessionId=window.BaweState.setActiveHostSessionId(data&&data.sessionId?data.sessionId:null);
  document.getElementById('chat-proj-sub').textContent='Entrevista en progreso';
});

socket.on('host:stopping', function() {
  document.getElementById('chat-proj-sub').textContent='Entrevista en progreso';
  setPendingBubble(true,'stopping');
});

socket.on('host:stopped', function(data) {
  if(data && data.sessionId && activeHostSessionId && data.sessionId!==activeHostSessionId)return;
  if(hostStopping && Date.now()-hostStoppingStartedAt<900){
    var stoppedProjectId=currentProjectId;
    var waitMs=Math.max(0,900-(Date.now()-hostStoppingStartedAt));
    setTimeout(function(){
      activeHostSessionId=window.BaweState.setActiveHostSessionId(null);
      setPendingBubble(false);
      appendChatMessage('agent','Entrevista detenida.\n\nEscrib\u00ed "continuar" para proseguir.',false);
      if(stoppedProjectId){
        window.BaweApi.getProject(stoppedProjectId)
        .then(function(result){var project=result.data;if(result.ok){updateKnownProject(project);currentProjectStateView=window.BaweState.setCurrentProjectStateView(projectStateView(project));setUiLocked(false);}});
      }
    },waitMs);
    return;
  }
  activeHostSessionId=window.BaweState.setActiveHostSessionId(null);
  setPendingBubble(false);
  appendChatMessage('agent','Entrevista detenida.\n\nEscribí "continuar" para proseguir.',false);
  if(currentProjectId){
    window.BaweApi.getProject(currentProjectId)
    .then(function(result){var project=result.data;if(result.ok){updateKnownProject(project);currentProjectStateView=window.BaweState.setCurrentProjectStateView(projectStateView(project));setUiLocked(false);}});
  }
});

socket.on('host:stop-error', function() {
  hostStopping=window.BaweState.setHostStopping(false);
  setPendingBubble(false);
    appendChatMessage('agent','No se pudo detener la generación en este momento.',false);
});

socket.on('auth:expired', function(data) {
  window.BaweState.clearAuthSession();
  token=null;currentUser=null;currentProjectId=null;allProjects=[];
  if(window.BaweSocket){window.BaweSocket.disconnect();}
  document.getElementById('app-dashboard').style.display='none';
  document.getElementById('app-landing').style.display='';
  showAuthMsg(data&&data.message?data.message:'Sesión expirada. Iniciá sesión nuevamente.','error');
});

window.isFirstQuestion = true;
window.currentProjectId = window.BaweState.getCurrentProjectId();

socket.on('project-started', function(data) {
  console.log('[Frontend] Proyecto iniciado:', data);
  activeHostSessionId=window.BaweState.setActiveHostSessionId(data.sessionId||null);
  if(data.projectId){
    currentProjectId=window.BaweState.setCurrentProjectId(data.projectId);
  }
  if(data.project){updateKnownProject(data.project);renderCentralProjectInfo(data.project,{preserveMessages:true});}
  else{
    document.getElementById('chat-proj-name').textContent = data.project_name || data.projectId;
    document.getElementById('chat-proj-sub').textContent = data.project_path || 'Proyecto activo';
  }
  if(data.supportMode){
    document.getElementById('chat-proj-sub').textContent='Soporte';
  }
  if(data.editMode){
    document.getElementById('chat-proj-sub').textContent='Editar';
  }
});

socket.on('support-event', function(data) {
  if(!data)return;
  setPendingBubble(false);
  if(data.type==='support_error'){
    appendChatMessage('agent', data.text||'Ocurrió un error en la sesión de soporte.', false);
  }else{
    appendChatMessage('agent', data.text||'', true);
  }
  setUiLocked(false);
});

socket.on('edit-event', function(data) {
  if(!data)return;
  if(data.type==='edit_finished'){
    // Puede llegar aunque el cliente ya haya cerrado el chat de Cambios (el
    // trabajo termina en background, sin sesión de socket viva) — solo se
    // muestra en el chat si sigue mirando ese mismo proyecto en modo cambios.
    if(window.editSessionActive && currentProjectId===data.projectId){
      document.getElementById('chat-proj-sub').textContent='Finalizado';
      setPendingBubble(false);
      appendChatMessage('agent', data.text||'Tu edición fue aplicada.', false);
      setUiLocked(false);
    }
    return;
  }
  if(!window.editSessionActive || currentProjectId!==data.projectId)return;
  setPendingBubble(false);
  if(data.type==='edit_error'){
    appendChatMessage('agent', data.text||'Ocurrió un error en la sesión de cambios.', false);
    setUiLocked(false);
  }else{
    appendChatMessage('agent', data.text||'', true);
    if(data.queueReady){
      // El trabajo real sigue corriendo en background (Ajuste o Extensión) —
      // dejar el chat bloqueado hasta 'edit_finished', igual que mientras un
      // turno interactivo esta en curso. Sin esto, el cliente puede escribir
      // otro pedido mientras el anterior todavia se esta procesando.
      document.getElementById('chat-proj-sub').textContent='Editando';
      setUiLocked(true);
    }else{
      setUiLocked(false);
    }
  }
});

socket.on('project:updated', function(data) {
  if(!data || !data.id)return;
  var project=updateKnownProject(data)||data;
  if(window.supportSessionActive||window.editSessionActive)return;
  if(!currentProjectId || currentProjectId===data.id){
    currentProjectId=window.BaweState.setCurrentProjectId(data.id);
    renderCentralProjectInfo(project,{preserveMessages:true});
    if(projectState(project)==='PROJECT_FINISHED')renderDeliveryPanel(project);
  }
});

socket.on('project-name-captured', function(data) {
  if(!data)return;
  document.getElementById('chat-proj-name').textContent=data.project_name||data.project_id;
  document.getElementById('chat-proj-sub').textContent=data.project_path||'Proyecto activo';
  loadProjects();
});

socket.on('reply-saved', function(data) {
  console.log('[Frontend] Respuesta guardada:', data);
});

socket.on('error', function(data) {
  console.error('[Frontend] Error del socket:', data);
  activeHostSessionId=window.BaweState.setActiveHostSessionId(null);
  setPendingBubble(false);
  if(data&&data.message) appendChatMessage('agent',data.message,false);
});
