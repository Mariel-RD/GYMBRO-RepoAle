(() => {
  function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('correo');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('loginSubmitBtn');
    const feedbackEl = document.getElementById('loginFeedback');
    if (!loginForm || !emailInput || !passwordInput || !submitBtn || !feedbackEl) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';

    function setFeedback(message, type) {
      feedbackEl.textContent = message;
      feedbackEl.style.display = 'block';
      feedbackEl.style.color = type === 'error' ? '#ff8f8f' : '#89f5c8';
    }

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!email || !password) {
        setFeedback('Completa correo y contraseña.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Entrando...';
      feedbackEl.style.display = 'none';

      try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) {
          setFeedback(data.message || 'No fue posible iniciar sesión.', 'error');
          return;
        }

        const usuario = data.Usuario;
        const token = data.token;

        if (!usuario || !token) {
          setFeedback('Respuesta de login incompleta.', 'error');
          return;
        }

        localStorage.setItem('fittracker_token', token);
        localStorage.setItem('fittracker_user', JSON.stringify(usuario));

        setFeedback('Login exitoso. Redirigiendo...', 'success');

        if (usuario.rol === 'coach') {
          window.location.href = 'dashboard-coach.html';
        } else {
          window.location.href = 'dashboard-cliente.html';
        }
      } catch (error) {
        setFeedback('No se pudo conectar con el servidor.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar';
      }
    });
  }

  function initRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const emailInput = document.getElementById('correo');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const rolInput = document.getElementById('rol');
    const termsCheck = document.getElementById('termsCheck');
    const submitBtn = document.getElementById('registerSubmitBtn');
    const feedbackEl = document.getElementById('registerFeedback');

    if (!registerForm || !nombreInput || !emailInput) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';

    function setFeedback(message, type) {
      feedbackEl.textContent = message;
      feedbackEl.style.display = 'block';
      feedbackEl.style.color = type === 'error' ? '#ff8f8f' : '#89f5c8';
    }

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const nombre = nombreInput.value.trim();
      const apellido = apellidoInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const rol = rolInput.value;

      if (!nombre || !apellido || !email || !password || !confirmPassword) {
        setFeedback('Todos los campos son obligatorios.', 'error');
        return;
      }

      if (password.length < 4) {
        setFeedback('La contraseña debe tener 4 caracteres o más.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        setFeedback('Las contraseñas no coinciden.', 'error');
        return;
      }

      if (rol === 'Selecciona una opción') {
        setFeedback('Por favor selecciona un rol válido.', 'error');
        return;
      }

      if (!termsCheck.checked) {
        setFeedback('Debes aceptar los términos y condiciones.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Registrando...';
      feedbackEl.style.display = 'none';

      try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nombre, apellido, email, password, rol })
        });

        const data = await response.json();
        if (!response.ok) {
          setFeedback(data.message || 'Error al registrar la cuenta.', 'error');
          return;
        }

        setFeedback('¡Registro exitoso! Redirigiendo al login...', 'success');
        
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);

      } catch (error) {
        setFeedback('No se pudo conectar con el servidor.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear cuenta';
      }
    });
  }

  function initProfilePage() {
    const nombreInput = document.getElementById('profileNombre');
    const apellidoInput = document.getElementById('profileApellido');
    const correoInput = document.getElementById('profileCorreo');
    const bioInput = document.getElementById('profileBio');
    const displayBio = document.getElementById('displayBio');
    const btnEdit = document.getElementById('btnEditProfile');
    const btnSave = document.getElementById('btnSaveProfile');
    const feedbackEl = document.getElementById('profileFeedback');

    if (!nombreInput || !btnEdit || !btnSave) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';

    let currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    if (!currentUser) return;

    function setAvatarContent(el, user) {
      if (!el) return;
      const imgSrc = user.fotoPerfil || null;
      if (imgSrc) {
        el.innerHTML = `<img src="${imgSrc}" alt="Foto de perfil"
          style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
      } else {
        const initials = (user.nombre.charAt(0) + (user.apellido ? user.apellido.charAt(0) : '')).toUpperCase();
        el.textContent = initials;
      }
    }

    function renderUserData(user) {
      nombreInput.value = user.nombre || '';
      apellidoInput.value = user.apellido || '';
      correoInput.value = user.email || '';
      
      if (bioInput) bioInput.value = user.bio || '';
      if (displayBio) {
          displayBio.textContent = user.bio ? `"${user.bio}"` : 'Aún no hay información agregada sobre ti.';
      }

      const fullName = `${user.nombre} ${user.apellido}`;
      
      const headerNames = document.querySelectorAll('.h3.mb-1, .fw-semibold');
      headerNames.forEach(el => {
        if (el.textContent.includes('Admin') || el.textContent.includes('Juan') || el.textContent.includes(currentUser.nombre)) {
            el.textContent = fullName;
        }
      });

      // Actualizar el avatar principal (#profileAvatarEl) con foto o iniciales
      const mainAvatarEl = document.getElementById('profileAvatarEl');
      setAvatarContent(mainAvatarEl, user);

      // Actualizar el sidebar también con la foto
      const sidebarAvatars = document.querySelectorAll('.coach-user-avatar');
      sidebarAvatars.forEach(el => setAvatarContent(el, user));

      const headerEmails = document.querySelectorAll('.bi-envelope');
      headerEmails.forEach(el => {
        if (el.parentNode.tagName === 'SPAN') {
          el.parentNode.innerHTML = `<i class="bi bi-envelope me-1"></i>${user.email}`;
        }
      });

      // Actualizar la fecha de registro y los días activos a partir de su ObjectId de MongoDB
      let joinDate = new Date();
      let activeDays = 1;
      if (user.id && user.id.length === 24) {
        try {
          const timestamp = parseInt(user.id.substring(0, 8), 16) * 1000;
          joinDate = new Date(timestamp);
          const diffTime = Math.abs(new Date() - joinDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          activeDays = Math.max(1, diffDays);
        } catch (e) {
          console.error('Error calculando fecha desde ObjectId', e);
        }
      }

      const activeDaysEl = document.getElementById('profile-active-days');
      if (activeDaysEl) {
        activeDaysEl.textContent = `${activeDays} ${activeDays === 1 ? 'día' : 'días'} activo`;
      }
    }

    renderUserData(currentUser);

    function setFeedback(message, type) {
      feedbackEl.textContent = message;
      feedbackEl.style.display = 'block';
      feedbackEl.style.color = type === 'error' ? '#ff8f8f' : '#89f5c8';
      setTimeout(() => { feedbackEl.style.display = 'none'; }, 4000);
    }

    // --- OVERLAY DE CÁMARA ---
    const inputFoto = document.getElementById('inputFotoPerfil');
    const avatarOverlay = document.getElementById('profileAvatarOverlay');
    let pendingFotoBase64 = null; // Base64 pendiente de guardar

    btnEdit.addEventListener('click', () => {
      nombreInput.removeAttribute('readonly');
      apellidoInput.removeAttribute('readonly');
      correoInput.removeAttribute('readonly');
      if (bioInput) bioInput.removeAttribute('readonly');

      // Mostrar overlay de cámara al entrar en modo edición
      if (avatarOverlay) avatarOverlay.style.display = 'flex';
      
      btnEdit.classList.add('d-none');
      btnSave.classList.remove('d-none');
    });

    // Preview inmediato al seleccionar imagen
    if (inputFoto) {
      inputFoto.addEventListener('change', () => {
        const file = inputFoto.files[0];
        if (!file) return;

        const MAX_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.size > MAX_SIZE) {
          setFeedback('La imagen no puede superar 2MB. Elige una imagen más pequeña.', 'error');
          inputFoto.value = '';
          pendingFotoBase64 = null;
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          pendingFotoBase64 = e.target.result;
          const avatarEl = document.getElementById('profileAvatarEl');
          if (avatarEl) {
            avatarEl.innerHTML = `<img src="${pendingFotoBase64}" alt="Foto de perfil"
              style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
          }
          setFeedback('Imagen lista. Haz clic en "Guardar Cambios" para aplicarla.', 'success');
        };
        reader.readAsDataURL(file);
      });
    }

    btnSave.addEventListener('click', async () => {
      const nombre = nombreInput.value.trim();
      const apellido = apellidoInput.value.trim();
      const email = correoInput.value.trim();

      if (!nombre || !apellido || !email) {
        setFeedback('Todos los campos son obligatorios', 'error');
        return;
      }

      btnSave.disabled = true;
      btnSave.textContent = 'Guardando...';

      try {
        const bodyData = { nombre, apellido, email };
        if (bioInput) bodyData.bio = bioInput.value.trim();
        // Incluir la foto solo si el usuario eligió una nueva
        if (pendingFotoBase64 !== null) bodyData.fotoPerfil = pendingFotoBase64;

        const response = await fetch(`${API_BASE_URL}/api/perfil/${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });

        const data = await response.json();
        if (!response.ok) {
          setFeedback(data.message || 'Error al actualizar', 'error');
          return;
        }

        currentUser = data.Usuario;
        localStorage.setItem('fittracker_user', JSON.stringify(currentUser));

        pendingFotoBase64 = null; // limpiar el pendiente
        renderUserData(currentUser);
        nombreInput.setAttribute('readonly', 'true');
        apellidoInput.setAttribute('readonly', 'true');
        correoInput.setAttribute('readonly', 'true');
        if (bioInput) bioInput.setAttribute('readonly', 'true');

        // Ocultar overlay de cámara al salir del modo edición
        if (avatarOverlay) avatarOverlay.style.display = 'none';
        if (inputFoto) inputFoto.value = '';

        btnSave.classList.add('d-none');
        btnEdit.classList.remove('d-none');
        setFeedback('¡Perfil actualizado con éxito!', 'success');

      } catch (error) {
        setFeedback('No se pudo conectar con el servidor', 'error');
      } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Guardar Cambios';
      }
    });
  }

  function initPasswordChange() {
    const btnSavePassword = document.getElementById('btnSavePassword');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const feedbackEl = document.getElementById('passwordFeedback');

    if (!btnSavePassword || !currentPasswordInput || !newPasswordInput || !confirmNewPasswordInput) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';
    const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    if (!currentUser) return;

    function setFeedback(message, type) {
      feedbackEl.textContent = message;
      feedbackEl.style.display = 'block';
      feedbackEl.style.color = type === 'error' ? '#ff8f8f' : '#89f5c8';
    }

    const modalEl = document.getElementById('changePasswordModal');
    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmNewPasswordInput.value = '';
        feedbackEl.style.display = 'none';
      });
    }

    btnSavePassword.addEventListener('click', async () => {
      const currentPassword = currentPasswordInput.value;
      const newPassword = newPasswordInput.value;
      const confirmNewPassword = confirmNewPasswordInput.value;

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        setFeedback('Todos los campos son obligatorios', 'error');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setFeedback('La nueva contraseña no coincide', 'error');
        return;
      }

      btnSavePassword.disabled = true;
      btnSavePassword.textContent = 'Actualizando...';
      feedbackEl.style.display = 'none';

      try {
        const response = await fetch(`${API_BASE_URL}/api/perfil/${currentUser.id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();
        if (!response.ok) {
          setFeedback(data.message || 'Error al cambiar la contraseña', 'error');
          return;
        }

        setFeedback('Contraseña actualizada con éxito', 'success');
        
        setTimeout(() => {
          if (typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
          }
        }, 2000);

      } catch (error) {
        setFeedback('No se pudo conectar con el servidor', 'error');
      } finally {
        btnSavePassword.disabled = false;
        btnSavePassword.textContent = 'Actualizar';
      }
    });
  }

  function initSidebarAvatar() {
    const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    if (!currentUser) return;

    const sidebarAvatars = document.querySelectorAll('.coach-user-avatar');
    if (!sidebarAvatars.length) return;

    sidebarAvatars.forEach(el => {
      if (currentUser.fotoPerfil) {
        // Asegurarse de que el contenedor sea redondo y corte la imagen correctamente
        el.style.overflow = 'hidden';
        el.style.padding = '0';
        el.innerHTML = `<img src="${currentUser.fotoPerfil}" alt="Foto de perfil"
          style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
      } else {
        const initials = (currentUser.nombre.charAt(0) + (currentUser.apellido ? currentUser.apellido.charAt(0) : '')).toUpperCase();
        el.textContent = initials;
      }
    });
  }

  function initLogout() {
    const btnLogout = document.getElementById('btnLogout');
    if (!btnLogout) return;

    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('fittracker_token');
      localStorage.removeItem('fittracker_user');
      window.location.href = 'GYMBRO.html';
    });
  }

  window.initLoginPage = initLoginPage;
  window.initRegisterPage = initRegisterPage;
  window.initProfilePage = initProfilePage;
  window.initPasswordChange = initPasswordChange;
  window.initLogout = initLogout;
  window.initSidebarAvatar = initSidebarAvatar;
})();
