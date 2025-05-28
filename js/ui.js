// ui.js - Funciones de interfaz de usuario y mensajes
import { DOM } from './dom.js';

// Importaciones necesarias para mostrarMenu
import { getUsuarioActual } from './auth.js';

// --- Función para escapar texto y prevenir XSS ---
export function escapeHTML(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
}

// Mostrar mensajes en el login con timeout
export function mostrarMensajeLogin(mensaje, tipo = 'info') {
  let cont = document.getElementById('loginMensaje');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'loginMensaje';
    cont.style.marginTop = '10px';
    cont.style.textAlign = 'center';
    DOM.loginSection.appendChild(cont);
  }
  cont.textContent = mensaje;
  cont.style.color = tipo === 'error' ? '#dc2626' : '#2563eb';
  cont.style.fontWeight = 'bold';
  
  // Auto-hide después de 3 segundos para errores
  if (tipo === 'error') {
    setTimeout(() => {
      cont.textContent = '';
    }, 3000);
  }
}

// Mostrar mensajes en el registro con timeout
export function mostrarMensajeRegistro(mensaje, tipo = 'info') {
  let cont = document.getElementById('registroMensaje');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'registroMensaje';
    cont.style.marginTop = '10px';
    cont.style.textAlign = 'center';
    DOM.registroSection.appendChild(cont);
  }
  cont.textContent = mensaje;
  if (tipo === 'success') {
    cont.style.color = '#16a34a';
  } else if (tipo === 'error') {
    cont.style.color = '#dc2626';
  } else {
    cont.style.color = '#2563eb';
  }
  cont.style.fontWeight = 'bold';
  
  // Auto-hide después de 3 segundos para errores
  if (tipo === 'error') {
    setTimeout(() => {
      cont.textContent = '';
    }, 3000);
  }
}

// Reemplazo de alert, confirm y prompt por mensajes/modales estilizados
export function mostrarMensajeUI(mensaje, tipo = 'info', contenedor = document.body) {
  let cont = document.getElementById('mensajeUI');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'mensajeUI';
    cont.style.position = 'fixed';
    cont.style.top = '20px';
    cont.style.left = '50%';
    cont.style.transform = 'translateX(-50%)';
    cont.style.zIndex = 9999;
    cont.style.padding = '16px 32px';
    cont.style.borderRadius = '8px';
    cont.style.fontWeight = 'bold';
    cont.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    cont.style.fontSize = '1.1rem';
    cont.style.maxWidth = '90vw';
    cont.style.textAlign = 'center';
    contenedor.appendChild(cont);
  }
  cont.textContent = mensaje;
  cont.style.background = tipo === 'error' ? '#fee2e2' : tipo === 'success' ? '#dcfce7' : '#dbeafe';
  cont.style.color = tipo === 'error' ? '#b91c1c' : tipo === 'success' ? '#166534' : '#1e40af';
  cont.style.border = tipo === 'error' ? '2px solid #b91c1c' : tipo === 'success' ? '2px solid #166534' : '2px solid #1e40af';
  cont.style.display = 'block';
  setTimeout(() => {
    cont.style.display = 'none';
  }, 2500);
}

// Reemplazo de confirmación por modal estilizado
export function mostrarConfirmacionUI(mensaje, onConfirm) {
  let modal = document.getElementById('modalConfirmacionUI');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalConfirmacionUI';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.3)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = 10000;    modal.innerHTML = `
      <div style="background:#fff;padding:32px 24px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.18);max-width:90vw;min-width:260px;text-align:center;">
        <div id="mensajeConfirmacion" style="margin-bottom:18px;font-size:1.1rem;">${escapeHTML(mensaje)}</div>
        <button id="btnConfirmarUI" style="background:#2563eb;color:#fff;padding:8px 20px;border:none;border-radius:6px;font-weight:bold;margin-right:10px;">Aceptar</button>
        <button id="btnCancelarUI" style="background:#e5e7eb;color:#1e293b;padding:8px 20px;border:none;border-radius:6px;font-weight:bold;">Cancelar</button>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    // Actualizar el mensaje correctamente usando el ID específico
    const mensajeDiv = modal.querySelector('#mensajeConfirmacion');
    if (mensajeDiv) {
      mensajeDiv.textContent = mensaje;
    }
    modal.style.display = 'flex';  }
  
  // Limpiar event listeners existentes y agregar nuevos
  const btnConfirmar = modal.querySelector('#btnConfirmarUI');
  const btnCancelar = modal.querySelector('#btnCancelarUI');
  
  // Clonar los botones para remover todos los event listeners existentes
  const nuevoBtnConfirmar = btnConfirmar.cloneNode(true);
  const nuevoBtnCancelar = btnCancelar.cloneNode(true);
  
  btnConfirmar.parentNode.replaceChild(nuevoBtnConfirmar, btnConfirmar);
  btnCancelar.parentNode.replaceChild(nuevoBtnCancelar, btnCancelar);
  
  // Agregar los nuevos event listeners
  nuevoBtnConfirmar.onclick = () => {
    modal.style.display = 'none';
    onConfirm();
  };
  nuevoBtnCancelar.onclick = () => {
    modal.style.display = 'none';
  };
}

