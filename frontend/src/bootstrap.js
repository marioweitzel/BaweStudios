(async function bootstrapBaweStudio() {
  const root = document.getElementById('app-root');
  const templates = {
    auth: '/src/views/auth/AuthShell.html',
    dashboard: '/src/views/dashboard/DashboardShell.html',
    home: '/src/views/dashboard/HomeView.html',
    projects: '/src/views/projects/ProjectsView.html',
    chat: '/src/views/chat/ProjectChatView.html',
    deleteModal: '/src/components/DeleteProjectModal.html',
    deliveryModal: '/src/components/DeliveryModal.html',
    previewModal: '/src/components/PreviewModal.html'
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.body.appendChild(script);
    });
  }

  async function loadTemplate(src) {
    const response = await fetch(src, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${src}: ${response.status}`);
    }
    return response.text();
  }

  try {
    const loaded = Object.fromEntries(
      await Promise.all(
        Object.entries(templates).map(async ([key, src]) => [key, await loadTemplate(src)])
      )
    );

    const dashboard = loaded.dashboard
      .replace('{{HOME_VIEW}}', loaded.home)
      .replace('{{PROJECTS_VIEW}}', loaded.projects)
      .replace('{{CHAT_VIEW}}', loaded.chat);

    root.innerHTML = `${loaded.auth}\n${dashboard}\n${loaded.deleteModal}\n${loaded.deliveryModal}\n${loaded.previewModal}`;

    await loadScript('/src/state/appState.js');
    await loadScript('/src/api/client.js');
    await loadScript('/src/socket/socketClient.js');
    await loadScript('/src/components/DeleteProjectModal.js');
    await loadScript('/src/components/DeliveryModal.js');
    await loadScript('/src/components/PreviewModal.js');
    await loadScript('/src/services/appShell.js');
    await loadScript('/src/components/ProjectCard.js');
    await loadScript('/src/components/ChatMessage.js');
    await loadScript('/src/components/ProjectHistory.js');
    await loadScript('/src/components/ProjectChatPanel.js');
    await loadScript('/src/services/chatRuntime.js');
    await loadScript('/src/services/stopFlow.js');
    await loadScript('/src/services/sendMessageFlow.js');
    await loadScript('/src/services/deleteProjectFlow.js');
    await loadScript('/src/socket/socketEvents.js');
  } catch (error) {
    console.error(error);
    root.innerHTML = '<main class="l-main" id="main"><p>No se pudo cargar BaweStudio.</p></main>';
  }
})();
