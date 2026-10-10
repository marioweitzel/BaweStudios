// Selector de CLI del sidebar ("selector de CLI para el proximo proyecto").
// Solo importa cuando se crea un proyecto NUEVO (ver beginProject en
// webSocketFlow.ts) -- cambiar la seleccion mientras se mira un proyecto
// existente no tiene efecto, asi que no hace falta deshabilitar nada aca.
// La eleccion vive en la cuenta del usuario (users.preferred_host_adapter): se
// carga al entrar (applyUserHostPreference) y se guarda al cambiar el selector.

// opencode queda afuera a proposito (ver project_opencode_bridge.md /
// memoria): el free tier del CLI permite usar el contenido del cliente para
// mejorar su servicio, no se expone como opcion elegible en el selector.
var SELECTABLE_CLI_LABELS = { 'claude-code': 'Claude Code', codex: 'Codex' };

// CLI que se manda al crear un proyecto nuevo ('' = automatica).
window.BaweSelectedHostAdapter = '';

function cliHint() {
  var hint = document.getElementById('sb-cli-hint');
  if (hint) hint.textContent = window.BaweSelectedHostAdapter ? '' : 'Elige por vos la CLI disponible';
  return hint;
}

function applyCliSelectorAvailability(hostsHealth) {
  var select = document.getElementById('sb-cli-select');
  if (!select) return;

  Array.prototype.forEach.call(select.options, function(option) {
    var name = option.value;
    if (!name) return; // "Automatico" siempre queda habilitado
    var label = SELECTABLE_CLI_LABELS[name] || name;
    var healthy = hostsHealth ? !!hostsHealth[name] : true;
    option.disabled = !healthy;
    option.textContent = healthy ? label : (label + ' (no disponible)');
  });

  if (window.BaweSelectedHostAdapter && select.querySelector('option[value="' + window.BaweSelectedHostAdapter + '"]:disabled')) {
    // La CLI guardada ya no esta disponible (se desinstalo, o el bridge esta
    // caido) -- este proyecto nuevo sale en "Automatico". La eleccion de la
    // cuenta no se borra: puede ser una caida pasajera.
    window.BaweSelectedHostAdapter = '';
  }
  select.value = window.BaweSelectedHostAdapter || '';
  cliHint();
}

function loadCliAvailability() {
  window.BaweApi.getAvailableHosts().then(function(result) {
    if (result.ok && result.data && result.data.hosts) {
      applyCliSelectorAvailability(result.data.hosts);
    }
  }).catch(function() {
    // Silencioso: si falla el chequeo, el selector queda con todas las
    // opciones habilitadas -- el backend igual valida al arrancar la sesion.
  });
}

// Carga la eleccion guardada en la cuenta (viene en el usuario de login, registro
// y /auth/me) y refresca el selector.
window.applyUserHostPreference = function(user) {
  var saved = user && user.preferred_host_adapter;
  window.BaweSelectedHostAdapter = saved && SELECTABLE_CLI_LABELS[saved] ? saved : '';
  var select = document.getElementById('sb-cli-select');
  if (select) select.value = window.BaweSelectedHostAdapter;
  cliHint();
  loadCliAvailability();
};

var cliSelectEl = document.getElementById('sb-cli-select');
if (cliSelectEl) {
  cliSelectEl.addEventListener('change', function() {
    var previous = window.BaweSelectedHostAdapter || '';
    var next = cliSelectEl.value || '';
    window.BaweSelectedHostAdapter = next;
    cliHint();
    window.BaweApi.setPreferredHost(next).then(function(result) {
      if (!result.ok) throw new Error('save failed');
      // Mantiene el usuario en memoria al dia con lo guardado.
      window.BaweState.setAuthSession(window.BaweState.getToken(), result.data);
    }).catch(function() {
      // No se pudo guardar: se vuelve a la eleccion anterior para no mostrar
      // algo que la cuenta no tiene.
      window.BaweSelectedHostAdapter = previous;
      cliSelectEl.value = previous;
      var hint = cliHint();
      if (hint) hint.textContent = 'No se pudo guardar tu elección. Intentá de nuevo.';
    });
  });
}
