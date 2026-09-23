// ---- CHAT ----
var socket = window.BaweSocket.getSocket();
var hostPending = window.BaweState.state.hostPending;
var hostStopping = window.BaweState.state.hostStopping;
var activeHostSessionId = window.BaweState.state.activeHostSessionId;
var currentProjectStateView = window.BaweState.state.currentProjectStateView;
var pendingTimer = null;
var pendingStep = 0;
var hostStoppingStartedAt = 0;
var sendButtonHtml = document.getElementById('chatSendBtn').innerHTML;
var selectedLogoFile = window.BaweState.state.selectedLogoFile;
var lastAgentQuestionText = window.BaweState.state.lastAgentQuestionText;

function normalizeQuestionText(text){
  return String(text||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[¿?]/g,'')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
}

function isBrandAssetsQuestion(text){
  var normalized=normalizeQuestionText(text);
  var base='ya tenes algun logo, color o estilo visual que quieras usar, o preferis definirlo desde cero';
  var legacy='ya tenes logo, manual de marca o colores definidos';
  var asksIdentity=normalized.indexOf(base)===0||normalized.indexOf(legacy)===0;
  var asksUpload=normalized.indexOf('clic en +')!==-1||normalized.indexOf('subir logo')!==-1||normalized.indexOf('adjuntar logo')!==-1;
  var hasIdentityTerms=normalized.indexOf('logo')!==-1 && (
    normalized.indexOf('color')!==-1 ||
    normalized.indexOf('estilo visual')!==-1 ||
    normalized.indexOf('identidad')!==-1 ||
    normalized.indexOf('manual de marca')!==-1
  );
  return asksIdentity || (asksUpload && hasIdentityTerms);
}

function sanitizeHtml(html){
  var template=document.createElement('template');
  template.innerHTML=html;
  var allowed={P:1,BR:1,STRONG:1,EM:1,UL:1,OL:1,LI:1,PRE:1,CODE:1,TABLE:1,THEAD:1,TBODY:1,TR:1,TH:1,TD:1,HR:1};
  Array.prototype.slice.call(template.content.querySelectorAll('*')).forEach(function(node){
    if(!allowed[node.tagName]){
      node.replaceWith(document.createTextNode(node.textContent||''));
      return;
    }
    Array.prototype.slice.call(node.attributes).forEach(function(attr){node.removeAttribute(attr.name);});
  });
  return template.innerHTML;
}

