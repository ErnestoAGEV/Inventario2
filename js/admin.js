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

  DOM.btnNuevoUsuario.addEventListener("click", () => {
    usuarioEditando = null;
    DOM.usuarioModalTitle.textContent = "Nuevo Usuario";
    DOM.editUsuario.disabled = false;
    DOM.editUsuario.value = "";
    DOM.editPassword.value = "";
    DOM.editRol.value = "empleado";
    DOM.usuarioEditarModal.classList.remove("hidden");
  });

  DOM.btnCancelarEditarUsuario.addEventListener("click", () => {
    DOM.usuarioEditarModal.classList.add("hidden");
  });

  DOM.btnGuardarUsuario.addEventListener("click", guardarUsuario);
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
  DOM.tablaUsuarios.innerHTML = "";
  if (snapshot.empty) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="3" class="py-4 text-center text-gray-500">No hay usuarios registrados</td>`;
    DOM.tablaUsuarios.appendChild(row);
    return;
  }
  snapshot.forEach((docu) => {
    const usuario = docu.data();
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";
    row.innerHTML = `
      <td class="py-2 px-4 border">${escapeHTML(docu.id)}</td>
      <td class="py-2 px-4 border">${escapeHTML(usuario.rol.toUpperCase())}</td>
      <td class="py-2 px-4 border">
        <button class="editar-usuario-btn bg-yellow-500 text-white py-1 px-2 rounded mr-2 hover:bg-yellow-600" data-id="${escapeHTML(docu.id)}">
          Editar
        </button>
        <button class="eliminar-usuario-btn bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600" data-id="${escapeHTML(docu.id)}">
          Eliminar
        </button>
      </td>
    `;
    DOM.tablaUsuarios.appendChild(row);
    row.querySelector(".editar-usuario-btn").addEventListener("click", () => editarUsuario(docu.id, usuario));
    row.querySelector(".eliminar-usuario-btn").addEventListener("click", () => confirmarEliminarUsuario(docu.id));
  });
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
  // No permitir editar otros administradores
  if (
    usuarioData.rol === "administrador" &&
    usuarioId !== getUsuarioActual().nombre
  ) {
    alert("No puedes editar a otro administrador");
    return;
  }

  usuarioEditando = { id: usuarioId, ...usuarioData };
  DOM.usuarioModalTitle.textContent = "Editar Usuario";
  DOM.editUsuario.disabled = true;
  DOM.editUsuario.value = usuarioId;
  DOM.editPassword.value = "";
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
  const password = DOM.editPassword.value.trim();
  const rol = DOM.editRol.value;
  if (password && !validarPassword(password)) {
    mostrarMensajeUI(
      "La nueva contraseña debe contener:\n- 8+ caracteres\n- 1 mayúscula\n- 1 minúscula\n- 1 número\n- 1 carácter especial",
      'error'
    );
    return;
  }
  if (!usuario || !password) {
    mostrarMensajeUI("Completa todos los campos", 'error');
    return;
  }
  try {
    const hashedPassword = await hashPassword(password);
    if (usuarioEditando) {
      await updateDoc(doc(db, "usuarios", usuarioEditando.id), {
        password: hashedPassword,
        rol,
      });
      mostrarMensajeUI("Usuario actualizado correctamente", 'success');
    } else {
      const userRef = doc(db, "usuarios", usuario);
      const existing = await getDoc(userRef);
      if (existing.exists()) {
        mostrarMensajeUI("Ese usuario ya existe", 'error');
        return;
      }
      await setDoc(userRef, {
        password: hashedPassword,
        rol,
      });
      mostrarMensajeUI("Usuario creado correctamente", 'success');
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
  let usuarios = [];
  
  usuariosSnap.forEach((docu) => {
    usuarios.push({ id: docu.id, ...docu.data() });
  });

  if (usuarios.length === 0) {
    mostrarMensajeUI("No hay usuarios disponibles para ver sus inventarios", 'info');
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

// FUNCIÓN TEMPORAL PARA PRUEBAS DE SCROLL - Puede eliminarse en producción
export function cargarUsuariosPrueba() {
  DOM.tablaUsuarios.innerHTML = "";
  
  // Crear 15 usuarios de prueba para verificar el scroll
  for (let i = 1; i <= 15; i++) {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";
    const rol = i % 4 === 0 ? 'administrador' : 'empleado';
    row.innerHTML = `
      <td class="py-3 px-6 border">${escapeHTML(`usuario${i.toString().padStart(2, '0')}`)}</td>
      <td class="py-3 px-6 border">${escapeHTML(rol.toUpperCase())}</td>
      <td class="py-3 px-6 border text-center">
        <button class="editar-usuario-btn bg-yellow-500 text-white py-1 px-3 rounded mr-2 hover:bg-yellow-600" data-id="usuario${i.toString().padStart(2, '0')}">
          Editar
        </button>
        <button class="eliminar-usuario-btn bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600" data-id="usuario${i.toString().padStart(2, '0')}">
          Eliminar
        </button>
      </td>
    `;
    DOM.tablaUsuarios.appendChild(row);
    
    // Agregar event listeners
    row.querySelector(".editar-usuario-btn").addEventListener("click", () => {
      console.log(`Editar usuario${i.toString().padStart(2, '0')}`);
    });
    row.querySelector(".eliminar-usuario-btn").addEventListener("click", () => {
      console.log(`Eliminar usuario${i.toString().padStart(2, '0')}`);
    });
  }
}

// Función para alternar entre datos reales y de prueba (útil para testing)
export function toggleModoUsuarios(usarDatosPrueba = false) {
  if (usarDatosPrueba) {
    // Para testing del scroll - descomentar la siguiente línea si es necesario
    // cargarUsuariosPrueba();
    console.log("Modo de prueba activado para usuarios");
  } else {
    cargarUsuarios();
    console.log("Cargando usuarios desde Firebase");
  }
}
