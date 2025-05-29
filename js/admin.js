// admin.js - Funciones de administración
import { db } from "../firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { DOM } from './dom.js';
import { getUsuarioActual } from './auth.js';
import { hashPassword, validarPassword } from './utils.js';
import { escapeHTML, mostrarMensajeUI, mostrarConfirmacionUI } from './ui.js';
import { precaucionOperacion } from './security.js';
import { mostrarInventario } from './inventory.js';

// Variables globales de administración
export let usuarioEditando = null;

export function setUsuarioEditando(usuario) {
  usuarioEditando = usuario;
}

// Configurar eventos de administración
export function configurarEventosAdmin() {
  // Usuarios
  DOM.btnCancelarUsuarios.addEventListener("click", () => {
    DOM.usuariosModal.classList.add("hidden");
  });

  DOM.btnCancelarEditarUsuario.addEventListener("click", () => {
    DOM.usuarioEditarModal.classList.add("hidden");
  });  DOM.btnGuardarUsuario.addEventListener("click", guardarUsuario);
  DOM.buscarUsuario.addEventListener("input", filtrarUsuarios);
}

// Funciones de administración de usuarios
export async function administrarUsuarios() {
  if (getUsuarioActual().rol !== "administrador") {
    alert("No tienes permisos para acceder a esta función");
    return;
  }

  // Cargar usuarios desde Firebase
  await cargarUsuarios();
  DOM.usuariosModal.classList.remove("hidden");
}

export async function cargarUsuarios() {
  const usuariosRef = collection(db, "usuarios");
  const snapshot = await getDocs(usuariosRef);
  const usuarioActualNombre = getUsuarioActual().nombre;
  DOM.tablaUsuarios.innerHTML = "";
  
  if (snapshot.empty) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="3" class="py-4 text-center text-gray-500">No hay usuarios registrados</td>`;
    DOM.tablaUsuarios.appendChild(row);
    return;
  }
    let usuariosVisibles = 0;
  snapshot.forEach((docu) => {
    const usuario = docu.data();
    const usuarioId = docu.id;
    
    // FILTRO: Completamente ocultar el usuario actual (no debe aparecer en la lista)
    if (usuarioId === usuarioActualNombre) {
      return; // Saltar el usuario actual por completo
    }
    
    // FILTRO DE SEGURIDAD: Ocultar otros administradores
    if (usuario.rol === "administrador") {
      return; // Saltar otros administradores
    }
    
    usuariosVisibles++;
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";
    
    // Solo mostrar botones de editar y eliminar (ya no hay usuario actual en la lista)
    const accionesHTML = `
      <button class="editar-usuario-btn bg-yellow-500 text-white py-1 px-2 rounded mr-2 hover:bg-yellow-600" data-id="${escapeHTML(usuarioId)}">
         Editar
       </button>
       <button class="eliminar-usuario-btn bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600" data-id="${escapeHTML(usuarioId)}">
         Eliminar
       </button>`;
    
    row.innerHTML = `
      <td class="py-2 px-4 border">${escapeHTML(usuarioId)}</td>
      <td class="py-2 px-4 border">${escapeHTML(usuario.rol.toUpperCase())}</td>
      <td class="py-2 px-4 border">
        ${accionesHTML}
      </td>
    `;
    
    DOM.tablaUsuarios.appendChild(row);
    
    // Agregar event listeners
    const editarBtn = row.querySelector(".editar-usuario-btn");
    const eliminarBtn = row.querySelector(".eliminar-usuario-btn");
    
    if (editarBtn) {
      editarBtn.addEventListener("click", () => editarUsuario(usuarioId, usuario));
    }
    if (eliminarBtn) {
      eliminarBtn.addEventListener("click", () => confirmarEliminarUsuario(usuarioId));
    }
  });
  
  // Si no hay usuarios visibles después del filtro
  if (usuariosVisibles === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="3" class="py-4 text-center text-gray-500">No hay usuarios disponibles para administrar</td>`;
    DOM.tablaUsuarios.appendChild(row);
  }
}

export function filtrarUsuarios() {
  const termino = DOM.buscarUsuario.value.toLowerCase();
  const filas = DOM.tablaUsuarios.querySelectorAll("tr");

  filas.forEach((fila) => {
    if (fila.querySelector("td")) {
      const nombreUsuario = fila.querySelector("td").textContent.toLowerCase();
      fila.style.display = nombreUsuario.includes(termino) ? "" : "none";
    }
  });
}

export function editarUsuario(usuarioId, usuarioData) {
  const usuarioActualNombre = getUsuarioActual().nombre;
  
  // No permitir editar otros administradores
  if (
    usuarioData.rol === "administrador" &&
    usuarioId !== usuarioActualNombre
  ) {
    alert("No puedes editar a otro administrador");
    return;
  }

  // No permitir editar el propio usuario desde la administración
  if (usuarioId === usuarioActualNombre) {
    mostrarMensajeUI("No puedes editar tu propia cuenta desde aquí. Usa la opción 'Mi Perfil' del menú.", 'info');
    return;
  }

  usuarioEditando = { id: usuarioId, ...usuarioData };
  DOM.usuarioModalTitle.textContent = "Editar Usuario";
  DOM.editUsuario.disabled = true;
  DOM.editUsuario.value = usuarioId;
  
  // Ocultar completamente el campo de contraseña - los admins no tienen acceso a contraseñas
  const passwordContainer = DOM.editPassword.closest('div');
  if (passwordContainer) {
    passwordContainer.style.display = 'none';
  }
  
  // Ocultar completamente el botón de reseteo - los admins no manejan contraseñas
  const resetContainer = document.getElementById('resetPasswordContainer');
  if (resetContainer) {
    resetContainer.classList.add('hidden');
  }
  
  DOM.editRol.value = usuarioData.rol;
  DOM.usuarioEditarModal.classList.remove("hidden");
}