function renderMarkdown(text){
  var source=String(text||'').replace(/\r\n/g,'\n');
  var codeBlocks=[];
  source=source.replace(/```[\w-]*\n([\s\S]*?)```/g,function(_,code){
    var idx=codeBlocks.push('<pre><code>'+esc(code.replace(/\n$/,''))+'</code></pre>')-1;
    return '\n@@CODE'+idx+'@@\n';
  });
  var lines=source.split('\n');
  var html='',i=0;
  function inline(s){
    return esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
  }
  function splitTableRow(row){
    var clean=String(row||'').trim();
    if(clean.charAt(0)==='|')clean=clean.slice(1);
    if(clean.charAt(clean.length-1)==='|')clean=clean.slice(0,-1);
    return clean.split('|').map(function(cell){return cell.trim();});
  }
  function isTableRow(row){
    return /\|/.test(row||'') && splitTableRow(row).length>=2;
  }
  function isTableSeparator(row){
    if(!isTableRow(row))return false;
    return splitTableRow(row).every(function(cell){return /^:?-{3,}:?$/.test(cell);});
  }
  function isTableAt(pos){
    return pos+1<lines.length && isTableRow(lines[pos]) && isTableSeparator(lines[pos+1]);
  }
  function isPipeOptionsLine(row){
    var clean=String(row||'').trim();
    if(!/\s\|\s/.test(clean))return false;
    if(clean.charAt(0)==='|'||clean.charAt(clean.length-1)==='|')return false;
    var parts=clean.split(/\s+\|\s+/).map(function(part){return part.trim();}).filter(Boolean);
    return parts.length>=3 && parts.every(function(part){return part.length<=120;});
  }
  function renderPipeOptions(row){
    var parts=String(row||'').trim().split(/\s+\|\s+/).map(function(part){return part.trim();}).filter(Boolean);
    return '<ul>'+parts.map(function(part){return '<li>'+inline(part)+'</li>';}).join('')+'</ul>';
  }
  while(i<lines.length){
    var line=lines[i];
    var codeMatch=line.match(/^@@CODE(\d+)@@$/);
    if(codeMatch){html+=codeBlocks[Number(codeMatch[1])]||'';i++;continue;}
    if(!line.trim()){i++;continue;}
    if(/^---+$/.test(line.trim())){html+='<hr>';i++;continue;}
    if(isTableAt(i)){
      var headers=splitTableRow(lines[i]);
      var columnCount=headers.length;
      i+=2;
      html+='<table><thead><tr>'+headers.map(function(h){return '<th>'+inline(h.trim())+'</th>';}).join('')+'</tr></thead><tbody>';
      while(i<lines.length && isTableRow(lines[i]) && !isTableSeparator(lines[i])){
        var cells=splitTableRow(lines[i]);
        while(cells.length<columnCount)cells.push('');
        if(cells.length>columnCount)cells=cells.slice(0,columnCount-1).concat([cells.slice(columnCount-1).join(' | ')]);
        html+='<tr>'+cells.map(function(c){return '<td>'+inline(c.trim())+'</td>';}).join('')+'</tr>';
        i++;
      }
      html+='</tbody></table>';
      continue;
    }
    if(isPipeOptionsLine(line)){
      html+=renderPipeOptions(line);
      i++;
      continue;
    }
    if(/^\s*[-*]\s+/.test(line)){
      html+='<ul>';
      while(i<lines.length && /^\s*[-*]\s+/.test(lines[i])){html+='<li>'+inline(lines[i].replace(/^\s*[-*]\s+/,''))+'</li>';i++;}
      html+='</ul>';
      continue;
    }
    if(/^\s*\d+\.\s+/.test(line)){
      html+='<ol>';
      while(i<lines.length && /^\s*\d+\.\s+/.test(lines[i])){html+='<li>'+inline(lines[i].replace(/^\s*\d+\.\s+/,''))+'</li>';i++;}
      html+='</ol>';
      continue;
    }
    var paragraph=[];
    while(i<lines.length && lines[i].trim() && !isTableAt(i) && !isPipeOptionsLine(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i]) && !/^@@CODE(\d+)@@$/.test(lines[i]) && !/^---+$/.test(lines[i].trim())){
      paragraph.push(lines[i]);i++;
    }
    html+='<p>'+inline(paragraph.join('\n')).replace(/\n/g,'<br>')+'</p>';
  }
  return sanitizeHtml(html);
}

function removePendingBubble(){
  var el=document.getElementById('chatMessages');
  var loadEl=el.querySelector('.bub-ld')?.parentNode;
  if(loadEl) el.removeChild(loadEl);
  if(pendingTimer){clearInterval(pendingTimer);pendingTimer=null;}
}

function setUiLocked(locked){
  var input=document.getElementById('chatInput');
  var send=document.getElementById('chatSendBtn');
  var attach=document.getElementById('chatAttachBtn');
  var newChat=document.getElementById('btn-new-chat');
  var view=currentProjectStateView||projectStateView(null);
  var exec=view.execution_state||'IDLE';
  var state=view.project_state||view.state||'NEW_PROJECT';
  var executionLocked=exec==='RUNNING'||exec==='STOPPING'||!!locked;
  var acceptsInput=window.supportSessionActive||window.editSessionActive||(view.canAcceptInput!==false&&(state==='NEW_PROJECT'||state==='INTERVIEW_NOT_COMPLETED'));
  if(input) input.disabled=executionLocked||!acceptsInput;
  if(input && executionLocked){
    input.placeholder='';
  }else if(input){
    if(!acceptsInput){
      input.placeholder=view.centralText||view.headerLabel||'';
    }else if(activeHostSessionId){
      input.placeholder='Escribí tu respuesta...';
    }else if(state==='NEW_PROJECT'||!currentProjectId){
      input.placeholder='Escribí "comenzar"';
    }else if(state==='INTERVIEW_NOT_COMPLETED' && !activeHostSessionId){
      input.placeholder='Escribí "continuar"';
    }else{
      input.placeholder='Escribí tu respuesta...';
    }
  }
  if(newChat) newChat.disabled=!!locked;
  if(attach) attach.disabled=executionLocked||!currentProjectId||!acceptsInput||(!window.editSessionActive&&!isBrandAssetsQuestion(lastAgentQuestionText));
  document.querySelectorAll('.hist-item,.p-card .ba,.nav-btn').forEach(function(btn){
    if(btn.id==='nav-home' || btn.id==='nav-projects' || btn.id==='logoutBtn'){
      btn.disabled=false;
      return;
    }
    btn.disabled=!!executionLocked;
  });
  if(send) send.disabled=!!((hostStopping && executionLocked)||(!executionLocked&&!acceptsInput));
}