// Configurar validación de contraseña en tiempo real
export async function configurarValidacionPassword() {
  // Importar funciones de validación
  const { 
    validarNombreUsuario, 
    validarEmail, 
    evaluarFortalezaPassword, 
    validarCoincidenciaPassword,
    evaluarRequisitosPassword
  } = await import('./utils.js');
  const regPassword = document.getElementById("regPassword");
  const regPasswordConfirm = document.getElementById("regPasswordConfirm");
  const regUsuario = document.getElementById("regUsuario");
  const regEmail = document.getElementById("regEmail");
  const registerBtn = document.getElementById("btnRegistro");

  // Validación de usuario en tiempo real
  regUsuario.addEventListener("input", function (e) {
    const username = e.target.value;
    const feedbackDiv = document.getElementById("usernameFeedback");
    
    if (username.length === 0) {
      feedbackDiv.innerHTML = "";
      e.target.classList.remove("border-green-500", "border-red-500");
    } else {
      const isValid = validarNombreUsuario(username);
      
      if (isValid) {
        feedbackDiv.innerHTML = `<p class="text-green-500">✓ Nombre de usuario válido</p>`;
        e.target.classList.add("border-green-500");
        e.target.classList.remove("border-red-500");
      } else {
        feedbackDiv.innerHTML = `<p class="text-red-500">✗ Debe tener 3-20 caracteres (letras, números, guiones bajos)</p>`;
        e.target.classList.add("border-red-500");
        e.target.classList.remove("border-green-500");
      }
    }
    
    checkFormValidity();
  });

  // Validación de email en tiempo real
  regEmail.addEventListener("input", function (e) {
    const email = e.target.value;
    const feedbackDiv = document.getElementById("emailFeedback");
    
    if (email.length === 0) {
      feedbackDiv.innerHTML = "";
      e.target.classList.remove("border-green-500", "border-red-500");
    } else {
      const isValid = validarEmail(email);
      
      if (isValid) {
        feedbackDiv.innerHTML = `<p class="text-green-500">✓ Email válido</p>`;
        e.target.classList.add("border-green-500");
        e.target.classList.remove("border-red-500");
      } else {
        feedbackDiv.innerHTML = `<p class="text-red-500">✗ Formato de email inválido</p>`;
        e.target.classList.add("border-red-500");
        e.target.classList.remove("border-green-500");
      }
    }
    
    checkFormValidity();
  });
  // Validación de contraseña en tiempo real con indicadores visuales
  regPassword.addEventListener("input", function (e) {
    const password = e.target.value;
    
    if (password.length === 0) {
      // Resetear todos los indicadores a rojo cuando está vacío
      const reqElements = ['req-length', 'req-uppercase', 'req-lowercase', 'req-number', 'req-special'];
      reqElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.className = 'text-red-500 transition-colors';
      });
      e.target.classList.remove("border-green-500", "border-red-500");
    } else {      // Evaluar y actualizar indicadores visuales
      const esValida = evaluarRequisitosPassword(password);
      
      // Cambiar borde según validez
      e.target.classList.remove("border-green-500", "border-red-500");
      if (esValida) {
        e.target.classList.add("border-green-500");
      } else {
        e.target.classList.add("border-red-500");
      }
    }
    
    // Revalidar confirmación de contraseña
    if (regPasswordConfirm.value) {
      regPasswordConfirm.dispatchEvent(new Event('input'));
    }
    
    checkFormValidity();
  });

  // Validación de confirmación de contraseña
  regPasswordConfirm.addEventListener("input", function (e) {
    const confirmPassword = e.target.value;
    const password = regPassword.value;
    const feedbackDiv = document.getElementById("passwordConfirmFeedback");
    
    if (confirmPassword.length === 0) {
      feedbackDiv.innerHTML = "";
      e.target.classList.remove("border-green-500", "border-red-500");
    } else {
      const isValid = validarCoincidenciaPassword(password, confirmPassword);
      
      if (isValid) {
        feedbackDiv.innerHTML = `<p class="text-green-500">✓ Las contraseñas coinciden</p>`;
        e.target.classList.add("border-green-500");
        e.target.classList.remove("border-red-500");
      } else {
        feedbackDiv.innerHTML = `<p class="text-red-500">✗ Las contraseñas no coinciden</p>`;
        e.target.classList.add("border-red-500");
        e.target.classList.remove("border-green-500");
      }
    }
      checkFormValidity();
  });

  // Función para verificar validez completa del formulario (simplificada)
  function checkFormValidity() {
    const username = regUsuario.value;
    const email = regEmail.value;
    const password = regPassword.value;
    const confirmPassword = regPasswordConfirm.value;
    
    const isUsernameValid = validarNombreUsuario(username);
    const isEmailValid = validarEmail(email);
    const isPasswordValid = evaluarFortalezaPassword(password).esValida;
    const isConfirmValid = validarCoincidenciaPassword(password, confirmPassword);
    
    const isFormValid = isUsernameValid && isEmailValid && isPasswordValid && isConfirmValid;
    
    registerBtn.disabled = !isFormValid;
    registerBtn.textContent = "Crear Cuenta";
    
    if (isFormValid) {
      registerBtn.classList.remove("bg-gray-400");
      registerBtn.classList.add("bg-gray-900", "hover:bg-gray-800");
    } else {
      registerBtn.classList.add("bg-gray-400");
      registerBtn.classList.remove("bg-gray-900", "hover:bg-gray-800");
    }
  }
}