export function confirmarEliminarUsuario(usuarioId) {
  // No permitir eliminar el propio usuario
  if (usuarioId === getUsuarioActual().nombre) {
    alert("No puedes eliminar tu propio usuario mientras estás conectado");
    return;
  }

  // Obtener datos del usuario a eliminar
  getDoc(doc(db, "usuarios", usuarioId)).then((docSnap) => {
    if (docSnap.exists()) {
      const usuario = docSnap.data();

      // No permitir eliminar administradores
      if (usuario.rol === "administrador") {
        alert("No puedes eliminar a otros administradores");
        return;
      }

      mostrarConfirmacionUI(
        `¿Estás seguro de eliminar el usuario "${escapeHTML(usuarioId)}"? Esta acción no se puede deshacer.`,
        () => eliminarUsuario(usuarioId)
      );
    }
  });
}

export async function eliminarUsuario(usuarioId) {
  await precaucionOperacion();
  try {
    await deleteDoc(doc(db, "usuarios", usuarioId));
    const inventarioRef = doc(db, "inventarios", usuarioId);
    const inventarioSnap = await getDoc(inventarioRef);
    if (inventarioSnap.exists()) {
      await deleteDoc(inventarioRef);
    }
    await cargarUsuarios();
    mostrarMensajeUI("Usuario eliminado correctamente", 'success');
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    mostrarMensajeUI("Error al eliminar usuario", 'error');
  }
}

export async function guardarUsuario() {
  await precaucionOperacion();
  const usuario = DOM.editUsuario.value.trim();
  const rol = DOM.editRol.value;
  
  if (!usuario) {
    mostrarMensajeUI("El nombre de usuario es obligatorio", 'error');
    return;
  }
  
  try {
    if (usuarioEditando) {
      // Editar usuario existente - solo actualizar rol (los administradores NO manejan contraseñas)
      await updateDoc(doc(db, "usuarios", usuarioEditando.id), {
        rol,
      });
      mostrarMensajeUI("Usuario actualizado correctamente", 'success');
    } else {
      // Los administradores NO pueden crear usuarios nuevos ya que no manejan contraseñas
      // La creación de usuarios debe hacerse a través de un proceso separado
      mostrarMensajeUI("Los administradores no pueden crear usuarios nuevos. Los usuarios deben ser creados por el sistema.", 'error');
      return;
    }
    DOM.usuarioEditarModal.classList.add("hidden");
    await cargarUsuarios();
  } catch (error) {
    console.error("Error al guardar usuario:", error);
    mostrarMensajeUI("Error al guardar usuario: " + error.message, 'error');
  }
}

export async function mostrarSeleccionUsuario() {
  if (getUsuarioActual().rol !== "administrador") {
    mostrarMensajeUI("No tienes permisos para esta función", 'error');
    return;
  }

  const usuariosRef = collection(db, "usuarios");
  const usuariosSnap = await getDocs(usuariosRef);
  const usuarioActualNombre = getUsuarioActual().nombre;
  let usuarios = [];
  
  usuariosSnap.forEach((docu) => {
    const userData = docu.data();
    const usuarioId = docu.id;
    
    // FILTRO: Excluir el usuario actual y otros administradores
    if (usuarioId === usuarioActualNombre) {
      return; // Saltar el usuario actual - redundante con el inventario propio
    }
    
    if (userData.rol === "administrador") {
      return; // Saltar otros administradores
    }
    
    usuarios.push({ id: usuarioId, ...userData });
  });

  if (usuarios.length === 0) {
    mostrarMensajeUI("No hay otros usuarios disponibles para ver sus inventarios. Para ver tu inventario usa el botón 'Ver Inventario'.", 'info');
    return;
  }

  // Crear modal de selección de usuarios
  let modal = document.getElementById('modalSeleccionUsuario');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalSeleccionUsuario';
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
    document.body.appendChild(modal);
  }

  let usuariosHTML = '';
  usuarios.forEach((user) => {
    usuariosHTML += `
      <div class="user-item flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer" data-user="${escapeHTML(user.id)}">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <i class="fas fa-user text-white text-sm"></i>
          </div>
          <div>
            <div class="font-medium text-gray-900">${escapeHTML(user.id)}</div>
            <div class="text-sm text-gray-600">${escapeHTML(user.rol.toUpperCase())}</div>
          </div>
        </div>
        <i class="fas fa-chevron-right text-gray-400"></i>
      </div>
    `;
  });

  modal.innerHTML = `
    <div style="background:#fff;padding:24px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);max-width:500px;width:90vw;max-height:80vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:1.25rem;font-weight:600;color:#1f2937;margin:0;">Seleccionar Usuario</h3>
        <button id="btnCerrarSeleccion" style="background:none;border:none;font-size:1.5rem;color:#6b7280;cursor:pointer;">&times;</button>
      </div>
      <div style="space-y:8px;">
        ${usuariosHTML}
      </div>
    </div>
  `;

  modal.style.display = 'flex';

  // Event listeners para el modal
  modal.querySelector('#btnCerrarSeleccion').onclick = () => {
    modal.style.display = 'none';
  };

  // Event listeners para cada usuario
  modal.querySelectorAll('.user-item').forEach(item => {
    item.onclick = () => {
      const userId = item.getAttribute('data-user');
      modal.style.display = 'none';
      mostrarInventario(userId);
    };
  });
  // Cerrar modal al hacer click fuera
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
}