function unfinishedProject(p){
  var state=projectState(p);
  return state==='INTERVIEW_NOT_COMPLETED'||state==='PROJECT_BUILDING';
}

function firstUnfinishedProject(exceptProjectId){
  return allProjects.find(function(p){return p.id!==exceptProjectId && unfinishedProject(p);})||null;
}

function newProjectBlockedMessage(){
  return 'Tenes un proyecto sin terminar.\n\nPodes volver a ese proyecto para descargar el hilo antes de eliminarlo si ya no lo necesitas. Para crear un proyecto nuevo, primero tenes que finalizar o eliminar el proyecto actual.';
}

function blockNewProjectIfNeeded(){
  var blocking=firstUnfinishedProject(null);
  if(!blocking)return false;
  alert(newProjectBlockedMessage());
  openChatProj(blocking.id,blocking.name);
  return true;
}

function renderSendButton(){
  var btn=document.getElementById('chatSendBtn');
  if(!btn)return;
  var view=currentProjectStateView||projectStateView(null);
  var exec=view.execution_state||'IDLE';
  var running=hostPending||exec==='RUNNING'||exec==='STOPPING';
  if(running){
    btn.classList.add('btn-stop');
    btn.setAttribute('aria-label','Detener generación');
    btn.innerHTML='<span>Stop</span>';
    btn.disabled=!!hostStopping||exec==='STOPPING';
  }else{
    btn.classList.remove('btn-stop');
    btn.setAttribute('aria-label','Enviar mensaje');
    btn.innerHTML=sendButtonHtml;
    btn.disabled=!window.supportSessionActive&&!window.editSessionActive&&!!(view.canAcceptInput===false);
  }
}

function setPendingBubble(pending,mode){
  if(!pending && hostStopping && Date.now()-hostStoppingStartedAt<900){
    var waitMs=Math.max(0,900-(Date.now()-hostStoppingStartedAt));
    setTimeout(function(){setPendingBubble(false);},waitMs);
    return;
  }
  hostPending=window.BaweState.setHostPending(!!pending);
  if(currentProjectStateView){
    currentProjectStateView.execution_state=hostPending?(mode==='stopping'?'STOPPING':'RUNNING'):'IDLE';
    currentProjectStateView.inputDisabled=hostPending;
    currentProjectStateView.showStop=hostPending;
  }
  if(!hostPending){
    hostStopping=window.BaweState.setHostStopping(false);
    removePendingBubble();
    renderSendButton();
    setUiLocked(false);
    return;
  }
  if(mode==='stopping'){
    if(!hostStoppingStartedAt || Date.now()-hostStoppingStartedAt>5000) hostStoppingStartedAt=Date.now();
    hostStopping=window.BaweState.setHostStopping(true);
  }
  renderSendButton();
  setUiLocked(true);
  var el=document.getElementById('chatMessages');
  var empty=el.querySelector('.ch-empty');if(empty)empty.remove();
  var bubble=el.querySelector('.bub-ld');
  if(!bubble){
    var loadEl=document.createElement('div');loadEl.className='mw';loadEl.innerHTML='<div class="m-av av-a">BAWE</div><div class="m-bub bub-ld">Pensando.</div>';
    el.appendChild(loadEl);
    bubble=loadEl.querySelector('.bub-ld');
  }
  pendingStep=0;
  var label=hostStopping?'Deteniendo':'Pensando';
  bubble.textContent=label+'.';
  if(pendingTimer) clearInterval(pendingTimer);
  pendingTimer=setInterval(function(){
    if(!hostPending){removePendingBubble();return;}
    pendingStep=(pendingStep+1)%3;
    var currentLabel=hostStopping?'Deteniendo':'Pensando';
    bubble.textContent=currentLabel+'.'.repeat(pendingStep+1);
  },500);
  el.scrollTop=el.scrollHeight;
}

function updateAttachButton(){
  var btn=document.getElementById('chatAttachBtn');
  if(!btn)return;
  btn.classList.toggle('has-file',!!selectedLogoFile);
  var label=window.editSessionActive?'imagen':'logo';
  btn.title=selectedLogoFile?('Adjunto: '+selectedLogoFile.name):('Adjuntar '+label);
}

