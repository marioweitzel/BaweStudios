async function deleteProject(event,projId,projName){
  if(event&&event.stopPropagation)event.stopPropagation();
  if(deletingProjectId)return;
  var view=currentProjectStateView||projectStateView(null);
  var exec=view.execution_state||'IDLE';
  if(hostPending||exec==='RUNNING'||exec==='STOPPING'){
    alert('No se puede eliminar un proyecto mientras hay una ejecución activa.');
    return;
  }
  var name=projName||'este proyecto';
  var ok=await confirmProjectDeletion(name);
  if(!ok)return;
  deletingProjectId=window.BaweState.setDeletingProjectId(projId);
  setUiLocked(true);
  showDeleteProgress(name);
  try{
    var result=await window.BaweApi.deleteProject(projId);
    var j=result.data;
    if(!result.ok)throw new Error(j.error||'No se pudo eliminar el proyecto.');
    await showDeleteSuccess(name);
    await loadProjects();
    if(currentProjectId===projId){
      navigateAfterActiveProjectDeleted();
    }
    renderProjects(allProjects);
    renderChatHistory(allProjects);
  }catch(err){
    hideDeleteModal();
    alert('Error: '+err.message);
  }finally{
    deletingProjectId=window.BaweState.setDeletingProjectId(null);
    setUiLocked(false);
  }
}
