function requestStop(){
  var view=currentProjectStateView||projectStateView(null);
  var exec=view.execution_state||'IDLE';
  if((!hostPending&&exec!=='RUNNING'&&exec!=='STOPPING') || hostStopping)return;
  if(!activeHostSessionId){
    appendChatMessage('agent','No se pudo detener la generacion en este momento.',false);
    setPendingBubble(false);
    return;
  }
  hostStoppingStartedAt=Date.now();
  hostStopping=window.BaweState.setHostStopping(true);
  setPendingBubble(true,'stopping');
  window.BaweSocket.emit('host:stop', {
    sessionId: activeHostSessionId,
    projectId: window.currentProjectId
  });
}
