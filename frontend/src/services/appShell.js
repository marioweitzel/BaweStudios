var API=window.BaweApi.baseUrl;
var token=window.BaweState.getToken();
var currentUser=window.BaweState.getCurrentUser();
var currentProjectId=window.BaweState.getCurrentProjectId();
var sidebarCollapsed=window.BaweState.state.sidebarCollapsed;
var allProjects=window.BaweState.state.allProjects;
var deletingProjectId=window.BaweState.state.deletingProjectId;

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ---- AUTH ----
function showAuthMsg(text,type){var el=document.getElementById('auth-msg');el.textContent=text;el.className='a-msg show '+(type||'error');setTimeout(function(){el.className='a-msg';},4000);}

function setAuthMode(mode){
  var isRegister=mode==='register';
  document.getElementById('form-login').style.display=isRegister?'none':'';
  document.getElementById('form-register').style.display=isRegister?'':'none';
  document.getElementById('auth-switch').textContent=isRegister?'Ya tengo cuenta':'Registrarse';
}
document.getElementById('auth-switch').addEventListener('click',function(){
  setAuthMode(document.getElementById('form-login').style.display==='none'?'login':'register');
});
document.getElementById('form-login').addEventListener('submit',function(e){
  e.preventDefault();
  var email=document.getElementById('login-email').value.trim();
  var password=document.getElementById('login-password').value;
  if(!email||!password){showAuthMsg('CompletÃ¡ todos los campos','error');return;}
  var btn=this.querySelector('.btn-submit');btn.textContent='Procesando...';btn.disabled=true;
  window.BaweApi.login(email,password)
  .then(function(result){var j=result.data;
    btn.disabled=false;btn.innerHTML='Iniciar sesi&oacute;n <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    if(!result.ok){showAuthMsg(j.error||'Credenciales invalidas','error');return;}
    window.BaweState.setAuthSession(j.token,j.user);
    token=window.BaweState.getToken();currentUser=window.BaweState.getCurrentUser();enterDashboard();
  }).catch(function(err){btn.disabled=false;showAuthMsg('Error: '+err.message,'error');});
});

document.getElementById('form-register').addEventListener('submit',function(e){
  e.preventDefault();
  var name=document.getElementById('reg-name').value.trim();
  var email=document.getElementById('reg-email').value.trim();
  var password=document.getElementById('reg-password').value;
  if(!email||!password){showAuthMsg('CompletÃ¡ todos los campos','error');return;}
  if(password.length<8){showAuthMsg('La contraseÃ±a debe tener al menos 8 caracteres','error');return;}
  var btn=this.querySelector('.btn-submit');btn.textContent='Procesando...';btn.disabled=true;
  window.BaweApi.register(name,email,password)
  .then(function(result){var j=result.data;
    btn.disabled=false;btn.innerHTML='Confirmar registro <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    if(!result.ok){showAuthMsg(j.error||'Error al registrar','error');return;}
    window.BaweState.setAuthSession(j.token,j.user);
    token=window.BaweState.getToken();currentUser=window.BaweState.getCurrentUser();enterDashboard();
  }).catch(function(err){btn.disabled=false;showAuthMsg('Error: '+err.message,'error');});
});

document.querySelectorAll('[data-password-toggle]').forEach(function(btn){
  btn.addEventListener('click',function(){
    var input=document.getElementById(btn.getAttribute('data-password-toggle'));
    if(!input)return;
    var visible=input.type==='text';
    input.type=visible?'password':'text';
    btn.setAttribute('aria-label',visible?'Mostrar contraseÃ±a':'Ocultar contraseÃ±a');
  });
});

document.getElementById('logoutBtn').addEventListener('click',function(){
  window.BaweState.clearAuthSession();
  token=null;currentUser=null;currentProjectId=null;allProjects=[];
  if(window.BaweSocket){window.BaweSocket.disconnect();}
  document.getElementById('app-dashboard').style.display='none';
  document.getElementById('app-landing').style.display='';
});

// ---- NAVIGATION ----
document.getElementById('sidebar-toggle').addEventListener('click',function(){
  sidebarCollapsed=!sidebarCollapsed;
  var sb=document.getElementById('sidebar');
  if(sidebarCollapsed){sb.classList.add('collapsed');}else{sb.classList.remove('collapsed');}
});

function setActiveNav(id){
  document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active');});
  var el=document.getElementById(id);if(el)el.classList.add('active');
}

function showDashView(viewId){
  document.querySelectorAll('.d-view').forEach(function(v){v.classList.remove('active');});
  var el=document.getElementById(viewId);if(el)el.classList.add('active');
}

