async function doSendMsg(msg){
  if(hostPending)return;
  var activeProject=currentProjectId?allProjects.find(function(p){return p.id===currentProjectId;}):null;
  if(activeProject&&activeProject.requires_continue&&msg.trim().toLowerCase()!=='continuar'){
    removeTemporaryNotices();
    appendTemporaryAgentNotice('Para seguir este proyecto escribi "continuar".','continue');
    return;
  }
  if(!currentProjectId && msg.trim().toLowerCase()==='continuar'){
    appendChatMessage('agent','Selecciona un proyecto de tu historial para continuar.',false);
    return;
  }

  if (currentProjectId && msg.trim().toLowerCase()==='continuar') {
    removeTemporaryNotices();
    setPendingBubble(true);
    console.log('[Frontend] Emitiendo continuar para proyecto activo:', currentProjectId);
    window.BaweSocket.emit('chat:message', { message: msg, projectId: currentProjectId });
    window.isFirstQuestion = false;
  } else if (window.isFirstQuestion && !currentProjectId) {
    if(blockNewProjectIfNeeded())return;
    setPendingBubble(true);
    console.log('[Frontend] Emitiendo start-project');
    document.getElementById('chat-proj-sub').textContent='Entrevista en progreso';
    window.BaweSocket.emit('start-project', { initialMessage: msg, projectFamily: 'web' });
    window.isFirstQuestion = false; // siguiente mensaje ya va por user-reply
  } else if (activeHostSessionId) {
    var attachment=await uploadSelectedLogo();
    appendChatMessage('user', msg, false, attachment);
    setPendingBubble(true);
    console.log('[Frontend] Emitiendo user-reply:', { reply: msg });
    window.BaweSocket.emit('user-reply', { reply: msg, projectId: currentProjectId, attachment: attachment });
  } else {
    var chatAttachment=await uploadSelectedLogo();
    appendChatMessage('user', msg, false, chatAttachment);
    setPendingBubble(true);
    console.log('[Frontend] Emitiendo chat:message para proyecto activo:', currentProjectId);
    window.BaweSocket.emit('chat:message', { message: msg, projectId: currentProjectId, attachment: chatAttachment });
  }
}

async function sendChatMsg(){
  var view=currentProjectStateView||projectStateView(null);
  var exec=view.execution_state||'IDLE';
  if(hostPending||exec==='RUNNING'||exec==='STOPPING'){
    requestStop();
    return;
  }
  var input=document.getElementById('chatInput');
  if(input.disabled)return;
  var msg=input.value.trim();
  if(!msg)return;
  input.value='';
  try{
    await doSendMsg(msg);
  }catch(err){
    input.value=msg;
    setPendingBubble(false);
    appendChatMessage('agent','No se pudo adjuntar la imagen. Intenta nuevamente.',false);
    console.error(err);
  }
}

document.getElementById('chatSendBtn').addEventListener('click',function(){sendChatMsg();});
document.getElementById('chatInput').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(!hostPending)sendChatMsg();}});
