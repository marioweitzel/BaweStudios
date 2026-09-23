var currentPreviewUrl='';
var currentPreviewProjectId='';
var currentPreviewProjectName='';

function hidePreviewModal(){
  var modal=document.getElementById('preview-modal');
  if(modal)modal.hidden=true;
  var frame=document.getElementById('preview-frame');
  if(frame)frame.src='about:blank';
}

function showPreviewModal(projectId,projectName,url){
  currentPreviewUrl=url||'';
  currentPreviewProjectId=projectId||'';
  currentPreviewProjectName=projectName||'';
  document.getElementById('preview-modal-title').textContent='Vista previa - '+(projectName||'Proyecto');
  document.getElementById('preview-modal-url').textContent=currentPreviewUrl;
  // Chrome particiona la cache HTTP por origen de nivel superior: este iframe
  // (embebido en BaweStudio) tiene su propia entrada de cache para la URL del
  // preview, separada de la que se usa al abrirla en una pestaña nueva (por
  // eso "Abrir" podía mostrar la version nueva mientras el iframe seguia
  // sirviendo la vieja). Un parametro que cambia en cada apertura fuerza a
  // tratarla como una URL distinta y evita esa cache obsoleta.
  var bustedUrl=currentPreviewUrl?currentPreviewUrl+(currentPreviewUrl.indexOf('?')===-1?'?':'&')+'_bs='+Date.now():currentPreviewUrl;
  document.getElementById('preview-frame').src=bustedUrl;
  document.getElementById('preview-modal').hidden=false;
}

document.addEventListener('click',function(event){
  if(event.target&&event.target.id==='preview-close')hidePreviewModal();
  if(event.target&&event.target.id==='preview-open-tab'&&currentPreviewUrl)window.open(currentPreviewUrl,'_blank');
  if(event.target&&event.target.id==='preview-edit'&&currentPreviewProjectId){
    var pid=currentPreviewProjectId,pname=currentPreviewProjectName;
    hidePreviewModal();
    openEditSession(pid,pname);
  }
});