// Mostrar el menú principal tras login o registro exitoso
export function mostrarMenu() {
  // Oculta login y registro
  DOM.loginSection.classList.add("hidden");
  DOM.registroSection.classList.add("hidden");
  // Muestra el menú principal
  DOM.menuSection.classList.remove("hidden");
  // Mensaje de bienvenida
  if (getUsuarioActual()) {
    DOM.bienvenida.textContent = `Bienvenido, ${getUsuarioActual().nombre} (${getUsuarioActual().rol})`;
  }
  
  // Generar botones de acciones según el rol
  generarBotonesAcciones();
  
  // Muestra el inventario del usuario actual automáticamente (de forma asíncrona y segura)
  if (getUsuarioActual() && getUsuarioActual().nombre) {
    setTimeout(() => {
      // Importación dinámica para evitar dependencia circular
      import('./inventory.js').then(inventoryModule => {
        inventoryModule.mostrarInventario(getUsuarioActual().nombre);
      });
    }, 100);
  }
}

// Generar botones de acciones según el rol del usuario
function generarBotonesAcciones() {
  DOM.acciones.innerHTML = '';
  
  if (getUsuarioActual().rol === 'administrador') {    
    // Botones para administrador
    DOM.acciones.innerHTML = `
      <button id="btnMiInventario" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
        <span>Mi Inventario</span>
      </button>
      <button id="btnVerInventarios" class="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
        <span>Ver Inventarios</span>
      </button>      <button id="btnAdministrarUsuarios" class="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
        <span>Administrar Usuarios</span>
      </button>
      <button id="btnMiPerfil" class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
        <i class="fas fa-user-cog"></i>
        <span>Mi Perfil</span>
      </button>
    `;
    
    // Agregar event listeners
    document.getElementById('btnMiInventario').addEventListener('click', () => {
      import('./inventory.js').then(inventoryModule => {
        inventoryModule.mostrarInventario(getUsuarioActual().nombre);
      });
    });
    
    document.getElementById('btnVerInventarios').addEventListener('click', () => {
      import('./admin.js').then(adminModule => {
        adminModule.mostrarSeleccionUsuario();
      });
    });
      document.getElementById('btnAdministrarUsuarios').addEventListener('click', () => {
      import('./admin.js').then(adminModule => {
        adminModule.administrarUsuarios();
      });
    });
    
    document.getElementById('btnMiPerfil').addEventListener('click', () => {
      import('./profile.js').then(profileModule => {
        profileModule.mostrarPerfilUsuario();
      });
    });
  } else {    // Botones para empleado
    DOM.acciones.innerHTML = `
      <button id="btnMiInventarioEmpleado" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
        <span>Mi Inventario</span>
      </button>
      <button id="btnMiPerfil" class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
        <i class="fas fa-user-cog"></i>
        <span>Mi Perfil</span>
      </button>
    `;
      // Agregar event listener
    document.getElementById('btnMiInventarioEmpleado').addEventListener('click', () => {
      import('./inventory.js').then(inventoryModule => {
        inventoryModule.mostrarInventario(getUsuarioActual().nombre);
      });
    });
    
    document.getElementById('btnMiPerfil').addEventListener('click', () => {
      import('./profile.js').then(profileModule => {
        profileModule.mostrarPerfilUsuario();
      });
    });
  }
}