function goToProjects(){
  setActiveNav('nav-projects');
  showDashView('view-projects');
  loadProjects({preserveCurrentView:true});
}

document.getElementById('nav-home').addEventListener('click',function(){setActiveNav('nav-home');showDashView('view-home');});
document.getElementById('nav-chat').addEventListener('click',function(){if(hostPending)return;if(blockNewProjectIfNeeded())return;setActiveNav('nav-chat');showDashView('view-chat');currentProjectId=window.BaweState.clearCurrentProjectId();resetChat();loadChatHistory();});
document.getElementById('nav-projects').addEventListener('click',function(){setActiveNav('nav-projects');showDashView('view-projects');loadProjects({preserveCurrentView:true});});
document.getElementById('proj-go-chat').addEventListener('click',function(){document.getElementById('nav-chat').click();});
document.getElementById('btn-new-chat').addEventListener('click',function(){if(hostPending)return;if(blockNewProjectIfNeeded())return;currentProjectId=window.BaweState.clearCurrentProjectId();resetChat();});

function enterDashboard(){
  currentProjectId=window.BaweState.getCurrentProjectId()||currentProjectId;
  var n=currentUser&&(currentUser.name||currentUser.email)||'';
  document.getElementById('user-name-disp').textContent=n;
  document.getElementById('user-email-disp').textContent=(currentUser&&currentUser.email)||'';
  document.getElementById('user-avatar').textContent=n.substring(0,2).toUpperCase()||'U';
  document.getElementById('app-landing').style.display='none';
  document.getElementById('app-dashboard').style.display='block';
  if(window.BaweSocket){
    window.BaweSocket.setAuthToken(token||'');
    window.BaweSocket.connect();
  }
  setActiveNav('nav-home');showDashView('view-home');
  loadProjects();
}

// ---- PROJECTS ----
function loadProjects(options){
  options=options||{};
  return window.BaweApi.listProjects()
  .then(function(result){var projects=result.data;
    if(!result.ok || !Array.isArray(projects))projects=[];
    allProjects=projects;
    window.BaweState.setProjects(projects);
    renderProjects(projects);
    renderChatHistory(projects);
    if(currentProjectId&&!options.preserveCurrentView){
      var active=projects.find(function(p){return p.id===currentProjectId;});
      if(active){
        setActiveNav('nav-chat');showDashView('view-chat');
        window.isFirstQuestion=false;
        renderCentralProjectInfo(active);
        loadChatHistory();
      }
    }
  }).catch(function(err){console.error('Projects error:',err);});
}

function projectState(p){return (p&&(p.project_state||(p.state_view&&p.state_view.project_state)||p.state))||'NEW_PROJECT';}
function executionState(p){return (p&&(p.execution_state||(p.state_view&&p.state_view.execution_state)))||'IDLE';}
function projectStateView(p){
  var state=projectState(p);
  var exec=executionState(p);
  if(p&&p.execution_session_id)activeHostSessionId=window.BaweState.setActiveHostSessionId(p.execution_session_id);
  if(p&&p.state_view&&p.state_view.project_state&&p.state_view.execution_state)return p.state_view;
  if(exec==='RUNNING')return{project_state:state,execution_state:exec,state:state,headerLabel:'Entrevista en progreso',centralTitle:'Entrevista en progreso',centralText:'Pensando...',inputDisabled:true,showStop:true,canAcceptInput:false};
  if(exec==='STOPPING')return{project_state:state,execution_state:exec,state:state,headerLabel:'Entrevista en progreso',centralTitle:'Deteniendo...',centralText:'Deteniendo...',inputDisabled:true,showStop:true,canAcceptInput:false};
  if(exec==='STOPPED')return{project_state:state,execution_state:exec,state:state,headerLabel:'Entrevista detenida',centralTitle:'Entrevista detenida.',centralText:'Escribi "continuar" para seguir este proyecto.',inputDisabled:false,showStop:false,canAcceptInput:state==='INTERVIEW_NOT_COMPLETED'};
  if(state==='PROJECT_FINISHED')return{project_state:state,execution_state:exec,state:state,headerLabel:'Proyecto finalizado',centralTitle:'Tu proyecto esta listo.',centralText:'Anda a Proyectos para descargar el ZIP o probar la demo.',inputDisabled:true,showStop:false,canAcceptInput:false};
  if(state==='PROJECT_BUILDING')return{project_state:state,execution_state:exec,state:state,headerLabel:'Proyecto en desarrollo',centralTitle:'Su proyecto se esta desarrollando.',centralText:'',inputDisabled:true,showStop:false,canAcceptInput:false};
  if(state==='INTERVIEW_NOT_COMPLETED')return{project_state:state,execution_state:exec,state:state,headerLabel:'Entrevista no completada',centralTitle:'Este proyecto tiene una entrevista no completada.',centralText:'Escribi "continuar" para seguir este proyecto.',inputDisabled:false,showStop:false,canAcceptInput:true};
  return{project_state:'NEW_PROJECT',execution_state:exec,state:'NEW_PROJECT',headerLabel:'Entrevista no iniciada',centralTitle:'Inicia tu nuevo proyecto web',centralText:'Escribi "comenzar" para iniciar el ADN de tu nuevo proyecto o selecciona uno del historial.',inputDisabled:false,showStop:false,canAcceptInput:true};
}
function statusClass(s,p){
  var state=projectState(p);
  var exec=executionState(p);
  if(state==='PROJECT_FINISHED')return 'st-ready';
  if(state==='PROJECT_BUILDING'||exec==='RUNNING'||exec==='STOPPING')return 'st-building';
  if(state==='INTERVIEW_NOT_COMPLETED'&&p&&p.execution_session_id&&!p.requires_continue)return 'st-building';
  if(state==='INTERVIEW_NOT_COMPLETED')return 'st-draft';
  if(s==='ready')return 'st-ready';if(s==='building')return 'st-building';return 'st-draft';
}
function stateLabel(p){
  var state=projectState(p);
  var exec=executionState(p);
  if(exec==='RUNNING'||exec==='STOPPING')return 'EN CURSO';
  if(state==='PROJECT_FINISHED')return 'FINALIZADO';
  if(state==='PROJECT_BUILDING')return 'EN DESARROLLO';
  if(state==='INTERVIEW_NOT_COMPLETED'&&p&&p.execution_session_id&&!p.requires_continue)return 'EN CURSO';
  if(state==='INTERVIEW_NOT_COMPLETED')return 'ENTREVISTA NO COMPLETADA';
  return (p.status||'iniciado').toUpperCase();
}

