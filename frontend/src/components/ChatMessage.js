function attachmentImageSrc(attachment){
  if(!attachment||!attachment.url)return '';
  var src=attachment.url;
  if(/^data:|^blob:/i.test(src))return src;
  var joiner=src.indexOf('?')===-1?'?':'&';
  return src+joiner+'token='+encodeURIComponent(token||'');
}

function renderAttachment(attachment){
  if(!attachment||attachment.type!=='image')return '';
  var src=attachmentImageSrc(attachment);
  if(!src)return '';
  return '<div class="m-attachment"><img src="'+esc(src)+'" alt="'+esc(attachment.filename||'Logo adjunto')+'"/><div class="m-attachment-name">'+esc(attachment.filename||'Logo adjunto')+'</div></div>';
}

// Opciones clickeables (marker [[BAWE_OPCIONES]] del motor, ver contracts.ts
// del lado backend). Clickear una opcion NUNCA manda nada solo: arma/agrega
// texto en la misma caja de chat de siempre, editable, y quien manda sigue
// siendo el boton de enviar -- asi el cliente puede combinar seleccion +
// texto propio, o ignorar los botones y escribir libre, sin dos caminos
// distintos de respuesta. Criterio acordado con Mario el 24/9/2026.
function renderChatOptions(options){
  if(!options||!options.items||!options.items.length)return null;
  var wrap=document.createElement('div');
  wrap.className='m-options';
  var selected=[];
  var buttons=[];

  function syncInput(){
    var input=document.getElementById('chatInput');
    if(!input)return;
    input.value=selected.join(', ');
    input.focus();
  }

  options.items.forEach(function(itemText){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='m-opt-btn';
    btn.textContent=itemText;
    btn.addEventListener('click',function(){
      if(options.multiple){
        var idx=selected.indexOf(itemText);
        if(idx===-1){selected.push(itemText);btn.classList.add('selected');}
        else{selected.splice(idx,1);btn.classList.remove('selected');}
      }else{
        selected=[itemText];
        buttons.forEach(function(b){b.classList.remove('selected');});
        btn.classList.add('selected');
      }
      syncInput();
    });
    buttons.push(btn);
    wrap.appendChild(btn);
  });

  if(options.hasOtra){
    var hint=document.createElement('div');
    hint.className='m-opt-hint';
    hint.textContent='Tambien podes escribir tu propia respuesta.';
    wrap.appendChild(hint);
  }
  return wrap;
}

function appendChatMessage(sender,text,markdown,attachment,options){
  var el=document.getElementById('chatMessages');
  var empty=el.querySelector('.ch-empty');if(empty)empty.remove();
  var isUser=sender==='user';
  var row=document.createElement('div');
  row.className='mw'+(isUser?' user':'');
  var avatar=document.createElement('div');
  avatar.className='m-av '+(isUser?'av-u':'av-a');
  avatar.textContent=isUser?'YO':'BAWE';
  var bubble=document.createElement('div');
  bubble.className='m-bub '+(isUser?'bub-u':'bub-a');
  var content=document.createElement('div');
  content.className=markdown?'md-content':'';
  if(markdown){content.innerHTML=renderMarkdown(text);}else{content.textContent=text;}
  var attachmentWrap=document.createElement('div');
  attachmentWrap.innerHTML=renderAttachment(attachment);
  var time=document.createElement('div');
  time.className='m-time';
  time.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  bubble.appendChild(content);
  if(attachmentWrap.firstChild)bubble.appendChild(attachmentWrap.firstChild);
  var optionsEl=!isUser?renderChatOptions(options):null;
  if(optionsEl)bubble.appendChild(optionsEl);
  bubble.appendChild(time);
  row.appendChild(avatar);
  row.appendChild(bubble);
  el.appendChild(row);
  el.scrollTop=el.scrollHeight;
}

function removeTemporaryNotices(){
  var el=document.getElementById('chatMessages');
  Array.prototype.slice.call(el.querySelectorAll('[data-temp-notice]')).forEach(function(node){node.remove();});
}

function appendTemporaryAgentNotice(text,key){
  var el=document.getElementById('chatMessages');
  var empty=el.querySelector('.ch-empty');if(empty)empty.remove();
  var row=document.createElement('div');
  row.className='mw';
  row.setAttribute('data-temp-notice',key||'notice');
  row.innerHTML='<div class="m-av av-a">BAWE</div><div class="m-bub bub-a"><div>'+esc(text)+'</div><div class="m-time">'+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</div></div>';
  el.appendChild(row);
  el.scrollTop=el.scrollHeight;
}

function removeLastUserMessage(){
  var el=document.getElementById('chatMessages');
  var userRows=el.querySelectorAll('.mw.user');
  var last=userRows[userRows.length-1];
  if(last)last.remove();
}
