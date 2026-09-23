(function(window) {
  var socket = window.socket = io({
    auth: { token: window.BaweState.getToken() || '' },
    autoConnect: !!window.BaweState.getToken()
  });

  function setAuthToken(token) {
    socket.auth = { token: token || '' };
  }

  function connect() {
    if (!socket.connected) socket.connect();
  }

  function disconnect() {
    socket.disconnect();
  }

  function on(eventName, handler) {
    socket.on(eventName, handler);
  }

  function emit(eventName, payload) {
    socket.emit(eventName, payload);
  }

  window.BaweSocket = {
    getSocket: function() { return socket; },
    setAuthToken: setAuthToken,
    connect: connect,
    disconnect: disconnect,
    on: on,
    emit: emit
  };
})(window);
