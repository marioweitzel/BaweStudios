(function(window) {
  var TOKEN_KEY = 'bw_token';
  var PROJECT_KEY = 'bw_current_project_id';

  var state = {
    token: localStorage.getItem(TOKEN_KEY),
    currentUser: null,
    currentProjectId: localStorage.getItem(PROJECT_KEY) || null,
    allProjects: [],
    sidebarCollapsed: false,
    deletingProjectId: null,
    hostPending: false,
    hostStopping: false,
    activeHostSessionId: null,
    currentProjectStateView: null,
    selectedLogoFile: null,
    lastAgentQuestionText: ''
  };

  function setAuthSession(nextToken, user) {
    state.token = nextToken || null;
    state.currentUser = user || null;
    if (state.token) {
      localStorage.setItem(TOKEN_KEY, state.token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  function clearAuthSession() {
    state.token = null;
    state.currentUser = null;
    state.currentProjectId = null;
    state.allProjects = [];
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROJECT_KEY);
    window.currentProjectId = null;
  }

  function setCurrentProjectId(projectId) {
    state.currentProjectId = projectId || null;
    window.currentProjectId = state.currentProjectId;
    if (state.currentProjectId) {
      localStorage.setItem(PROJECT_KEY, state.currentProjectId);
    } else {
      localStorage.removeItem(PROJECT_KEY);
    }
    return state.currentProjectId;
  }

  function clearCurrentProjectId() {
    return setCurrentProjectId(null);
  }

  function setProjects(projects) {
    state.allProjects = Array.isArray(projects) ? projects : [];
    return state.allProjects;
  }

  function setDeletingProjectId(projectId) {
    state.deletingProjectId = projectId || null;
    return state.deletingProjectId;
  }

  function setHostPending(pending) {
    state.hostPending = !!pending;
    return state.hostPending;
  }

  function setHostStopping(stopping) {
    state.hostStopping = !!stopping;
    return state.hostStopping;
  }

  function setActiveHostSessionId(sessionId) {
    state.activeHostSessionId = sessionId || null;
    return state.activeHostSessionId;
  }

  function setCurrentProjectStateView(view) {
    state.currentProjectStateView = view || null;
    return state.currentProjectStateView;
  }

  function setSelectedLogoFile(file) {
    state.selectedLogoFile = file || null;
    return state.selectedLogoFile;
  }

  function setLastAgentQuestionText(text) {
    state.lastAgentQuestionText = text || '';
    return state.lastAgentQuestionText;
  }

  window.BaweState = {
    state: state,
    getToken: function() { return state.token || localStorage.getItem(TOKEN_KEY) || ''; },
    getCurrentUser: function() { return state.currentUser; },
    getCurrentProjectId: function() { return state.currentProjectId || localStorage.getItem(PROJECT_KEY) || null; },
    setAuthSession: setAuthSession,
    clearAuthSession: clearAuthSession,
    setCurrentProjectId: setCurrentProjectId,
    clearCurrentProjectId: clearCurrentProjectId,
    setProjects: setProjects,
    setDeletingProjectId: setDeletingProjectId,
    setHostPending: setHostPending,
    setHostStopping: setHostStopping,
    setActiveHostSessionId: setActiveHostSessionId,
    setCurrentProjectStateView: setCurrentProjectStateView,
    setSelectedLogoFile: setSelectedLogoFile,
    setLastAgentQuestionText: setLastAgentQuestionText
  };
})(window);
