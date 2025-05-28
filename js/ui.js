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

// Mostrar mensajes en el login
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
}

// Mostrar mensajes en el registro
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
    modal.style.zIndex = 10000;
    modal.innerHTML = `
      <div style="background:#fff;padding:32px 24px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.18);max-width:90vw;min-width:260px;text-align:center;">
        <div style="margin-bottom:18px;font-size:1.1rem;">${escapeHTML(mensaje)}</div>
        <button id="btnConfirmarUI" style="background:#2563eb;color:#fff;padding:8px 20px;border:none;border-radius:6px;font-weight:bold;margin-right:10px;">Aceptar</button>
        <button id="btnCancelarUI" style="background:#e5e7eb;color:#1e293b;padding:8px 20px;border:none;border-radius:6px;font-weight:bold;">Cancelar</button>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.querySelector('div').firstChild.textContent = mensaje;
    modal.style.display = 'flex';
  }
  modal.querySelector('#btnConfirmarUI').onclick = () => {
    modal.style.display = 'none';
    onConfirm();
  };
  modal.querySelector('#btnCancelarUI').onclick = () => {
    modal.style.display = 'none';
  };
}

// Configurar validación de contraseña en tiempo real
export function configurarValidacionPassword() {
  document.getElementById("regPassword").addEventListener("input", function (e) {
    const password = e.target.value;
    const feedbackDiv = document.getElementById("passwordFeedback");
    const registerBtn = document.getElementById("btnRegistro");

    // Definir requisitos
    const requirements = [
      { regex: /.{8,}/, text: "Mínimo 8 caracteres" },
      { regex: /[A-Z]/, text: "Al menos 1 mayúscula" },
      { regex: /[a-z]/, text: "Al menos 1 minúscula" },
      { regex: /\d/, text: "Al menos 1 número" },
      { regex: /[@$!%*?&]/, text: "Al menos 1 carácter especial (@$!%*?&)" },
    ];

    // Verificar cada requisito
    let allValid = true;
    let feedbackHTML = "";

    requirements.forEach((req) => {
      const isValid = req.regex.test(password);
      allValid = allValid && isValid;
      feedbackHTML += `
            <p class="${isValid ? "text-green-500" : "text-red-500"}">
                ${isValid ? "✓" : "✗"} ${req.text}
            </p>
        `;
    });

    // Actualizar UI
    feedbackDiv.innerHTML = feedbackHTML;
    e.target.classList.toggle(
      "border-green-500",
      allValid && password.length > 0
    );
    e.target.classList.toggle("border-red-500", !allValid && password.length > 0);
    registerBtn.disabled = !allValid;
  });
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
      </button>
      <button id="btnAdministrarUsuarios" class="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
        <span>Administrar Usuarios</span>
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
  } else {
    // Botones para empleado
    DOM.acciones.innerHTML = `
      <button id="btnMiInventarioEmpleado" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
        <span>Mi Inventario</span>
      </button>
    `;
    
    // Agregar event listener
    document.getElementById('btnMiInventarioEmpleado').addEventListener('click', () => {
      import('./inventory.js').then(inventoryModule => {
        inventoryModule.mostrarInventario(getUsuarioActual().nombre);
      });
    });
  }
}
