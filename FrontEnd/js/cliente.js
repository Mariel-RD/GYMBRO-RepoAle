(() => {
  function initProgresoCliente() {
    const isProgresoPage = document.querySelector('.progreso-cliente-page');
    if (!isProgresoPage) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';
    const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    if (!currentUser) return;

    const formProgreso = document.getElementById('form-progreso');
    const inputFecha = document.getElementById('input-fecha');
    const inputPeso = document.getElementById('input-peso');
    const inputNotas = document.getElementById('input-notas');
    const feedbackEl = document.getElementById('progresoFeedback');
    const submitBtn = formProgreso.querySelector('button[type="submit"]');
    const tbodyHistorial = document.getElementById('historialProgresoBody');

    if (!formProgreso || !inputFecha || !inputPeso) return;

    // Actualizar nombre/avatar del sidebar al usuario real
    const fullName = `${currentUser.nombre} ${currentUser.apellido}`;
    const initials = (currentUser.nombre.charAt(0) + (currentUser.apellido.charAt(0) || '')).toUpperCase();
    const sidebarName = document.querySelector('.coach-sidebar .fw-semibold');
    if (sidebarName) sidebarName.textContent = fullName;
    const sidebarAvatar = document.querySelector('.coach-sidebar .coach-user-avatar');
    if (sidebarAvatar) sidebarAvatar.textContent = initials;

    // Fecha por defecto: Hoy y restringir fechas futuras en UI
    const today = new Date().toISOString().split('T')[0];
    inputFecha.value = today;
    inputFecha.max = today;

    function setFeedback(message, type) {
      feedbackEl.textContent = message;
      feedbackEl.style.display = 'block';
      feedbackEl.style.color = type === 'error' ? '#ff8f8f' : '#89f5c8';
    }

    async function loadHistorial() {
      if (!tbodyHistorial) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/progresos/${currentUser.id}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error('Error al cargar');

        if (data.length === 0) {
          tbodyHistorial.innerHTML = '<tr><td colspan="3" class="text-center coach-text-soft py-4">No hay registros aún.</td></tr>';
          return;
        }

        data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        tbodyHistorial.innerHTML = data.map(registro => {
          const fechaFormateada = new Date(registro.fecha).toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' 
          });
          const notas = registro.notas ? registro.notas : '<span class="text-muted">-</span>';
          
          return `
            <tr>
              <td class="align-middle">${fechaFormateada}</td>
              <td class="align-middle fw-bold text-white">${registro.peso} kg</td>
              <td class="align-middle small coach-text-soft">${notas}</td>
            </tr>
          `;
        }).join('');

      } catch (error) {
        tbodyHistorial.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">Error al cargar el historial.</td></tr>';
      }
    }

    formProgreso.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fecha = inputFecha.value;
      const peso = inputPeso.value;
      const notas = inputNotas.value;

      if (!fecha || !peso || !notas.trim()) {
        setFeedback('Por favor completa todos los campos (fecha, peso y notas)', 'error');
        return;
      }

      if (new Date(fecha) > new Date(today)) {
        setFeedback('No puedes registrar un progreso en una fecha futura', 'error');
        return;
      }

      if (parseFloat(peso) <= 0 || parseFloat(peso) > 300) {
        setFeedback('Por favor ingresa un peso válido (mayor a 0 y máximo 300 kg)', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
      feedbackEl.style.display = 'none';

      try {
        const response = await fetch(`${API_BASE_URL}/api/progresos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteId: currentUser.id,
            fecha,
            peso,
            notas
          })
        });

        const data = await response.json();
        if (!response.ok) {
          setFeedback(data.message || 'Error al guardar progreso', 'error');
          return;
        }

        setFeedback('¡Progreso guardado exitosamente!', 'success');
        inputPeso.value = '';
        inputNotas.value = '';
        
        setTimeout(() => {
          feedbackEl.style.display = 'none';
        }, 3000);

        loadHistorial();

      } catch (error) {
        setFeedback('No se pudo conectar con el servidor', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-floppy me-2"></i> Guardar Progreso';
      }
    });

    loadHistorial();
  }

  function initMiCoach() {
    const isMiCoachPage = document.querySelector('.mi-coach-page');
    if (!isMiCoachPage) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';
    const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    if (!currentUser) return;

    // Actualizar sidebar con el nombre y avatar reales del cliente
    const fullName = `${currentUser.nombre} ${currentUser.apellido}`;
    const initials = (currentUser.nombre.charAt(0) + (currentUser.apellido.charAt(0) || '')).toUpperCase();
    const sidebarName = document.querySelector('.coach-sidebar .fw-semibold');
    if (sidebarName) sidebarName.textContent = fullName;
    const sidebarAvatar = document.querySelector('.coach-sidebar .coach-user-avatar');
    if (sidebarAvatar) sidebarAvatar.textContent = initials;

    const misCoachesContainer = document.getElementById('mis-coaches-container');
    const disponiblesContainer = document.getElementById('coaches-disponibles-container');
    if (!misCoachesContainer || !disponiblesContainer) return;

    function showFeedback(elementId, message, type = 'error') {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.textContent = message;
      el.style.display = 'block';
      el.style.color = type === 'error' ? '#ff8f8f' : '#89f5c8';
      setTimeout(() => { el.style.display = 'none'; }, 4000);
    }

    let allCoaches = [];
    let myCoachesIds = new Set();
    let coachReviewsCache = {};
    let currentSelectedCoach = null;

    function customConfirm(message, onConfirm) {
      const modalEl = document.getElementById('modalConfirmar');
      if (!modalEl) {
        if (confirm(message)) onConfirm();
        return;
      }
      
      document.getElementById('modalConfirmarMensaje').textContent = message;
      const btnConfirmar = document.getElementById('btn-confirmar-accion');
      
      const newBtn = btnConfirmar.cloneNode(true);
      newBtn.className = 'btn w-50';
      newBtn.style.backgroundColor = 'var(--coach-danger)';
      newBtn.style.borderColor = 'var(--coach-danger)';
      newBtn.style.color = '#fff';
      
      btnConfirmar.parentNode.replaceChild(newBtn, btnConfirmar);
      
      newBtn.addEventListener('click', () => {
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        onConfirm();
      });
      
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }

    function starsHTML(n) {
      let h = '';
      for (let i = 1; i <= 5; i++)
        h += `<i class="bi bi-star${i <= n ? '-fill' : (i - 0.5 <= n ? '-half' : '')}"></i>`;
      return h;
    }

    async function loadCoachesData() {
      try {
        const [coachesRes, vinculacionesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/coaches`),
          fetch(`${API_BASE_URL}/api/coach-cliente/cliente/${currentUser.id}`)
        ]);

        if (coachesRes.ok && vinculacionesRes.ok) {
          allCoaches = await coachesRes.json();
          const vinculaciones = await vinculacionesRes.json();
          myCoachesIds = new Set(vinculaciones.map(v => v.coachId));

          renderCoachesLists();
        }
      } catch (e) {
        console.error('Error cargando coaches', e);
      }
    }

    function renderCoachCard(coach, isActive) {
      const initials = (coach.nombre.charAt(0) + (coach.apellido ? coach.apellido.charAt(0) : '')).toUpperCase();
      const avgRating = coachReviewsCache[coach._id] ? coachReviewsCache[coach._id].avg : 0;
      const countReviews = coachReviewsCache[coach._id] ? coachReviewsCache[coach._id].count : 0;

      let avatarHtml = `<div class="coach-user-avatar flex-shrink-0" style="width:52px;height:52px;font-size:1.3rem;">${initials}</div>`;
      if (coach.fotoPerfil && coach.fotoPerfil.startsWith('data:image')) {
        avatarHtml = `<img src="${coach.fotoPerfil}" alt="${coach.nombre}" class="rounded-circle flex-shrink-0" style="width:52px;height:52px;object-fit:cover; border: 2px solid var(--coach-accent);">`;
      }

      return `
        <div class="col-12 col-md-6 col-xl-4">
          <article class="coach-card p-4 coach-card-clickable" style="cursor:pointer;" data-coach-id="${coach._id}">
            <div class="d-flex align-items-center gap-3 mb-3">
              ${avatarHtml}
              <div class="flex-grow-1 min-w-0">
                <p class="fw-semibold mb-0">${coach.nombre} ${coach.apellido}</p>
                <p class="coach-text-soft small mb-0">${coach.email}</p>
              </div>
              ${isActive ? '<span class="badge text-bg-success px-2 py-1 flex-shrink-0">Activo</span>' : ''}
            </div>
            <div class="d-flex align-items-center gap-2 mb-2">
              <div class="text-warning">${starsHTML(avgRating)}</div>
              <span class="coach-text-soft small">${avgRating.toFixed(1)} &middot; ${countReviews} reseñas</span>
            </div>
            <p class="coach-text-soft small mb-0"><i class="bi bi-eye me-1"></i>Click para ver perfil completo</p>
          </article>
        </div>
      `;
    }

    async function fetchReviewsForCoach(coachId) {
      if (coachReviewsCache[coachId]) return coachReviewsCache[coachId];
      try {
        const res = await fetch(`${API_BASE_URL}/api/resenas-coach/coach/${coachId}`);
        const resenas = await res.json();
        const count = resenas.length;
        const avg = count > 0 ? resenas.reduce((acc, r) => acc + r.calificacion, 0) / count : 0;
        coachReviewsCache[coachId] = { resenas, count, avg };
        return coachReviewsCache[coachId];
      } catch (e) {
        return { resenas: [], count: 0, avg: 0 };
      }
    }

    async function renderCoachesLists() {
      misCoachesContainer.innerHTML = '';
      disponiblesContainer.innerHTML = '';

      // Precargar reseñas para pintarlas
      await Promise.all(allCoaches.map(c => fetchReviewsForCoach(c._id)));

      allCoaches.forEach(coach => {
        const isActive = myCoachesIds.has(coach._id);
        const cardHTML = renderCoachCard(coach, isActive);
        if (isActive) misCoachesContainer.innerHTML += cardHTML;
        else disponiblesContainer.innerHTML += cardHTML;
      });

      if (misCoachesContainer.innerHTML === '') misCoachesContainer.innerHTML = '<p class="text-muted p-3">No tienes coaches activos.</p>';
      if (disponiblesContainer.innerHTML === '') disponiblesContainer.innerHTML = '<p class="text-muted p-3">No hay coaches disponibles.</p>';

      document.querySelectorAll('.coach-card-clickable').forEach(card => {
        card.addEventListener('click', () => openCoachModal(card.getAttribute('data-coach-id')));
      });
    }

    async function openCoachModal(coachId) {
      currentSelectedCoach = allCoaches.find(c => c._id === coachId);
      const c = currentSelectedCoach;
      if (!c) return;

      const initials = (c.nombre.charAt(0) + (c.apellido ? c.apellido.charAt(0) : '')).toUpperCase();
      const isActive = myCoachesIds.has(c._id);
      const alreadyHasCoach = myCoachesIds.size > 0;
      const revData = await fetchReviewsForCoach(c._id);

      if (c.fotoPerfil && c.fotoPerfil.startsWith('data:image')) {
        document.getElementById('modal-avatar').innerHTML = `<img src="${c.fotoPerfil}" alt="${c.nombre}" class="rounded-circle" style="width:100%; height:100%; object-fit:cover; border: 2px solid var(--coach-accent);">`;
      } else {
        document.getElementById('modal-avatar').textContent = initials;
      }
      document.getElementById('modal-nombre').textContent = `${c.nombre} ${c.apellido}`;
      document.getElementById('modal-especialidad').textContent = c.email;
      document.getElementById('modal-estrellas').innerHTML = starsHTML(revData.avg);
      document.getElementById('modal-rating-txt').textContent = `${revData.avg.toFixed(1)} (${revData.count} reseñas)`;

      document.getElementById('modal-bio').textContent = c.bio || 'Este coach aún no ha escrito sobre sí mismo.';
      document.getElementById('modal-stats').innerHTML = `
        <div class="col-6"><div class="p-3 rounded-3 text-center" style="background:rgba(33,217,123,.08);border:1px solid rgba(33,217,123,.15);">
          <p class="h4 fw-bold mb-0" style="color:var(--coach-accent);">${revData.avg.toFixed(1)}</p><p class="small coach-text-soft mb-0">Calificación</p></div></div>
        <div class="col-6"><div class="p-3 rounded-3 text-center" style="background:rgba(33,217,123,.08);border:1px solid rgba(33,217,123,.15);">
          <p class="h4 fw-bold mb-0" style="color:var(--coach-accent);">${revData.count}</p><p class="small coach-text-soft mb-0">Reseñas</p></div></div>
      `;

      document.getElementById('modal-accion').innerHTML = isActive
        ? `<div class="d-flex gap-2 mt-2">
             <button class="btn btn-dark-soft btn-sm" id="btn-show-review"><i class="bi bi-star me-1"></i>Calificar</button>
             <button class="btn coach-icon-btn coach-icon-btn-danger" id="btn-unlink-coach" title="Desvincular"><i class="bi bi-person-dash"></i></button>
           </div>`
        : alreadyHasCoach
          ? `<p class="coach-text-soft small mb-2">Ya tienes un coach seleccionado. Desvinculalo para elegir otro.</p>
             <button class="btn coach-btn-accent btn-sm" disabled><i class="bi bi-person-plus me-1"></i>Seleccionar Coach</button>`
          : `<button class="btn coach-btn-accent btn-sm mt-2" id="btn-link-coach"><i class="bi bi-person-plus me-1"></i>Seleccionar Coach</button>`;

      if (isActive) {
        document.getElementById('btn-show-review').addEventListener('click', () => {
          const profileModal = document.getElementById('modalPerfilCoach');
          const m = bootstrap.Modal.getOrCreateInstance(profileModal);
          
          const onHidden = () => {
            profileModal.removeEventListener('hidden.bs.modal', onHidden);
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalResena')).show();
          };
          
          profileModal.addEventListener('hidden.bs.modal', onHidden);
          m.hide();
        });
        document.getElementById('btn-unlink-coach').addEventListener('click', () => {
          customConfirm('¿Deseas desvincularte de este coach?', async () => {
            try {
              await fetch(`${API_BASE_URL}/api/coach-cliente`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clienteId: currentUser.id, coachId: c._id })
              });
              bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPerfilCoach')).hide();
              showFeedback('coachMainFeedback', 'Coach desvinculado correctamente.', 'success');
              loadCoachesData();
            } catch(e) { 
              showFeedback('coachModalFeedback', 'Error al desvincular: ' + e.message, 'error'); 
            }
          });
        });
      } else if (!alreadyHasCoach) {
        const linkCoachButton = document.getElementById('btn-link-coach');
        linkCoachButton.addEventListener('click', async () => {
          linkCoachButton.disabled = true;
          try {
            const response = await fetch(`${API_BASE_URL}/api/coach-cliente`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clienteId: currentUser.id, coachId: c._id })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'No fue posible seleccionar este coach');

            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPerfilCoach')).hide();
            showFeedback('coachMainFeedback', 'Coach seleccionado exitosamente.', 'success');
            await loadCoachesData();
          } catch(e) { 
            showFeedback('coachModalFeedback', 'Error al vincular: ' + e.message, 'error'); 
            linkCoachButton.disabled = false;
          }
        });
      }



      document.getElementById('modal-resenas').innerHTML = revData.resenas.length > 0 ? revData.resenas.map(r => {
        const u = r.clienteId || {};
        const revInitials = (u.nombre ? u.nombre.charAt(0) : 'U').toUpperCase();
        
        // Mostrar botón de eliminar solo si es la reseña del usuario activo
        const isMyReview = (u._id === currentUser.id);
        const deleteBtn = isMyReview 
          ? `<button class="btn btn-sm text-danger p-0 ms-2 btn-delete-review" data-rev-id="${r._id}" title="Eliminar mi reseña"><i class="bi bi-trash"></i></button>` 
          : '';

        return `<div class="p-3 rounded-3" style="background:#1b1f2c;border:1px solid var(--coach-border-soft);">
          <div class="d-flex align-items-center gap-3 mb-2">
            <div class="coach-user-avatar flex-shrink-0" style="width:36px;height:36px;font-size:0.85rem;">${revInitials}</div>
            <div class="flex-grow-1"><p class="fw-semibold mb-0 small d-flex align-items-center justify-content-between"><span>${u.nombre || 'Usuario'} ${u.apellido || ''}</span> ${deleteBtn}</p><div class="text-warning" style="font-size:.8rem;">${starsHTML(r.calificacion)}</div></div>
            <small class="coach-text-soft">${new Date(r.fechaResena).toLocaleDateString()}</small>
          </div><p class="small mb-0 coach-text-soft">${r.comentario || ''}</p></div>`;
      }).join('') : '<p class="text-muted">Aún no hay reseñas.</p>';

      // Listeners para botones de eliminar
      document.querySelectorAll('.btn-delete-review').forEach(btn => {
        btn.addEventListener('click', () => {
          customConfirm('¿Seguro que deseas eliminar tu reseña?', async () => {
            const revId = btn.getAttribute('data-rev-id');
            try {
              const res = await fetch(`${API_BASE_URL}/api/resenas-coach/${revId}`, { method: 'DELETE' });
              if (!res.ok) throw new Error('Falló al eliminar');
              coachReviewsCache[currentSelectedCoach._id] = null; // Invalidar caché
              await loadCoachesData(); // Recargar los coaches y el modal en el fondo
              showFeedback('coachModalFeedback', 'Reseña eliminada correctamente.', 'success');
              openCoachModal(currentSelectedCoach._id); // Refrescar el modal abierto
            } catch(e) {
              showFeedback('coachModalFeedback', 'Error al eliminar la reseña: ' + e.message, 'error');
            }
          });
        });
      });

      bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPerfilCoach')).show();
    }

    let selectedRating = 0;
    const stars = document.querySelectorAll('#star-rating .bi');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        selectedRating = +star.dataset.val;
        stars.forEach((s, i) => { s.className = i < selectedRating ? 'bi bi-star-fill' : 'bi bi-star'; });
      });
      star.addEventListener('mouseover', () => {
        const val = +star.dataset.val;
        stars.forEach((s, i) => { s.className = i < val ? 'bi bi-star-fill' : 'bi bi-star'; });
      });
    });
    
    const starContainer = document.getElementById('star-rating');
    if (starContainer) {
      starContainer.addEventListener('mouseleave', () => {
        stars.forEach((s, i) => { s.className = i < selectedRating ? 'bi bi-star-fill' : 'bi bi-star'; });
      });
    }

    const btnSubmitReview = document.querySelector('#modalResena .coach-btn-accent');
    if (btnSubmitReview) {
      btnSubmitReview.addEventListener('click', async () => {
        const text = document.getElementById('resena-texto').value;
        if (selectedRating === 0) {
          showFeedback('resenaFeedback', 'Por favor selecciona una calificación.', 'error');
          return;
        }
        
        btnSubmitReview.disabled = true;
        try {
          const response = await fetch(`${API_BASE_URL}/api/resenas-coach`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clienteId: currentUser.id, coachId: currentSelectedCoach._id, calificacion: selectedRating, comentario: text })
          });

          if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.message || 'Error del servidor');
          }

          bootstrap.Modal.getOrCreateInstance(document.getElementById('modalResena')).hide();
          coachReviewsCache[currentSelectedCoach._id] = null; // Invalidate cache
          loadCoachesData();
          document.getElementById('resena-texto').value = '';
          selectedRating = 0;
          document.querySelectorAll('#star-rating .bi').forEach(s => s.className = 'bi bi-star');
          showFeedback('coachMainFeedback', 'Reseña enviada correctamente.', 'success');
        } catch (e) {
          console.error(e);
          showFeedback('resenaFeedback', 'Error al enviar reseña: ' + e.message, 'error');
        } finally {
          btnSubmitReview.disabled = false;
        }
      });
    }

    loadCoachesData();
  }

  function initDashboardCliente() {
    const isDashboardPage = document.querySelector('.dashboard-cliente-page');
    if (!isDashboardPage) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';
    const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    if (!currentUser) return;

    // Actualizar sidebar
    const fullName = `${currentUser.nombre} ${currentUser.apellido}`;
    const initials = (currentUser.nombre.charAt(0) + (currentUser.apellido.charAt(0) || '')).toUpperCase();
    const sidebarName = document.querySelector('.coach-sidebar .fw-semibold');
    if (sidebarName) sidebarName.textContent = fullName;
    const sidebarAvatar = document.querySelector('.coach-sidebar .coach-user-avatar');
    if (sidebarAvatar) sidebarAvatar.textContent = initials;

    // Elementos del DOM
    const pesoEl = document.getElementById('dash-ultimo-peso');
    const sesionEl = document.getElementById('dash-ultima-sesion');
    const coachesContainer = document.getElementById('dash-mis-coaches');
    const rutinasActivasEl = document.getElementById('dash-rutinas-activas');
    const totalEjerciciosEl = document.getElementById('dash-total-ejercicios');

    // 1. Cargar último peso y sesión desde progresos
    async function loadProgresos() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/progresos/${currentUser.id}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        if (data.length > 0) {
          data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
          const ultimo = data[0];
          if (pesoEl) pesoEl.textContent = `${ultimo.peso} kg`;
          
          const fechaObj = new Date(ultimo.fecha);
          const dia = fechaObj.getUTCDate();
          const mes = fechaObj.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' });
          if (sesionEl) sesionEl.textContent = `${dia} ${mes}`;
        } else {
          if (pesoEl) pesoEl.textContent = '-- kg';
          if (sesionEl) sesionEl.textContent = '--';
        }
      } catch (e) {
        console.error('Error cargando progresos', e);
        if (pesoEl) pesoEl.textContent = '-- kg';
        if (sesionEl) sesionEl.textContent = '--';
      }
    }

    // 2. Cargar información de rutina (rutinas activas y cantidad de ejercicios)
    async function loadRutinaDashboard() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/asignacion-rutinas`);
        if (!response.ok) throw new Error();
        const asignaciones = await response.json();

        // Buscar asignación activa del cliente actual (la más reciente y válida)
        const validAsignaciones = asignaciones.filter(a => 
          a.clienteId && a.clienteId._id === currentUser.id && a.estado === 'activa' && a.rutinaId
        );
        const asignacionActiva = validAsignaciones[validAsignaciones.length - 1];

        if (asignacionActiva && asignacionActiva.rutinaId) {
          if (rutinasActivasEl) rutinasActivasEl.textContent = '1';
          
          const rutinaRes = await fetch(`${API_BASE_URL}/api/rutinas/${asignacionActiva.rutinaId._id}`);
          if (rutinaRes.ok) {
            const rutina = await rutinaRes.json();
            if (totalEjerciciosEl) totalEjerciciosEl.textContent = rutina.ejercicios ? rutina.ejercicios.length : '0';
          } else {
            if (totalEjerciciosEl) totalEjerciciosEl.textContent = '0';
          }
        } else {
          if (rutinasActivasEl) rutinasActivasEl.textContent = '0';
          if (totalEjerciciosEl) totalEjerciciosEl.textContent = '0';
        }
      } catch (e) {
        console.error('Error cargando rutina para dashboard', e);
        if (rutinasActivasEl) rutinasActivasEl.textContent = '0';
        if (totalEjerciciosEl) totalEjerciciosEl.textContent = '0';
      }
    }

    // Helpers
    function starsHTML(n) {
      let h = '';
      for (let i = 1; i <= 5; i++)
        h += `<i class="bi bi-star${i <= n ? '-fill' : (i - 0.5 <= n ? '-half' : '')}"></i>`;
      return h;
    }

    async function fetchReviewsForCoach(coachId) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/resenas-coach/coach/${coachId}`);
        const resenas = await res.json();
        const count = resenas.length;
        const avg = count > 0 ? resenas.reduce((acc, r) => acc + r.calificacion, 0) / count : 0;
        return { count, avg };
      } catch (e) {
        return { count: 0, avg: 0 };
      }
    }

    // 3. Cargar mis coaches activos
    async function loadCoaches() {
      try {
        const [coachesRes, vinculacionesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/coaches`),
          fetch(`${API_BASE_URL}/api/coach-cliente/cliente/${currentUser.id}`)
        ]);

        if (coachesRes.ok && vinculacionesRes.ok) {
          const allCoaches = await coachesRes.json();
          const vinculaciones = await vinculacionesRes.json();
          const myCoachesIds = new Set(vinculaciones.map(v => v.coachId));

          const activeCoaches = allCoaches.filter(c => myCoachesIds.has(c._id));

          if (activeCoaches.length === 0) {
            if (coachesContainer) coachesContainer.innerHTML = '<p class="text-muted p-3">Aún no has seleccionado a ningún coach.</p>';
            return;
          }

          let html = '';
          for (const coach of activeCoaches) {
            const revData = await fetchReviewsForCoach(coach._id);
            const initials = (coach.nombre.charAt(0) + (coach.apellido ? coach.apellido.charAt(0) : '')).toUpperCase();
            
            let avatarHtml = `<div class="coach-user-avatar flex-shrink-0" style="width:52px;height:52px;font-size:1.3rem;">${initials}</div>`;
            if (coach.fotoPerfil && coach.fotoPerfil.startsWith('data:image')) {
              avatarHtml = `<img src="${coach.fotoPerfil}" alt="${coach.nombre}" class="rounded-circle flex-shrink-0" style="width:52px;height:52px;object-fit:cover; border: 2px solid var(--coach-accent);">`;
            }
            
            html += `
              <div class="col-12 col-md-6 col-xl-4">
                <article class="coach-card p-4 d-flex align-items-center gap-3">
                  ${avatarHtml}
                  <div class="flex-grow-1 min-w-0">
                    <p class="fw-semibold mb-0">${coach.nombre} ${coach.apellido}</p>
                    <p class="coach-text-soft small mb-1">${coach.email}</p>
                    <div class="text-warning small d-flex align-items-center">
                      ${starsHTML(revData.avg)}
                      <span class="coach-text-soft ms-1">${revData.avg.toFixed(1)}</span>
                    </div>
                  </div>
                  <a href="mi-coach.html" class="btn btn-dark-soft btn-sm flex-shrink-0">Ver</a>
                </article>
              </div>
            `;
          }
          if (coachesContainer) coachesContainer.innerHTML = html;
        }
      } catch (e) {
        console.error('Error cargando coaches', e);
        if (coachesContainer) coachesContainer.innerHTML = '<p class="text-danger p-3">Error al cargar coaches.</p>';
      }
    }

    loadProgresos();
    loadRutinaDashboard();
    loadCoaches();
  }

  async function initRutinaCliente() {
    const isRutinaPage = document.querySelector('.rutina-cliente-page');
    if (!isRutinaPage) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';
    const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    if (!currentUser) return;

    // Actualizar sidebar con el nombre y avatar reales del cliente
    const fullName = `${currentUser.nombre} ${currentUser.apellido}`;
    const initials = (currentUser.nombre.charAt(0) + (currentUser.apellido.charAt(0) || '')).toUpperCase();
    const sidebarName = document.querySelector('.coach-sidebar .fw-semibold');
    if (sidebarName) sidebarName.textContent = fullName;
    const sidebarAvatar = document.querySelector('.coach-sidebar .coach-user-avatar');
    if (sidebarAvatar) sidebarAvatar.textContent = initials;

    // Contenedor a actualizar en la UI
    const containerElement = document.getElementById('rutina-cliente-container');
    if (!containerElement) return;

    try {
      // 1. Obtener todas las asignaciones y el catálogo de ejercicios
      const [asignacionesRes, ejerciciosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/asignacion-rutinas`),
        fetch(`${API_BASE_URL}/api/ejercicios`)
      ]);

      if (!asignacionesRes.ok) throw new Error('Error al conectar con el servidor');
      const asignaciones = await asignacionesRes.json();

      // Crear un mapeo rápido del catálogo completo para acceder a grupos musculares y videos
      const ejerciciosCatalogo = ejerciciosRes.ok ? await ejerciciosRes.json() : [];
      const ejercicioCatalogoMap = {};
      ejerciciosCatalogo.forEach(ej => {
        if (ej.nombreEjercicio) {
          ejercicioCatalogoMap[ej.nombreEjercicio.toLowerCase().trim()] = ej;
        }
      });

      // 2. Buscar la asignación activa para este cliente en específico
      // Invertimos el arreglo o usamos filter/pop para obtener la asignación más reciente y que tenga rutinaId válido
      const validAsignaciones = asignaciones.filter(a => 
        a.clienteId && a.clienteId._id === currentUser.id && a.estado === 'activa' && a.rutinaId
      );
      const asignacionActiva = validAsignaciones[validAsignaciones.length - 1];

      if (!asignacionActiva || !asignacionActiva.rutinaId) {
        // Renderizar estado de no tener rutina
        containerElement.innerHTML = `
          <div class="coach-card p-5 text-center">
            <div class="mb-3 text-warning" style="font-size: 3.5rem;">
              <i class="bi bi-clipboard2-x-fill"></i>
            </div>
            <h3 class="h4 text-white mb-2">Aún no tienes una rutina asignada</h3>
            <p class="coach-text-soft max-width-md mx-auto mb-4" style="max-width: 500px;">
              Ponte en contacto con tu coach para que diseñe un plan de entrenamiento adaptado a tus objetivos y nivel.
            </p>
            <a href="mi-coach.html" class="btn coach-btn-accent px-4 py-2">
              <i class="bi bi-people me-2"></i> Ir a Mi Coach
            </a>
          </div>
        `;
        return;
      }

      // 3. Obtener la rutina completa (con todos sus ejercicios) usando su ID
      const rutinaRes = await fetch(`${API_BASE_URL}/api/rutinas/${asignacionActiva.rutinaId._id}`);
      if (!rutinaRes.ok) throw new Error('Error al cargar la rutina asignada');
      const rutina = await rutinaRes.json();

      // Renderizar la sección superior con el resumen de la rutina
      const infoCardHTML = `
        <div class="coach-card p-3 p-md-4 mb-4">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span class="badge text-bg-success px-3 py-2">${rutina.objetivo}</span>
            <span class="badge rounded-pill text-bg-secondary px-3 py-2">${rutina.nivel}</span>
          </div>
          <h2 class="h3 text-white mb-2">${rutina.nombreRutina}</h2>
          ${rutina.notes ? `
            <p class="mb-0 coach-text-soft">
              <i class="bi bi-info-circle me-1"></i>
              ${rutina.notes}
            </p>
          ` : (rutina.notas ? `
            <p class="mb-0 coach-text-soft">
              <i class="bi bi-info-circle me-1"></i>
              ${rutina.notas}
            </p>
          ` : '<p class="mb-0 coach-text-soft"><i class="bi bi-info-circle me-1"></i> Sigue las indicaciones y descansa correctamente.</p>')}
        </div>
      `;

      // Organizar ejercicios por día de la semana
      const diasOrdenados = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
      const ejerciciosPorDia = {};
      
      rutina.ejercicios.forEach(ej => {
        if (!ejerciciosPorDia[ej.dia]) {
          ejerciciosPorDia[ej.dia] = [];
        }
        ejerciciosPorDia[ej.dia].push(ej);
      });

      // Renderizar los días
      let daysHTML = '<div class="d-flex flex-column gap-3">';
      let diasRenderizados = 0;

      diasOrdenados.forEach(dia => {
        const ejerciciosDia = ejerciciosPorDia[dia];
        if (!ejerciciosDia || ejerciciosDia.length === 0) return;

        diasRenderizados++;

        // Obtener grupos musculares únicos trabajados este día
        const gruposDia = [...new Set(ejerciciosDia.map(ej => {
          const catEj = ejercicioCatalogoMap[ej.ejercicio.toLowerCase().trim()];
          return catEj ? catEj.grupoMuscular : '';
        }).filter(Boolean))];

        const gruposString = gruposDia.length > 0 ? gruposDia.join(' & ') : 'General';
        const numEjercicios = ejerciciosDia.length;
        const isOpen = diasRenderizados === 1 ? 'open' : ''; // Solo abre el primer día renderizado por defecto

        daysHTML += `
          <details class="coach-card" ${isOpen}>
            <summary class="p-3 p-md-4 d-flex align-items-center justify-content-between" style="cursor:pointer; list-style:none;">
              <div class="d-flex align-items-center gap-3">
                <div class="coach-day-icon flex-shrink-0">
                  <i class="bi bi-lightning-charge-fill"></i>
                </div>
                <div>
                  <p class="fw-semibold mb-0">${dia}</p>
                  <p class="coach-text-soft small mb-0">${numEjercicios} ${numEjercicios === 1 ? 'ejercicio' : 'ejercicios'} &middot; ${gruposString}</p>
                </div>
              </div>
              <i class="bi bi-chevron-down coach-day-chevron ms-3"></i>
            </summary>

            <ul class="list-unstyled mb-0 px-3 px-md-4 pb-3">
              ${ejerciciosDia.map(ej => {
                const catEj = ejercicioCatalogoMap[ej.ejercicio.toLowerCase().trim()];
                const videoStr = catEj && catEj.videoUrl ? catEj.videoUrl : '';
                
                let videoBtnHtml = '';
                if (videoStr && videoStr.startsWith('data:video')) {
                  videoBtnHtml = `
                    <button class="btn btn-sm btn-outline-success d-flex align-items-center gap-1 flex-shrink-0 btn-play-video" data-ej-id="${catEj._id}">
                      <i class="bi bi-play-circle"></i> Video
                    </button>
                  `;
                } else {
                  videoBtnHtml = `
                    <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 flex-shrink-0" disabled title="Sin video disponible">
                      <i class="bi bi-camera-video-off"></i> Sin video
                    </button>
                  `;
                }

                return `
                  <li class="py-3 border-top border-secondary-subtle">
                    <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
                      <p class="fw-semibold mb-0 text-white">${ej.ejercicio}</p>
                      ${videoBtnHtml}
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                      <span class="badge text-bg-dark px-3 py-2"><strong>${ej.series}</strong> Series</span>
                      <span class="badge text-bg-dark px-3 py-2"><strong>${ej.repeticiones}</strong> Reps</span>
                      <span class="badge text-bg-dark px-3 py-2"><strong>${ej.descanso || '-'}</strong> Descanso</span>
                    </div>
                  </li>
                `;
              }).join('')}
            </ul>
          </details>
        `;
      });

      daysHTML += '</div>';

      // Actualizar el DOM de forma integrada en el contenedor dinámico
      containerElement.innerHTML = infoCardHTML + daysHTML;

      // Asignar listeners a los botones de reproducción de video
      containerElement.querySelectorAll('.btn-play-video').forEach(btn => {
        btn.addEventListener('click', () => {
          const ejId = btn.getAttribute('data-ej-id');
          const catEj = ejerciciosCatalogo.find(e => e._id === ejId);
          if (catEj && catEj.videoUrl) {
            const modalEl = document.getElementById('modalVideoReferencia');
            const videoEl = document.getElementById('reproductorVideo');
            if (modalEl && videoEl) {
              videoEl.src = catEj.videoUrl;
              const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
              
              modalEl.addEventListener('hidden.bs.modal', function onHidden() {
                videoEl.pause();
                videoEl.src = '';
                modalEl.removeEventListener('hidden.bs.modal', onHidden);
              });
              
              modal.show();
            }
          }
        });
      });

    } catch (error) {
      console.error('Error al cargar la rutina del cliente:', error);
      containerElement.innerHTML = `
        <div class="alert alert-danger font-medium p-4 rounded-3" role="alert" style="background-color: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.2); color: #f8d7da;">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          No se pudo conectar con el servidor para cargar las rutinas. Por favor, recarga la página.
        </div>
      `;
    }
  }

  window.initProgresoCliente = initProgresoCliente;
  window.initMiCoach = initMiCoach;
  window.initDashboardCliente = initDashboardCliente;
  window.initRutinaCliente = initRutinaCliente;
})();