function navigateAfterActiveProjectDeleted(){
  currentProjectId=window.BaweState.clearCurrentProjectId();
  activeHostSessionId=window.BaweState.setActiveHostSessionId(null);
  currentProjectStateView=window.BaweState.setCurrentProjectStateView(projectStateView(null));
  lastAgentQuestionText=window.BaweState.setLastAgentQuestionText('');
  clearSelectedLogo();
  if(allProjects.length){
    setActiveNav('nav-projects');
    showDashView('view-projects');
  }else{
    resetChat();
    setActiveNav('nav-home');
    showDashView('view-home');
  }
}

function findProjectById(projId){
  return allProjects.find(function(p){return p.id===projId;})||null;
}

function projectDisplayName(project, fallback){
  return (project&&(project.project_name||project.name))||fallback||'proyecto';
}

function downloadProject(projId,projName){
  window.BaweApi.downloadProject(projId)
  .then(function(result){
    if(!result.ok){alert('Error: '+((result.data&&result.data.error)||'No se pudo descargar el ZIP.'));return;}
    var project=findProjectById(projId)||{id:projId,name:projName};
    saveBlob(result.blob,result.filename||((projectDisplayName(project,projName))+'.zip'));
    showDeliveryWarningAfterDownload(project);
  }).catch(function(err){alert('Error: '+err.message);});
}

function previewProject(projId,projName){
  window.BaweApi.previewProject(projId)
  .then(function(result){var j=result.data;
    if(!result.ok){alert('Error: '+(j.error||'unknown'));return;}
    if(j.preview.available&&j.preview.url){showPreviewModal(projId,projName,j.preview.url);}
    else{alert(j.preview.message);}
  }).catch(function(err){alert('Error: '+err.message);});
}

function downloadChatHistoryPdf(projId,projName){
  window.BaweApi.downloadHistoryPdf(projId)
  .then(function(result){
    if(!result.ok){alert('Error: '+((result.data&&result.data.error)||'No se pudo descargar el historial.'));return;}
    saveBlob(result.blob,result.filename||((projName||'proyecto')+'-historial.pdf'));
  }).catch(function(err){alert('Error: '+err.message);});
}

function downloadPasswordForProject(projId){
  var project=findProjectById(projId);
  downloadPasswordFile(project);
}

function showReadyModalForProject(projId){
  var project=findProjectById(projId);
  if(project)showDeliveryReadyModal(project);
}

async function editProject(projId,currentName){
  var newName=prompt('Editar proyecto:',currentName);
  if(!newName||newName===currentName)return;
  window.BaweApi.updateProject(projId,{name:newName})
  .then(function(result){var j=result.data;if(!result.ok){alert('Error: '+(j.error||'unknown'));return;}loadProjects();})
  .catch(function(err){alert('Error: '+err.message);});
}