function clearSelectedLogo(){
  selectedLogoFile=window.BaweState.setSelectedLogoFile(null);
  var input=document.getElementById('chatLogoInput');
  if(input)input.value='';
  updateAttachButton();
}

async function uploadSelectedLogo(){
  if(!selectedLogoFile)return null;
  if(!currentProjectId)throw new Error('No hay proyecto activo para guardar el archivo.');
  var file=selectedLogoFile;
  var result=window.editSessionActive
    ?await window.BaweApi.uploadEditAttachment(currentProjectId,file)
    :await window.BaweApi.uploadProjectLogo(currentProjectId,file);
  var payload=result.data;
  if(!result.ok)throw new Error(payload.error||'No se pudo guardar el archivo.');
  clearSelectedLogo();
  var attachment=payload.attachment||null;
  if(attachment&&attachment.dataUrl)delete attachment.dataUrl;
  return attachment;
}

function updateKnownProject(updated){
  if(!updated||!updated.id)return;
  var found=false;
  var mergedProject=updated;
  allProjects=allProjects.map(function(p){
    if(p.id!==updated.id)return p;
    found=true;
    var currentMessages=Array.isArray(p.messages)?p.messages:[];
    var incomingMessages=Array.isArray(updated.messages)?updated.messages:[];
    var messages=incomingMessages.length>=currentMessages.length?incomingMessages:currentMessages;
    mergedProject=Object.assign({},p,updated,{messages:messages});
    return mergedProject;
  });
  if(!found)allProjects.push(mergedProject);
  window.BaweState.setProjects(allProjects);
  renderProjects(allProjects);
  renderChatHistory(allProjects);
  return mergedProject;
}

function resetChat(){
  if(hostPending)return;
  currentProjectId=window.BaweState.clearCurrentProjectId();
  currentProjectStateView=window.BaweState.setCurrentProjectStateView(projectStateView(null));
  activeHostSessionId=window.BaweState.setActiveHostSessionId(null);
  lastAgentQuestionText=window.BaweState.setLastAgentQuestionText('');
  clearSelectedLogo();
  window.isFirstQuestion=true; // próximo mensaje siempre inicia nuevo start-project
  document.getElementById('chat-proj-name').textContent='Nueva sesión de Diseño ADN';

  document.getElementById('chat-proj-sub').textContent='Estableciendo parametros de arquitectura';
  var msgs=document.getElementById('chatMessages');
  msgs.innerHTML='<div class="ch-empty" id="chat-empty"><div class="ch-empty-ico"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg></div><h3>Iniciá tu nuevo proyecto web</h3><p>Escribí <code>"comenzar"</code> para iniciar el ADN de tu nuevo proyecto o seleccioná uno del historial.</p></div>';
  setUiLocked(false);
  document.querySelectorAll('.hist-item').forEach(function(i){i.classList.remove('active');});
}

window.supportSessionActive=false;
window.editSessionActive=false;

function openSupportSession(pid,pname){
  if(hostPending)return;
  clearSelectedLogo();
  window.supportSessionActive=true;
  window.editSessionActive=false;
  currentProjectId=window.BaweState.setCurrentProjectId(pid);
  window.isFirstQuestion=false;
  document.querySelectorAll('.hist-item').forEach(function(i){i.classList.remove('active');});
  setActiveNav('nav-chat');showDashView('view-chat');
  document.getElementById('chat-proj-name').textContent=pname;
  document.getElementById('chat-proj-sub').textContent='Soporte';
  var msgs=document.getElementById('chatMessages');
  if(msgs)msgs.innerHTML='';
  setPendingBubble(true);
  setUiLocked(true);
  window.BaweSocket.emit('start-support',{projectId:pid});
}

function openEditSession(pid,pname){
  if(hostPending)return;
  clearSelectedLogo();
  window.editSessionActive=true;
  window.supportSessionActive=false;
  currentProjectId=window.BaweState.setCurrentProjectId(pid);
  window.isFirstQuestion=false;
  document.querySelectorAll('.hist-item').forEach(function(i){i.classList.remove('active');});
  setActiveNav('nav-chat');showDashView('view-chat');
  document.getElementById('chat-proj-name').textContent=pname;
  document.getElementById('chat-proj-sub').textContent='Editar';
  var msgs=document.getElementById('chatMessages');
  if(msgs)msgs.innerHTML='';
  setPendingBubble(true);
  setUiLocked(true);
  window.BaweSocket.emit('start-edit',{projectId:pid});
}

