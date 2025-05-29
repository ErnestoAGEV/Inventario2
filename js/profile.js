// profile.js - Gestión de perfil de usuario
import { db } from "../firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { DOM } from './dom.js';
import { getUsuarioActual, cerrarSesion } from './auth.js';
import { hashPassword, validarPassword } from './utils.js';
import { escapeHTML, mostrarMensajeUI, mostrarConfirmacionUI } from './ui.js';
import { precaucionOperacion } from './security.js';

// Configurar eventos del perfil
export function configurarEventosPerfil() {
  // Evento para mostrar perfil desde el menú
  document.addEventListener('click', (e) => {
    if (e.target.id === 'btnMiPerfil') {
      mostrarPerfilUsuario();
    }
  });
}

// Mostrar modal de perfil de usuario
export function mostrarPerfilUsuario() {
  const usuario = getUsuarioActual();
  if (!usuario) {
    mostrarMensajeUI("Error: Usuario no autenticado", 'error');
    return;
  }

  // Crear modal de perfil si no existe
  let modal = document.getElementById('perfilModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'perfilModal';
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 hidden';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="glass-effect rounded-3xl shadow-2xl w-full max-w-md border border-white/20 max-h-[90vh] flex flex-col mx-4">
      <!-- Header fijo -->
      <div class="p-6 pb-4 border-b border-gray-200/30">
        <div class="text-center">
          <div class="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
            <i class="fas fa-user-cog text-white text-2xl"></i>
          </div>
          <h3 class="text-2xl font-bold text-gray-800">Mi Perfil</h3>
        </div>
      </div>
      
      <!-- Contenido con scroll -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
        <!-- Información del usuario -->
        <div class="bg-gray-50 p-4 rounded-xl mb-6">
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600 font-medium">Usuario:</span>
              <span class="text-gray-800 font-semibold">${escapeHTML(usuario.nombre)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 font-medium">Rol:</span>
              <span class="text-gray-800 font-semibold">${escapeHTML(usuario.rol.toUpperCase())}</span>
            </div>
          </div>
        </div>

        <!-- Formulario de cambio de contraseña -->
        <form id="formCambiarPassword" class="space-y-5">
          <div>
            <label class="block text-gray-700 font-medium mb-2">Contraseña Actual</label>
            <div class="relative">
              <input 
                id="currentPassword" 
                type="password" 
                class="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl bg-white/70 focus:ring-2 focus:ring-purple-300 focus:border-transparent transition input-focus" 
                placeholder="Ingresa tu contraseña actual"
                required
              />
              <i class="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          
          <div>
            <label class="block text-gray-700 font-medium mb-2">Nueva Contraseña</label>
            <div class="relative">
              <input 
                id="newPassword" 
                type="password" 
                class="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl bg-white/70 focus:ring-2 focus:ring-purple-300 focus:border-transparent transition input-focus" 
                placeholder="Crea tu nueva contraseña"
                required
              />
              <i class="fas fa-key absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
            <div id="passwordStrength" class="mt-2 text-xs text-gray-500"></div>
          </div>
          
          <div>
            <label class="block text-gray-700 font-medium mb-2">Confirmar Nueva Contraseña</label>
            <div class="relative">
              <input 
                id="confirmPassword" 
                type="password" 
                class="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl bg-white/70 focus:ring-2 focus:ring-purple-300 focus:border-transparent transition input-focus" 
                placeholder="Confirma tu nueva contraseña"
                required
              />
              <i class="fas fa-check-circle absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
            <div class="flex gap-4 mt-8">
            <button 
              type="button" 
              id="btnCancelarPerfil" 
              class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold transform hover:scale-105"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              id="btnGuardarPerfil" 
              class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold transform hover:scale-105"
            >
              Cambiar Contraseña
            </button>
          </div>
        </form>

        <!-- Zona de peligro -->
        <div class="mt-8 p-4 border-2 border-red-200 rounded-xl bg-red-50">
          <div class="flex items-center gap-2 mb-3">
            <i class="fas fa-exclamation-triangle text-red-600"></i>
            <h4 class="font-semibold text-red-800">Zona de Peligro</h4>
          </div>
          <p class="text-red-700 text-sm mb-4">Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.</p>
          <button 
            type="button" 
            id="btnEliminarCuenta"
            class="w-full bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <i class="fas fa-trash-alt"></i>
            Eliminar mi cuenta permanentemente
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');

  // Configurar eventos del modal
  configurarEventosPerfilModal();
}

// Configurar eventos del modal de perfil
function configurarEventosPerfilModal() {
  const modal = document.getElementById('perfilModal');
  
  // Cerrar modal
  document.getElementById('btnCancelarPerfil').onclick = () => {
    modal.classList.add('hidden');
  };

  // Validación en tiempo real de nueva contraseña
  document.getElementById('newPassword').addEventListener('input', validarPasswordEnTiempoReal);

  // Validación de confirmación de contraseña
  document.getElementById('confirmPassword').addEventListener('input', validarConfirmacionPassword);

  // Envío del formulario
  document.getElementById('formCambiarPassword').onsubmit = async (e) => {
    e.preventDefault();
    await cambiarPassword();
  };

  // Eliminar cuenta
  document.getElementById('btnEliminarCuenta').onclick = () => {
    confirmarEliminarCuenta();
  };

  // Cerrar modal al hacer clic fuera
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  };
}

// Validar contraseña en tiempo real
function validarPasswordEnTiempoReal(e) {
  const password = e.target.value;
  const strengthDiv = document.getElementById('passwordStrength');
  
  if (!password) {
    strengthDiv.innerHTML = '';
    return;
  }

  const requirements = [
    { regex: /.{8,}/, text: "Mínimo 8 caracteres" },
    { regex: /[A-Z]/, text: "Al menos 1 mayúscula" },
    { regex: /[a-z]/, text: "Al menos 1 minúscula" },
    { regex: /\d/, text: "Al menos 1 número" },
    { regex: /[@$!%*?&]/, text: "Al menos 1 carácter especial (@$!%*?&)" },
  ];

  let validCount = 0;
  let strengthHTML = "";

  requirements.forEach((req) => {
    const isValid = req.regex.test(password);
    if (isValid) validCount++;
    strengthHTML += `
      <div class="${isValid ? "text-green-500" : "text-red-500"}">
        ${isValid ? "✓" : "✗"} ${req.text}
      </div>
    `;
  });

  strengthDiv.innerHTML = strengthHTML;

  // Cambiar color del borde según la fortaleza
  const input = e.target;
  input.classList.remove('border-red-500', 'border-yellow-500', 'border-green-500');
  
  if (validCount < 3) {
    input.classList.add('border-red-500');
  } else if (validCount < 5) {
    input.classList.add('border-yellow-500');
  } else {
    input.classList.add('border-green-500');
  }
}

// Validar confirmación de contraseña
function validarConfirmacionPassword(e) {
  const password = document.getElementById('newPassword').value;
  const confirm = e.target.value;
  const input = e.target;

  input.classList.remove('border-red-500', 'border-green-500');

  if (confirm) {
    if (password === confirm) {
      input.classList.add('border-green-500');
    } else {
      input.classList.add('border-red-500');
    }
  }
}

// Cambiar contraseña
async function cambiarPassword() {
  await precaucionOperacion();
  
  const currentPassword = document.getElementById('currentPassword').value.trim();
  const newPassword = document.getElementById('newPassword').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();
  const usuario = getUsuarioActual();

  // Validaciones
  if (!currentPassword || !newPassword || !confirmPassword) {
    mostrarMensajeUI("Completa todos los campos", 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    mostrarMensajeUI("Las contraseñas nuevas no coinciden", 'error');
    return;
  }

  if (!validarPassword(newPassword)) {
    mostrarMensajeUI(
      "La nueva contraseña debe contener:\n- 8+ caracteres\n- 1 mayúscula\n- 1 minúscula\n- 1 número\n- 1 carácter especial",
      'error'
    );
    return;
  }

  if (currentPassword === newPassword) {
    mostrarMensajeUI("La nueva contraseña debe ser diferente a la actual", 'error');
    return;
  }

  try {
    // Verificar contraseña actual
    const userRef = doc(db, "usuarios", usuario.nombre);
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      mostrarMensajeUI("Error: Usuario no encontrado", 'error');
      return;
    }

    const userData = docSnap.data();
    const currentHashedPassword = await hashPassword(currentPassword);
    
    if (userData.password !== currentHashedPassword) {
      mostrarMensajeUI("La contraseña actual es incorrecta", 'error');
      return;
    }

    // Confirmar cambio
    mostrarConfirmacionUI(
      "¿Estás seguro de cambiar tu contraseña?",
      async () => {
        try {
          const newHashedPassword = await hashPassword(newPassword);
          
          await updateDoc(userRef, {
            password: newHashedPassword,
            lastPasswordChange: new Date().toISOString()
          });

          mostrarMensajeUI("Contraseña cambiada exitosamente", 'success');
          document.getElementById('perfilModal').classList.add('hidden');
          
          // Limpiar formulario
          document.getElementById('formCambiarPassword').reset();
        } catch (error) {
          console.error("Error al cambiar contraseña:", error);
          mostrarMensajeUI("Error al cambiar contraseña", 'error');
        }
      }
    );

  } catch (error) {    console.error("Error al verificar contraseña:", error);
    mostrarMensajeUI("Error al verificar contraseña actual", 'error');
  }
}

// Confirmar eliminación de cuenta
function confirmarEliminarCuenta() {
  const usuario = getUsuarioActual();
  
  // Mensaje de confirmación especial para eliminar cuenta
  mostrarConfirmacionUI(
    `¿Estás seguro de querer eliminar tu cuenta permanentemente?\n\nEsta acción no se puede deshacer\n\n¿Continuar?`,
    async () => {
      await eliminarMiCuenta();
    }
  );
}

// Eliminar la cuenta del usuario actual
async function eliminarMiCuenta() {
  await precaucionOperacion();
  
  const usuario = getUsuarioActual();
  
  try {
    // Eliminar inventario del usuario
    const inventarioRef = doc(db, "inventarios", usuario.nombre);
    const inventarioSnap = await getDoc(inventarioRef);
    if (inventarioSnap.exists()) {
      await deleteDoc(inventarioRef);
    }
    
    // Eliminar usuario
    await deleteDoc(doc(db, "usuarios", usuario.nombre));
    
    mostrarMensajeUI("Tu cuenta ha sido eliminada permanentemente", 'success');
    
    // Cerrar modal
    document.getElementById('perfilModal').classList.add('hidden');
      // Cerrar sesión automáticamente después de un breve delay
    setTimeout(() => {
      cerrarSesion();
    }, 2000);
    
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    mostrarMensajeUI("Error al eliminar la cuenta: " + error.message, 'error');
  }
}
