// Selector de CLI del sidebar ("selector de CLI para el proximo proyecto").
// Solo importa cuando se crea un proyecto NUEVO (ver beginProject en
// webSocketFlow.ts) -- cambiar la seleccion mientras se mira un proyecto
// existente no tiene efecto, asi que no hace falta deshabilitar nada aca.
var CLI_SELECTOR_STORAGE_KEY = 'bw_preferred_host_adapter';

// opencode queda afuera a proposito (ver project_opencode_bridge.md /
// memoria): el free tier del CLI permite usar el contenido del cliente para
// mejorar su servicio, no se expone como opcion elegible en el selector.
var SELECTABLE_CLI_LABELS = { 'claude-code': 'Claude Code', codex: 'Codex' };

window.BaweSelectedHostAdapter = localStorage.getItem(CLI_SELECTOR_STORAGE_KEY) || '';

function applyCliSelectorAvailability(hostsHealth) {
  var select = document.getElementById('sb-cli-select');
  var hint = document.getElementById('sb-cli-hint');
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
    // caido) -- volver a "Automatico" en vez de dejar una seleccion muerta.
    window.BaweSelectedHostAdapter = '';
    localStorage.removeItem(CLI_SELECTOR_STORAGE_KEY);
  }
  select.value = window.BaweSelectedHostAdapter || '';
  if (hint) hint.textContent = window.BaweSelectedHostAdapter ? '' : 'Elige por vos la CLI disponible';
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

var cliSelectEl = document.getElementById('sb-cli-select');
if (cliSelectEl) {
  cliSelectEl.value = window.BaweSelectedHostAdapter || '';
  cliSelectEl.addEventListener('change', function() {
    window.BaweSelectedHostAdapter = cliSelectEl.value || '';
    if (window.BaweSelectedHostAdapter) {
      localStorage.setItem(CLI_SELECTOR_STORAGE_KEY, window.BaweSelectedHostAdapter);
    } else {
      localStorage.removeItem(CLI_SELECTOR_STORAGE_KEY);
    }
  });
  loadCliAvailability();
}
