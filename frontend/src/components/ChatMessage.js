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
// - options.items: opciones de contenido (se combinan si multiple).
// - options.exits: salidas ("No por ahora"...); excluyentes con todo lo demas.
// - options.hasOtra: boton "Otra", solo enfoca la caja para escribir; no inserta texto.
// - readOnly: opciones de preguntas ya respondidas (historial), sin click.
// El texto que insertan los botones se reemplaza sin pisar lo que el cliente ya escribio.
function renderChatOptions(options,readOnly){
  if(!options)return null;
  var items=options.items||[];
  var exits=options.exits||[];
  if(!items.length&&!exits.length)return null;
  var wrap=document.createElement('div');
  wrap.className='m-options'+(readOnly?' m-options-done':'');
  var selected=[];
  var inserted='';
  var itemButtons=[];
  var exitButtons=[];

  function syncInput(){
    var input=document.getElementById('chatInput');
    if(!input)return;
    var typed=input.value;
    if(inserted&&typed.indexOf(inserted)!==-1)typed=typed.replace(inserted,'');
    typed=typed.trim().replace(/,+$/,'').trim();
    var chips=selected.join(', ');
    input.value=typed&&chips?typed+' '+chips:(typed||chips);
    inserted=chips;
    input.focus();
  }

  function clearSelection(buttons){
    buttons.forEach(function(b){b.classList.remove('selected');});
  }

  function addButton(text,isExit){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='m-opt-btn'+(isExit?' m-opt-exit':'');
    btn.textContent=text;
    if(readOnly){btn.disabled=true;wrap.appendChild(btn);return;}
    btn.addEventListener('click',function(){
      if(isExit){
        // Salida: anula todo lo demas.
        clearSelection(itemButtons);clearSelection(exitButtons);
        selected=[text];
        btn.classList.add('selected');
      }else{
        clearSelection(exitButtons);
        if(selected.length&&exits.indexOf(selected[0])!==-1)selected=[];
        if(options.multiple){
          var idx=selected.indexOf(text);
          if(idx===-1){selected.push(text);btn.classList.add('selected');}
          else{selected.splice(idx,1);btn.classList.remove('selected');}
        }else{
          selected=[text];
          clearSelection(itemButtons);
          btn.classList.add('selected');
        }
      }
      syncInput();
    });
    (isExit?exitButtons:itemButtons).push(btn);
    wrap.appendChild(btn);
  }

  items.forEach(function(t){addButton(t,false);});
  exits.forEach(function(t){addButton(t,true);});

  if(options.hasOtra){
    var otra=document.createElement('button');
    otra.type='button';
    otra.className='m-opt-btn m-opt-other';
    otra.textContent='Otra';
    if(readOnly)otra.disabled=true;
    else otra.addEventListener('click',function(){
      // Otra no es una salida: se combina con lo elegido; solo deja escribir.
      var input=document.getElementById('chatInput');
      if(input){input.focus();var end=input.value.length;if(input.setSelectionRange)input.setSelectionRange(end,end);}
    });
    wrap.appendChild(otra);
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