function openChatProj(pid,pname){
  if(hostPending)return;
  window.supportSessionActive=false;
  window.editSessionActive=false;
  clearSelectedLogo();
  currentProjectId=window.BaweState.setCurrentProjectId(pid);
  window.isFirstQuestion=false;
  var localProject=allProjects.find(function(p){return p.id===pid;});
  if(localProject)renderCentralProjectInfo(localProject);
  else{
    document.getElementById('chat-proj-name').textContent=pname;
    document.getElementById('chat-proj-sub').textContent='Proyecto activo';
  }
  document.querySelectorAll('.hist-item').forEach(function(i){i.classList.remove('active');});
  setActiveNav('nav-chat');showDashView('view-chat');
  window.BaweApi.getProject(pid)
  .then(function(result){var project=result.data;if(result.ok){updateKnownProject(project);renderCentralProjectInfo(project);loadChatHistory();}})
  .catch(function(err){console.error('Project detail error:',err);});
  loadChatHistory();
  renderChatHistory(allProjects);
}

function loadChatHistory(){
  if(!currentProjectId)return;
  if(hostPending)return;
  window.BaweApi.getProjectChat(currentProjectId)
  .then(function(result){var payload=result.data;
    var msgs=Array.isArray(payload)?payload:(payload.messages||[]);
    var pendingQuestion=Array.isArray(payload)?null:payload.pending_question;
    var requiresContinue=!Array.isArray(payload)&&!!payload.requires_continue;
    if(pendingQuestion)msgs=msgs.concat([pendingQuestion]);
    lastAgentQuestionText=window.BaweState.setLastAgentQuestionText('');
    msgs.forEach(function(m){
      if((m.role||m.sender)==='agent')lastAgentQuestionText=m.content||m.text||'';
    });
    window.BaweState.setLastAgentQuestionText(lastAgentQuestionText);
    if(!isBrandAssetsQuestion(lastAgentQuestionText))clearSelectedLogo();
    var el=document.getElementById('chatMessages');
    var html=msgs.map(function(m){
      var isUser=(m.role||m.sender)==='user';
      var body=m.content||m.text||'';
      return '<div class="mw'+(isUser?' user':'')+'"><div class="m-av '+(isUser?'av-u':'av-a')+'">'+(isUser?'YO':'BAWE')+'</div><div class="m-bub '+(isUser?'bub-u':'bub-a')+'"><div class="'+(isUser?'':'md-content')+'">'+(isUser?esc(body):renderMarkdown(body))+'</div>'+renderAttachment(m.attachment)+'<div class="m-time">'+new Date(m.createdAt||m.timestamp||Date.now()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</div></div></div>';
    }).join('');
    if(requiresContinue){
      activeHostSessionId=window.BaweState.setActiveHostSessionId(null);
      html+='<div class="mw" data-temp-notice="continue"><div class="m-av av-a">BAWE</div><div class="m-bub bub-a"><div>Escribí "continuar" para seguir este proyecto.</div><div class="m-time">'+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</div></div></div>';
    }
    if(!html)return;
    el.innerHTML=html;
    if(hostPending)setPendingBubble(true,hostStopping?'stopping':null);
    else setUiLocked(false);
    el.scrollTop=el.scrollHeight;
  }).catch(function(){});
}

document.getElementById('chatAttachBtn').addEventListener('click',function(){
  if(this.disabled)return;
  document.getElementById('chatLogoInput').click();
});
document.getElementById('chatLogoInput').addEventListener('change',function(){
  var file=this.files&&this.files[0]?this.files[0]:null;
  if(file && !/^image\//.test(file.type||'')){
    this.value='';
    selectedLogoFile=window.BaweState.setSelectedLogoFile(null);
    updateAttachButton();
    appendChatMessage('agent','El archivo adjunto debe ser una imagen.',false);
    return;
  }
  selectedLogoFile=window.BaweState.setSelectedLogoFile(file);
  updateAttachButton();
});

// Also update projects section to show create project button
document.getElementById('p-empty').querySelector('.btn-build')&&document.getElementById('p-empty').querySelector('.btn-build').addEventListener('click',function(){document.getElementById('nav-chat').click();});

// ---- INIT ----
function init(){
  if(token){
    window.BaweApi.me()
    .then(function(result){
      if(result.ok){currentUser=result.data;window.BaweState.setAuthSession(token,currentUser);enterDashboard();}
      else{window.BaweState.clearAuthSession();token=null;}
    }).catch(function(){window.BaweState.clearAuthSession();token=null;});
  }
}
init();
