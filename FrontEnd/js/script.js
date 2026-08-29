(() => {
  // Función auxiliar para inyectar scripts en la cabecera dinámicamente
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Error cargando script: ${src}`));
      document.head.appendChild(script);
    });
  }

  // Determinar la ruta relativa al directorio js.
  // Como todos los archivos HTML están en FrontEnd/html/,
  // las llamadas a los scripts secundarios se resuelven con '../js/'
  const basePath = '../js';
  const ts = new Date().getTime(); // Cache buster

  Promise.all([
    loadScript(`${basePath}/auth.js?v=${ts}`),
    loadScript(`${basePath}/coach.js?v=${ts}`),
    loadScript(`${basePath}/cliente.js?v=${ts}`)
  ]).then(() => {
    // Una vez que todos los módulos están cargados de forma asíncrona, ejecutamos sus inicializadores:
    if (typeof window.initLoginPage === 'function') window.initLoginPage();
    if (typeof window.initRegisterPage === 'function') window.initRegisterPage();
    if (typeof window.initProfilePage === 'function') window.initProfilePage();
    if (typeof window.initPasswordChange === 'function') window.initPasswordChange();
    if (typeof window.initDashboardCliente === 'function') window.initDashboardCliente();
    if (typeof window.initProgresoCliente === 'function') window.initProgresoCliente();
    if (typeof window.initRutinaCliente === 'function') window.initRutinaCliente();
    if (typeof window.initLogout === 'function') window.initLogout();
    if (typeof window.initSidebarAvatar === 'function') window.initSidebarAvatar();
    if (typeof window.initMiCoach === 'function') window.initMiCoach();
    if (typeof window.initGestionRutinaCoach === 'function') window.initGestionRutinaCoach();
    if (typeof window.initCrearRutinaCoach === 'function') window.initCrearRutinaCoach();
    if (typeof window.initDashboardCoach === 'function') window.initDashboardCoach();
  }).catch(err => {
    console.error('Error al inicializar módulos de GYMBRO:', err);
  });
})();
