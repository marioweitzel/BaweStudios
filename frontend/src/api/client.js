(function(window) {
  var API_BASE = '/api';

  function currentToken() {
    if (window.BaweState) return window.BaweState.getToken();
    return window.token || localStorage.getItem('bw_token') || '';
  }

  function authHeaders(extraHeaders) {
    var headers = Object.assign({}, extraHeaders || {});
    var token = currentToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    return headers;
  }

  async function parseResponse(response) {
    var data = await response.json().catch(function() { return {}; });
    return {
      ok: response.ok,
      status: response.status,
      data: data,
      response: response
    };
  }

  function request(path, options) {
    return fetch(API_BASE + path, options || {}).then(parseResponse);
  }

  function fileRequest(path) {
    return fetch(API_BASE + path, { headers: authHeaders() }).then(async function(response) {
      var contentDisposition = response.headers.get('content-disposition') || '';
      var match = contentDisposition.match(/filename="?([^"]+)"?/i);
      var blob = response.ok ? await response.blob() : null;
      var data = response.ok ? {} : await response.json().catch(function() { return {}; });
      return {
        ok: response.ok,
        status: response.status,
        data: data,
        blob: blob,
        filename: match ? match[1] : ''
      };
    });
  }

  window.BaweApi = {
    baseUrl: API_BASE,
    login: function(email, password) {
      return request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });
    },
    register: function(name, email, password) {
      return request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, password: password })
      });
    },
    me: function() {
      return request('/auth/me', { headers: authHeaders() });
    },
    listProjects: function() {
      return request('/projects', { headers: authHeaders() });
    },
    getProject: function(projectId) {
      return request('/projects/' + encodeURIComponent(projectId), { headers: authHeaders() });
    },
    downloadProject: function(projectId) {
      return fileRequest('/projects/' + encodeURIComponent(projectId) + '/download');
    },
    downloadHistoryPdf: function(projectId) {
      return fileRequest('/projects/' + encodeURIComponent(projectId) + '/history.pdf');
    },
    previewProject: function(projectId) {
      return request('/projects/' + encodeURIComponent(projectId) + '/preview', { headers: authHeaders() });
    },
    deleteProject: function(projectId) {
      return request('/projects/' + encodeURIComponent(projectId), { method: 'DELETE', headers: authHeaders() });
    },
    updateProject: function(projectId, payload) {
      return request('/projects/' + encodeURIComponent(projectId), {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload || {})
      });
    },
    uploadProjectLogo: function(projectId, file) {
      return request('/projects/' + encodeURIComponent(projectId) + '/logo', {
        method: 'POST',
        headers: authHeaders({
          'Content-Type': file.type || 'application/octet-stream',
          'X-File-Name': encodeURIComponent(file.name || 'logo')
        }),
        body: file
      });
    },
    uploadEditAttachment: function(projectId, file) {
      return request('/projects/' + encodeURIComponent(projectId) + '/edit-attachment', {
        method: 'POST',
        headers: authHeaders({
          'Content-Type': file.type || 'application/octet-stream',
          'X-File-Name': encodeURIComponent(file.name || 'imagen')
        }),
        body: file
      });
    },
    getProjectChat: function(projectId) {
      return request('/projects/' + encodeURIComponent(projectId) + '/chat', { headers: authHeaders() });
    }
  };
})(window);
