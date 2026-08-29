(() => {
  function initGestionRutinaCoach() {
    // 1. Catálogo de ejercicios modal (Código original del compañero)
    const catalogoModalEl = document.getElementById('catalogoEjerciciosModal');
    const formModalEl = document.getElementById('formEjercicioModal');
    if (!catalogoModalEl || !formModalEl || typeof bootstrap === 'undefined') return;

    const formModal = new bootstrap.Modal(formModalEl);
    const catalogoModal = new bootstrap.Modal(catalogoModalEl);

    const cardsContainer = document.getElementById('catalogoCards');
    const form = document.getElementById('formEjercicio');
    const editIndexInput = document.getElementById('exerciseEditIndex');
    const currentHasVideoInput = document.getElementById('exerciseCurrentHasVideo');
    const nameInput = document.getElementById('exerciseName');
    const groupInput = document.getElementById('exerciseGroup');
    const videoFileInput = document.getElementById('exerciseVideoFile');
    const formTitle = document.getElementById('formEjercicioLabel');
    const registerBtn = document.getElementById('btnRegistrarEjercicio');
    if (!cardsContainer || !form || !editIndexInput || !currentHasVideoInput || !nameInput || !groupInput || !videoFileInput || !formTitle || !registerBtn) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';

    function buildVideoHtml(ejercicio) {
      const videoUrl = ejercicio.videoUrl;
      if (videoUrl && videoUrl.startsWith('data:video')) {
        return `
          <div class="d-flex align-items-center mt-2">
            <p class="catalog-video-ok mb-0"><i class="bi bi-camera-video me-2"></i>Video disponible</p>
            <button class="btn btn-sm btn-outline-success ms-auto d-flex align-items-center gap-1 btn-play-video" data-ej-video="${videoUrl}">
              <i class="bi bi-play-circle"></i> Ver
            </button>
          </div>
        `;
      } else if (videoUrl) {
        return `<p class="catalog-video-ok mb-0 mt-2"><i class="bi bi-camera-video me-2"></i>Video disponible</p>`;
      }
      return `<p class="catalog-video-miss mb-0 mt-2"><i class="bi bi-camera-video-off me-2"></i>Sin video disponible</p>`;
    }

    function createCardFromDB(ejercicio) {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-xl-4 catalog-item';
      col.dataset.id = ejercicio._id;
      col.innerHTML = `
        <article class="catalog-card p-4 h-100">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
            <h3 class="h4 mb-0">${ejercicio.nombreEjercicio}</h3>
            <div class="d-flex gap-2">
              <button class="btn coach-icon-btn coach-icon-btn-muted" title="Editar ejercicio" data-edit-exercise><i class="bi bi-pencil-square"></i></button>
              <button class="btn coach-icon-btn coach-icon-btn-danger" title="Eliminar ejercicio" data-delete-exercise><i class="bi bi-trash"></i></button>
            </div>
          </div>
          <p class="coach-text-soft mb-2">Grupo muscular: <strong class="text-white">${ejercicio.grupoMuscular}</strong></p>
          ${buildVideoHtml(ejercicio)}
        </article>
      `;
      return col;
    }

    // Carga el catálogo desde la API
    async function cargarCatalogo() {
      const spinner = document.getElementById('catalogoSpinner');
      // Limpiar tarjetas anteriores pero mantener el spinner
      Array.from(cardsContainer.querySelectorAll('.catalog-item')).forEach(el => el.remove());
      if (spinner) spinner.style.display = 'flex';

      try {
        const res = await fetch(`${API_BASE_URL}/api/ejercicios`);
        if (!res.ok) throw new Error('Error al cargar ejercicios');
        const ejercicios = await res.json();

        if (spinner) spinner.style.display = 'none';

        if (ejercicios.length === 0) {
          cardsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
              <i class="bi bi-clipboard-x display-4 text-muted d-block mb-3"></i>
              <p class="coach-text-soft">No hay ejercicios en el catálogo aún.</p>
            </div>
          `;
          return;
        }

        ejercicios.forEach(ej => cardsContainer.appendChild(createCardFromDB(ej)));
      } catch (err) {
        console.error(err);
        if (spinner) spinner.style.display = 'none';
        cardsContainer.innerHTML += `<div class="col-12"><div class="alert alert-danger small">No se pudieron cargar los ejercicios.</div></div>`;
      }
    }

    // Cargar cuando se abre el modal del catálogo
    catalogoModalEl.addEventListener('show.bs.modal', () => {
      cargarCatalogo();
    });

    // Delegación de eventos para reproducir video
    cardsContainer.addEventListener('click', (e) => {
      const playBtn = e.target.closest('.btn-play-video');
      if (playBtn) {
        const videoStr = playBtn.getAttribute('data-ej-video');
        if (videoStr) {
          const modalEl = document.getElementById('modalVideoReferencia');
          const videoEl = document.getElementById('reproductorVideo');
          if (modalEl && videoEl) {
            videoEl.src = videoStr;
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            
            modalEl.addEventListener('hidden.bs.modal', function onHidden() {
              videoEl.pause();
              videoEl.src = '';
              modalEl.removeEventListener('hidden.bs.modal', onHidden);
            });
            
            modal.show();
          }
        }
      }
    });

    function readCardData(cardEl) {
      const name = cardEl.querySelector('h3').textContent.trim();
      const group = cardEl.querySelector('strong').textContent.trim();
      const hasVideo = cardEl.querySelector('.catalog-video-ok') ? 'si' : 'no';
      const id = cardEl.closest('.catalog-item')?.dataset?.id || '';
      return { name, group, hasVideo, id };
    }

    function openFormModal() {
      const onHidden = () => {
        catalogoModalEl.removeEventListener('hidden.bs.modal', onHidden);
        formModal.show();
      };
      catalogoModalEl.addEventListener('hidden.bs.modal', onHidden);
      catalogoModal.hide();
    }

    registerBtn.addEventListener('click', () => {
      form.reset();
      editIndexInput.value = '-1';
      currentHasVideoInput.value = 'no';
      videoFileInput.value = '';
      formTitle.textContent = 'Registrar ejercicio';
      openFormModal();
    });

    cardsContainer.addEventListener('click', async (event) => {
      const deleteBtn = event.target.closest('[data-delete-exercise]');
      if (deleteBtn) {
        const cardCol = deleteBtn.closest('.catalog-item');
        const id = cardCol.dataset.id;
        const modalEl = document.getElementById('modalConfirmarEliminarEjercicio');
        if (modalEl) {
          const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.show();
          
          const confirmBtn = document.getElementById('btn-confirmar-eliminar-ejercicio');
          const newConfirmBtn = confirmBtn.cloneNode(true);
          confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
          
          newConfirmBtn.addEventListener('click', async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/ejercicios/${id}`, { method: 'DELETE' });
              if (!res.ok) throw new Error('Error al eliminar');
              cargarCatalogo();
            } catch (e) {
              alert('No se pudo eliminar el ejercicio');
            }
            modal.hide();
          });
        }
        return;
      }

      const editBtn = event.target.closest('[data-edit-exercise]');
      if (!editBtn) return;

      const cardCol = editBtn.closest('.catalog-item');
      const cards = Array.from(cardsContainer.querySelectorAll('.catalog-item'));
      const index = cards.indexOf(cardCol);
      const data = readCardData(cardCol);

      editIndexInput.value = index;
      nameInput.value = data.name;
      groupInput.value = data.group;
      currentHasVideoInput.value = data.hasVideo;
      videoFileInput.value = '';
      formTitle.textContent = 'Editar ejercicio';
      openFormModal();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const uploadedFile = videoFileInput.files[0];
      const nombre = nameInput.value.trim();
      const grupo = groupInput.value;
      if (!nombre || !grupo) return;

      const cardCol = editIndexInput.value !== '-1'
        ? Array.from(cardsContainer.querySelectorAll('.catalog-item'))[Number(editIndexInput.value)]
        : null;
      const existingId = cardCol?.dataset?.id || '';

      const originalBtnHtml = registerBtn.innerHTML;
      registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
      registerBtn.disabled = true;

      try {
        let payload = { nombreEjercicio: nombre, grupoMuscular: grupo };

        if (uploadedFile) {
          payload.videoUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(uploadedFile);
          });
        } else if (currentHasVideoInput.value === 'no') {
          payload.videoUrl = '';
        }

        if (existingId) {
          const res = await fetch(`${API_BASE_URL}/api/ejercicios/${existingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('Error al actualizar ejercicio');
        } else {
          const res = await fetch(`${API_BASE_URL}/api/ejercicios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('Error al guardar ejercicio');
        }

        formModal.hide();
        catalogoModalEl.addEventListener('shown.bs.modal', cargarCatalogo, { once: true });
        catalogoModal.show();

      } catch (err) {
        console.error(err);
        alert('Hubo un error al guardar el ejercicio. Asegúrate de que el video no sea demasiado pesado o reinicia los servidores.');
      } finally {
        registerBtn.innerHTML = originalBtnHtml;
        registerBtn.disabled = false;
      }
    });

    // 2. Cargar y gestionar listado de rutinas dinámicamente
    const rutinasContainer = document.getElementById('rutinasContainer');
    if (!rutinasContainer) return;

    async function cargarRutinas() {
      try {
        const [rutinasRes, asignacionesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/rutinas`),
          fetch(`${API_BASE_URL}/api/asignacion-rutinas`)
        ]);
        if (!rutinasRes.ok || !asignacionesRes.ok) throw new Error('Error al obtener rutinas');
        const rutinas = await rutinasRes.json();
        const asignaciones = await asignacionesRes.json();

        rutinasContainer.innerHTML = '';

        if (rutinas.length === 0) {
          rutinasContainer.innerHTML = `
            <div class="text-center p-5 coach-card">
              <i class="bi bi-clipboard-x display-4 text-muted mb-3 d-block"></i>
              <p class="coach-text-soft">No tienes ninguna rutina creada todavía.</p>
              <a class="btn coach-btn-accent mt-2" href="CrearRutina-coach.html">Crear mi primera rutina</a>
            </div>
          `;
          return;
        }

        rutinas.forEach(rutina => {
          const card = document.createElement('article');
          card.className = 'coach-card p-4';
          
          const fechaStr = new Date(rutina.fechaCreacion).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });

          // Obtener los usuarios asignados a esta rutina en particular que estén activos
          const usuariosAsignados = asignaciones.filter(asig => asig.rutinaId && asig.rutinaId._id === rutina._id && asig.estado === 'activa');

          let asignadosHTML = '';
          if (usuariosAsignados.length > 0) {
            asignadosHTML = `
              <div class="routine-divider my-4"></div>
              <h3 class="h5 mb-3">Usuarios asignados</h3>
              <div class="d-flex flex-column gap-2">
                ${usuariosAsignados.map(asig => {
                  const cli = asig.clienteId;
                  if (!cli) return '';
                  const initials = (cli.nombre.charAt(0) + (cli.apellido ? cli.apellido.charAt(0) : '')).toUpperCase();
                  let avatarHtml = `<div class="assigned-avatar">${initials}</div>`;
                  if (cli.fotoPerfil && cli.fotoPerfil.startsWith('data:image')) {
                    avatarHtml = `<img src="${cli.fotoPerfil}" alt="${cli.nombre}" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover; border: 1px solid var(--coach-border-soft);">`;
                  }

                  return `
                    <div class="assigned-user d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 p-3">
                      <div class="d-flex align-items-center gap-3">
                        ${avatarHtml}
                        <span class="h4 mb-0 text-white">${cli.nombre} ${cli.apellido || ''}</span>
                      </div>
                      <button class="btn btn-dark-soft px-3 btn-ver-progreso" data-cliente-id="${cli._id}">
                        <i class="bi bi-eye me-2"></i>
                        Ver progreso
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }

          card.innerHTML = `
            <div class="d-flex flex-column flex-xl-row justify-content-between gap-3">
              <div>
                <h2 class="h3 mb-3">${rutina.nombreRutina}</h2>
                <div class="d-flex flex-wrap gap-2 mb-3">
                  <span class="coach-pill coach-pill-accent">${rutina.objetivo}</span>
                  <span class="coach-pill coach-pill-muted">${rutina.nivel}</span>
                </div>
                <div class="d-flex flex-wrap gap-4 coach-text-soft">
                  <span><strong class="text-white">${rutina.ejercicios.length}</strong> ejercicios</span>
                  <span>Creada el ${fechaStr}</span>
                </div>
              </div>

              <div class="d-flex gap-2 align-items-start">
                <button class="btn coach-icon-btn coach-icon-btn-success" title="Asignar usuarios" data-id="${rutina._id}" data-action="asignar"><i class="bi bi-person-plus"></i></button>
                <button class="btn coach-icon-btn coach-icon-btn-muted" title="Editar rutina" data-id="${rutina._id}"><i class="bi bi-pencil-square"></i></button>
                <button class="btn coach-icon-btn coach-icon-btn-danger" title="Eliminar rutina" data-id="${rutina._id}"><i class="bi bi-trash"></i></button>
              </div>
            </div>
            ${asignadosHTML}
          `;
          rutinasContainer.appendChild(card);
        });

      } catch (error) {
        console.error('Error al listar rutinas:', error);
        rutinasContainer.innerHTML = `
          <div class="alert alert-danger" role="alert">
            No se pudo conectar con el servidor para cargar las rutinas.
          </div>
        `;
      }
    }
    cargarRutinas();

    // 3. Manejar eliminación y edición de rutinas
    let rutinaIdParaEliminar = null;
    const modalConfirmarEl = document.getElementById('modalConfirmarEliminar');
    const modalConfirmar = modalConfirmarEl ? bootstrap.Modal.getOrCreateInstance(modalConfirmarEl) : null;
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');

    if (btnConfirmarEliminar) {
      btnConfirmarEliminar.addEventListener('click', async () => {
        if (!rutinaIdParaEliminar) return;

        btnConfirmarEliminar.disabled = true;
        btnConfirmarEliminar.textContent = 'Eliminando...';

        try {
          const response = await fetch(`${API_BASE_URL}/api/rutinas/${rutinaIdParaEliminar}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            let errMsg = 'Error al eliminar la rutina. (¿Reiniciaste el backend?)';
            try {
              const data = await response.json();
              errMsg = data.message || errMsg;
            } catch (e) {
              console.error("Respuesta no es JSON:", e);
            }
            alert(errMsg);
            return;
          }

          if (modalConfirmar) modalConfirmar.hide();
          cargarRutinas();

        } catch (error) {
          alert('No se pudo conectar con el servidor.');
        } finally {
          btnConfirmarEliminar.disabled = false;
          btnConfirmarEliminar.textContent = 'Eliminar';
        }
      });
    }

    rutinasContainer.addEventListener('click', async (event) => {
      // 3a. Manejar edición de rutinas
      const editBtn = event.target.closest('button.coach-icon-btn-muted[title="Editar rutina"]');
      if (editBtn) {
        const rutinaId = editBtn.getAttribute('data-id');
        if (rutinaId) {
          window.location.href = `CrearRutina-coach.html?id=${rutinaId}`;
        }
        return;
      }

      // 3b. Manejar asignación de rutinas
      const assignBtn = event.target.closest('button.coach-icon-btn-success[title="Asignar usuarios"]');
      if (assignBtn) {
        const rutinaId = assignBtn.getAttribute('data-id');
        if (rutinaId) {
          abrirModalAsignacion(rutinaId);
        }
        return;
      }

      // 3c. Manejar eliminación de rutinas
      const deleteBtn = event.target.closest('button.coach-icon-btn-danger');
      if (deleteBtn) {
        const rutinaId = deleteBtn.getAttribute('data-id');
        if (rutinaId) {
          rutinaIdParaEliminar = rutinaId;
          if (modalConfirmar) {
            modalConfirmar.show();
          }
        }
        return;
      }

      // 3d. Manejar visualización del progreso del cliente
      const progBtn = event.target.closest('button.btn-ver-progreso');
      if (progBtn) {
        const clienteId = progBtn.getAttribute('data-cliente-id');
        const cardEl = progBtn.closest('.assigned-user');
        const nameEl = cardEl ? (cardEl.querySelector('.h4') || cardEl.querySelector('span')) : null;
        const clienteNombre = nameEl ? nameEl.textContent.trim() : 'Cliente';
        if (clienteId) {
          abrirModalProgreso(clienteId, clienteNombre);
        }
        return;
      }
    });

    // --- LÓGICA DE VISUALIZACIÓN DEL PROGRESO DEL CLIENTE ---
    async function abrirModalProgreso(clienteId, clienteNombre) {
      const modalProgresoEl = document.getElementById('modalVerProgreso');
      if (!modalProgresoEl || typeof bootstrap === 'undefined') return;

      const modalProgreso = bootstrap.Modal.getOrCreateInstance(modalProgresoEl);
      const tableBodyProgreso = document.getElementById('progresoClienteTableBody');
      const tituloProgreso = document.getElementById('modalProgresoTitulo');

      if (!tableBodyProgreso) return;

      if (tituloProgreso) {
        tituloProgreso.textContent = `Progreso de ${clienteNombre}`;
      }

      tableBodyProgreso.innerHTML = `
        <tr>
          <td colspan="3" class="text-center py-4 border-bottom-0">
            <span class="spinner-border spinner-border-sm text-success" role="status" aria-hidden="true"></span>
            <span class="ms-2 text-white-50">Obteniendo historial de progreso...</span>
          </td>
        </tr>
      `;

      modalProgreso.show();

      try {
        const response = await fetch(`${API_BASE_URL}/api/progresos/${clienteId}`);
        if (!response.ok) throw new Error('Error al cargar progresos');
        const progresos = await response.json();

        if (progresos.length === 0) {
          tableBodyProgreso.innerHTML = `
            <tr>
              <td colspan="3" class="text-center py-5 border-bottom-0">
                <i class="bi bi-graph-down text-white-50 mb-2 d-block" style="font-size: 2.2rem; opacity: 0.7;"></i>
                <p class="small text-white-50 mb-0" style="font-size: 0.95rem; font-weight: 500;">El cliente aún no ha registrado progresos físicos.</p>
              </td>
            </tr>
          `;
          return;
        }

        // Ordenar progresos de más reciente a más antiguo
        progresos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        tableBodyProgreso.innerHTML = progresos.map(prog => {
          const fechaStr = new Date(prog.fecha).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
          const notasStr = prog.notes || prog.notas ? (prog.notes || prog.notas).trim() : '<span class="text-white-50 small" style="opacity: 0.6;">Sin observaciones</span>';
          return `
            <tr>
              <td class="px-3 py-3 border-bottom text-white fw-medium">${fechaStr}</td>
              <td class="px-3 py-3 border-bottom"><span class="badge" style="background: rgba(33, 217, 123, 0.15); color: var(--coach-accent); font-size: 0.95rem; font-weight: 600; padding: 0.4em 0.8em; border-radius: 8px;">${prog.peso} kg</span></td>
              <td class="px-3 py-3 border-bottom text-white-50" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${prog.notes || prog.notas || ''}">${notasStr}</td>
            </tr>
          `;
        }).join('');

      } catch (error) {
        console.error(error);
        tableBodyProgreso.innerHTML = `
          <tr>
            <td colspan="3" class="text-center py-4 border-bottom-0">
              <div class="alert alert-danger small mb-0 d-inline-block py-2" role="alert">
                No se pudo conectar con el servidor para cargar el progreso.
              </div>
            </td>
          </tr>
        `;
      }
    }

    // --- LÓGICA DE ASIGNACIÓN DE RUTINAS A CLIENTES VINCULADOS ---
    const modalAsignarEl = document.getElementById('modalAsignarRutina');
    const modalAsignar = modalAsignarEl ? bootstrap.Modal.getOrCreateInstance(modalAsignarEl) : null;
    const btnGuardarAsignacion = document.getElementById('btn-guardar-asignacion');
    const listClientesContainer = document.getElementById('asignarClientesList');
    const inputAsignarRutinaId = document.getElementById('asignarRutinaId');
    const feedbackAsignar = document.getElementById('asignarFeedback');

    async function abrirModalAsignacion(rutinaId) {
      if (!modalAsignar || !listClientesContainer) return;
      
      inputAsignarRutinaId.value = rutinaId;
      if (feedbackAsignar) feedbackAsignar.style.display = 'none';
      
      listClientesContainer.innerHTML = `
        <div class="text-center py-4">
          <span class="spinner-border spinner-border-sm text-success"></span>
          <span class="ms-2 small coach-text-soft">Obteniendo tus clientes vinculados...</span>
        </div>
      `;
      modalAsignar.show();

      try {
        const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
        const coachId = currentUser ? currentUser.id : '6a124a584aa0ab34922bfddb';

        // Hacer fetch en paralelo de tus clientes vinculados y todas las asignaciones de rutina existentes
        const [relacionesRes, asignacionesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/coach-cliente/coach/${coachId}`),
          fetch(`${API_BASE_URL}/api/asignacion-rutinas`)
        ]);

        if (!relacionesRes.ok || !asignacionesRes.ok) throw new Error('Error al cargar datos del servidor');

        const relaciones = await relacionesRes.json();
        const asignaciones = await asignacionesRes.json();

        // Mapear los clientes que ya están asignados ACTIVAMENTE a esta rutina en particular
        const asignadosAEstaRutina = new Set(
          asignaciones
            .filter(asig => asig.rutinaId && asig.rutinaId._id === rutinaId && asig.estado === 'activa')
            .map(asig => asig.clienteId && asig.clienteId._id)
        );

        if (relaciones.length === 0) {
          listClientesContainer.innerHTML = `
            <div class="text-center py-4 px-3 rounded" style="background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.1);">
              <i class="bi bi-people text-muted mb-2 d-block" style="font-size: 2rem;"></i>
              <p class="small text-muted mb-0">Aún no tienes ningún cliente que te haya seleccionado como su coach.</p>
            </div>
          `;
          return;
        }

        listClientesContainer.innerHTML = relaciones.map(rel => {
          const cli = rel.clienteId;
          if (!cli) return '';
          const isChecked = asignadosAEstaRutina.has(cli._id) ? 'checked' : '';
          const initials = (cli.nombre.charAt(0) + (cli.apellido ? cli.apellido.charAt(0) : '')).toUpperCase();
          let avatarHtml = `
            <div class="avatar-mini rounded-circle d-flex align-items-center justify-content-center text-success fw-bold" style="width: 40px; height: 40px; background: rgba(33, 217, 123, 0.1);">
              ${initials}
            </div>
          `;
          if (cli.fotoPerfil && cli.fotoPerfil.startsWith('data:image')) {
            avatarHtml = `<img src="${cli.fotoPerfil}" alt="${cli.nombre}" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover;">`;
          }

          return `
            <div class="d-flex align-items-center justify-content-between p-3 rounded" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.2s;">
              <div class="d-flex align-items-center gap-3">
                ${avatarHtml}
                <div>
                  <div class="fw-semibold text-white" style="font-size: 0.95rem;">${cli.nombre} ${cli.apellido || ''}</div>
                  <small class="coach-text-soft" style="font-size: 0.8rem;">${cli.email}</small>
                </div>
              </div>
              <div class="form-check form-switch mb-0">
                <input class="form-check-input client-assign-switch" type="checkbox" data-client-id="${cli._id}" ${isChecked} style="cursor: pointer; width: 2.5em; height: 1.25em;">
              </div>
            </div>
          `;
        }).join('');

      } catch (error) {
        console.error(error);
        listClientesContainer.innerHTML = `
          <div class="alert alert-danger small py-3" role="alert">
            No se pudieron cargar los clientes de forma correcta.
          </div>
        `;
      }
    }

    if (btnGuardarAsignacion) {
      btnGuardarAsignacion.addEventListener('click', async () => {
        const rutinaId = inputAsignarRutinaId.value;
        if (!rutinaId) return;

        btnGuardarAsignacion.disabled = true;
        btnGuardarAsignacion.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

        const switches = Array.from(listClientesContainer.querySelectorAll('.client-assign-switch'));
        const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
        const coachId = currentUser ? currentUser.id : '6a124a584aa0ab34922bfddb';

        try {
          await Promise.all(switches.map(async (sw) => {
            const clienteId = sw.getAttribute('data-client-id');
            const checked = sw.checked;

            if (checked) {
              // Eliminar cualquier asignación previa para evitar duplicados
              await fetch(`${API_BASE_URL}/api/asignacion-rutinas`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clienteId, rutinaId })
              });

              // Crear la nueva asignación activa
              await fetch(`${API_BASE_URL}/api/asignacion-rutinas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clienteId,
                  coachId,
                  rutinaId,
                  estado: 'activa'
                })
              });
            } else {
              // Eliminar la asignación desmarcada
              await fetch(`${API_BASE_URL}/api/asignacion-rutinas`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clienteId, rutinaId })
              });
            }
          }));

          if (modalAsignar) modalAsignar.hide();
          cargarRutinas();

        } catch (error) {
          console.error(error);
          if (feedbackAsignar) {
            feedbackAsignar.className = 'alert alert-danger small mb-0 mt-2';
            feedbackAsignar.textContent = 'Ocurrió un error al procesar las asignaciones.';
            feedbackAsignar.style.display = 'block';
          }
        } finally {
          btnGuardarAsignacion.disabled = false;
          btnGuardarAsignacion.innerHTML = '<i class="bi bi-person-check me-2"></i>Asignar';
        }
      });
    }
  }

  function initCrearRutinaCoach() {
    const body = document.body;
    if (!body || !body.classList.contains('crear-rutina-coach-page')) return;

    const inputDia = document.getElementById('inputDia');
    const inputEjercicio = document.getElementById('inputEjercicio');
    const inputSeries = document.getElementById('inputSeries');
    const inputRepeticiones = document.getElementById('inputRepeticiones');
    const inputDescanso = document.getElementById('inputDescanso');
    const btnAgregar = document.getElementById('btnAgregarEjercicio');
    const tablaBody = document.getElementById('tablaEjerciciosBody');
    const btnGuardar = document.getElementById('btnGuardarRutina');
    const rutinaNombre = document.getElementById('rutinaNombre');
    const rutinaObjetivo = document.getElementById('rutinaObjetivo');
    const rutinaNivel = document.getElementById('rutinaNivel');
    const rutinaNotas = document.getElementById('rutinaNotas');

    if (!inputDia || !inputEjercicio || !inputSeries || !inputRepeticiones || !inputDescanso || !btnAgregar || !tablaBody || !btnGuardar || !rutinaNombre || !rutinaObjetivo || !rutinaNivel) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';
    let editingRow = null;

    function mostrarAlerta(titulo, mensaje, esExito = true, callback = null) {
      const modalEl = document.getElementById('modalAlertaCrear');
      if (!modalEl) {
        alert(mensaje);
        if (callback) callback();
        return;
      }

      document.getElementById('modalAlertaTitulo').textContent = titulo;
      document.getElementById('modalAlertaMensaje').textContent = mensaje;

      const iconWrap = modalEl.querySelector('.modal-body i');
      const iconContainer = iconWrap ? iconWrap.parentElement : null;
      if (iconContainer && iconWrap) {
        if (esExito) {
          iconContainer.style.background = 'rgba(33, 217, 123, 0.15)';
          iconContainer.style.color = 'var(--coach-accent)';
          iconWrap.className = 'bi bi-check-circle-fill';
        } else {
          iconContainer.style.background = 'rgba(245, 69, 69, 0.15)';
          iconContainer.style.color = '#f54545';
          iconWrap.className = 'bi bi-exclamation-triangle-fill';
        }
      }

      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();

      const btnEntendido = document.getElementById('btn-alerta-entendido');
      const newBtn = btnEntendido.cloneNode(true);
      btnEntendido.parentNode.replaceChild(newBtn, btnEntendido);

      newBtn.addEventListener('click', () => {
        modalInstance.hide();
        if (callback) callback();
      });
    }

    // Detectar si estamos en modo edición (si hay un ID en la URL)
    const urlParams = new URLSearchParams(window.location.search);
    const rutinaId = urlParams.get('id');

    if (rutinaId) {
      // Cambiar encabezado y botón dinámicamente
      const pageTitle = document.querySelector('main h1');
      const pageDesc = document.querySelector('main p');
      if (pageTitle) pageTitle.textContent = 'Editar Rutina';
      if (pageDesc) pageDesc.textContent = 'Modifica los detalles y ejercicios de la rutina';
      btnGuardar.innerHTML = '<i class="bi bi-floppy me-2"></i>Actualizar Rutina';
    }

    // Limpiar tabla al inicio
    tablaBody.innerHTML = '';

    // Cargar catálogo de ejercicios dinámicamente desde el backend
    async function cargarEjerciciosDropdown() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ejercicios`);
        if (!response.ok) throw new Error('Error al cargar catálogo de ejercicios');
        const ejercicios = await response.json();

        inputEjercicio.innerHTML = '<option value="">Seleccionar ejercicio</option>';
        ejercicios.forEach(ej => {
          const opt = document.createElement('option');
          opt.value = ej.nombreEjercicio;
          opt.textContent = ej.nombreEjercicio;
          inputEjercicio.appendChild(opt);
        });

        // Una vez cargado el dropdown, si estamos editando, cargar los datos de la rutina
        if (rutinaId) {
          await cargarRutinaEdicion();
        }
      } catch (error) {
        console.error('Error al cargar catálogo de ejercicios:', error);
      }
    }
    cargarEjerciciosDropdown();

    async function cargarRutinaEdicion() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/rutinas/${rutinaId}`);
        if (!response.ok) throw new Error('Error al obtener la rutina');
        const rutina = await response.json();

        // Rellenar campos principales
        rutinaNombre.value = rutina.nombreRutina;
        rutinaObjetivo.value = rutina.objetivo;
        rutinaNivel.value = rutina.nivel;
        if (rutinaNotas) rutinaNotas.value = rutina.notes || rutina.notas || '';

        // Rellenar ejercicios en la tabla
        tablaBody.innerHTML = '';
        rutina.ejercicios.forEach(ej => {
          const row = document.createElement('tr');
          fillRow(row, {
            dia: ej.dia,
            ejercicio: ej.ejercicio,
            series: ej.series,
            repeticiones: ej.repeticiones,
            descanso: ej.descanso
          });
          tablaBody.appendChild(row);
        });

      } catch (error) {
        mostrarAlerta('Error', 'No se pudo cargar la rutina para editar.', false, () => {
          window.location.href = 'GestionRutina-coach.html';
        });
      }
    }

    function clearExerciseInputs() {
      inputDia.value = 'Lunes';
      inputEjercicio.value = '';
      inputSeries.value = '';
      inputRepeticiones.value = '';
      inputDescanso.value = '';
    }

    function readExerciseInputs() {
      return {
        dia: inputDia.value.trim(),
        ejercicio: inputEjercicio.value.trim(),
        series: inputSeries.value.trim(),
        repeticiones: inputRepeticiones.value.trim(),
        descanso: inputDescanso.value.trim() || '-'
      };
    }

    function validateExercise(data) {
      return data.ejercicio && data.series && data.repeticiones;
    }

    // Usar la función fillRow de forma globalizada
    function buildActionsCell() {
      return `
        <button class="btn coach-icon-btn coach-icon-btn-muted me-1" type="button" data-action="editar"><i class="bi bi-pencil-square"></i></button>
        <button class="btn coach-icon-btn coach-icon-btn-danger" type="button" data-action="eliminar"><i class="bi bi-trash"></i></button>
      `;
    }

    function fillRow(row, data) {
      row.innerHTML = `
        <td>${data.dia}</td>
        <td>${data.ejercicio}</td>
        <td>${data.series}</td>
        <td>${data.repeticiones}</td>
        <td>${data.descanso}</td>
        <td>${buildActionsCell()}</td>
      `;
    }

    btnAgregar.addEventListener('click', () => {
      const data = readExerciseInputs();
      if (!validateExercise(data)) {
        mostrarAlerta('Datos Incompletos', 'Completa Ejercicio, Series y Repeticiones para agregar.', false);
        return;
      }

      if (editingRow) {
        fillRow(editingRow, data);
        editingRow = null;
        btnAgregar.innerHTML = '<i class="bi bi-plus-lg me-2"></i>Agregar ejercicio';
      } else {
        const row = document.createElement('tr');
        fillRow(row, data);
        tablaBody.appendChild(row);
      }

      clearExerciseInputs();
    });

    tablaBody.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const row = btn.closest('tr');
      if (!row) return;

      if (action === 'eliminar') {
        row.remove();
        if (editingRow === row) {
          editingRow = null;
          clearExerciseInputs();
          btnAgregar.innerHTML = '<i class="bi bi-plus-lg me-2"></i>Agregar ejercicio';
        }
        return;
      }

      if (action === 'editar') {
        const cells = row.querySelectorAll('td');
        inputDia.value = cells[0].textContent.trim();
        inputEjercicio.value = cells[1].textContent.trim();
        inputSeries.value = cells[2].textContent.trim();
        inputRepeticiones.value = cells[3].textContent.trim();
        inputDescanso.value = cells[4].textContent.trim() === '-' ? '' : cells[4].textContent.trim();
        editingRow = row;
        btnAgregar.innerHTML = '<i class="bi bi-check2 me-2"></i>Actualizar ejercicio';
      }
    });

    btnGuardar.addEventListener('click', async () => {
      const nombre = rutinaNombre.value.trim();
      const objetivo = rutinaObjetivo.value;
      const nivel = rutinaNivel.value;
      const notas = rutinaNotas ? rutinaNotas.value.trim() : '';

      if (!nombre || !objetivo || !nivel) {
        mostrarAlerta('Datos Incompletos', 'Completa Nombre, Objetivo y Nivel antes de guardar la rutina.', false);
        return;
      }

      const rows = Array.from(tablaBody.querySelectorAll('tr'));
      if (rows.length === 0) {
        mostrarAlerta('Rutina Vacía', 'Agrega al menos un ejercicio antes de guardar la rutina.', false);
        return;
      }

      const ejercicios = rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          dia: cells[0].textContent.trim(),
          ejercicio: cells[1].textContent.trim(),
          series: parseInt(cells[2].textContent.trim(), 10),
          repeticiones: cells[3].textContent.trim(),
          descanso: cells[4].textContent.trim()
        };
      });

      const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
      const coachId = currentUser ? currentUser.id : '6a124a584aa0ab34922bfddb';

      btnGuardar.disabled = true;
      btnGuardar.innerHTML = rutinaId 
        ? '<span class="spinner-border spinner-border-sm me-2"></span>Actualizando...'
        : '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

      const method = rutinaId ? 'PUT' : 'POST';
      const endpoint = rutinaId ? `${API_BASE_URL}/api/rutinas/${rutinaId}` : `${API_BASE_URL}/api/rutinas`;

      try {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coachId,
            nombreRutina: nombre,
            objetivo,
            nivel,
            notes: notas, // Mapear notas
            notas: notas,
            ejercicios
          })
        });

        const data = await response.json();
        if (!response.ok) {
          const errMsg = data.errores ? data.errores.join('\n') : (data.message || 'Error al guardar la rutina');
          mostrarAlerta('Error al Guardar', errMsg, false);
          return;
        }

        const msgExito = rutinaId ? '¡Rutina actualizada exitosamente!' : '¡Rutina creada exitosamente!';
        mostrarAlerta('¡Rutina Guardada!', msgExito, true, () => {
          window.location.href = 'GestionRutina-coach.html';
        });

        // Redirección de cortesía tras 2.2 segundos si no hace clic en Entendido
        setTimeout(() => {
          const modalEl = document.getElementById('modalAlertaCrear');
          if (modalEl && modalEl.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
            window.location.href = 'GestionRutina-coach.html';
          }
        }, 2200);

      } catch (error) {
        mostrarAlerta('Error de Conexión', 'No se pudo conectar con el servidor.', false);
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="bi bi-floppy me-2"></i>Guardar Rutina';
      }
    });
  }

  function cargarPerfilSidebar() {
    const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    if (!currentUser) return;

    const isCoachPage = document.body && document.body.classList.contains('coach-page');
    if (!isCoachPage) return;

    const avatar = document.querySelector('.coach-sidebar .coach-user-avatar');
    const nombreEl = document.querySelector('.coach-sidebar .fw-semibold');
    const rolEl = document.querySelector('.coach-sidebar .coach-text-soft');

    if (nombreEl) {
      nombreEl.textContent = `${currentUser.nombre} ${currentUser.apellido}`;
    }
    if (avatar) {
      avatar.textContent = (currentUser.nombre.charAt(0) + (currentUser.apellido ? currentUser.apellido.charAt(0) : '')).toUpperCase();
    }
    if (rolEl) {
      rolEl.textContent = currentUser.rol === 'coach' ? 'Entrenador' : 'Usuario';
    }
  }

  async function initDashboardCoach() {
    const rutinasEl = document.getElementById('contadorRutinas');
    const usuariosEl = document.getElementById('contadorUsuarios');
    const ejerciciosEl = document.getElementById('contadorEjercicios');
    if (!rutinasEl || !usuariosEl || !ejerciciosEl) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';
    const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    const coachId = currentUser ? currentUser.id : '6a124a584aa0ab34922bfddb';

    try {
      const [rutinasRes, clientesRes, ejerciciosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/rutinas`),
        fetch(`${API_BASE_URL}/api/coach-cliente/coach/${coachId}`),
        fetch(`${API_BASE_URL}/api/ejercicios`)
      ]);

      if (!rutinasRes.ok || !clientesRes.ok || !ejerciciosRes.ok) {
        throw new Error('Error al consultar datos en el servidor');
      }

      const rutinas = await rutinasRes.json();
      const clientes = await clientesRes.json();
      const ejercicios = await ejerciciosRes.json();

      // Filtrar las rutinas creadas por este coach en particular
      const rutinasDelCoach = rutinas.filter(
        r => String(r.coachId._id || r.coachId) === coachId
      );

      // Actualizar el DOM con las estadísticas reales
      rutinasEl.textContent = rutinasDelCoach.length;
      usuariosEl.textContent = clientes.length;
      ejerciciosEl.textContent = ejercicios.length;

    } catch (error) {
      console.error('Error al cargar estadísticas del dashboard:', error);
      rutinasEl.textContent = '0';
      usuariosEl.textContent = '0';
      ejerciciosEl.textContent = '0';
    }
  }

  // Cargar perfil en la barra lateral automáticamente
  cargarPerfilSidebar();

  window.initGestionRutinaCoach = initGestionRutinaCoach;
  window.initCrearRutinaCoach = initCrearRutinaCoach;
  window.initDashboardCoach = initDashboardCoach;
})();
