// app.js
import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const { jsPDF } = window.jspdf;

let usuarioActual = null;
let productoActual = null;
let inventarioActual = null;
let productosCache = [];
let usuarioEditando = null;

// Función para generar hash SHA-256 (cliente-side)
async function hashPassword(password) {
  // Convierte la contraseña a un array buffer
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Genera el hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convierte el buffer a string hexadecimal
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM cargado, inicializando aplicación...");

// Elementos del DOM
const DOM = {
  // Login/Registro
  loginSection: document.getElementById("login"),
  registroSection: document.getElementById("registro"),
  toggleRegistro: document.getElementById("toggleRegistro"),
  toggleLogin: document.getElementById("toggleLogin"),
  btnLogin: document.getElementById("btnLogin"),
  btnRegistro: document.getElementById("btnRegistro"),
  btnLogout: document.getElementById("btnLogout"),

  // Menú
  menuSection: document.getElementById("menu"),
  bienvenida: document.getElementById("bienvenida"),
  acciones: document.getElementById("acciones"),

  // Inventario
  inventarioSection: document.getElementById("inventarioSection"),
  inventarioTitle: document.getElementById("inventarioTitle"),
  tablaProductos: document.getElementById("tablaProductos"),
  btnAgregarProducto: document.getElementById("btnAgregarProducto"),
  buscarProducto: document.getElementById("buscarProducto"),
  btnGenerarReporte: document.getElementById("btnGenerarReporte"),

  // Modal Producto
  productoModal: document.getElementById("productoModal"),
  modalTitle: document.getElementById("modalTitle"),
  productoNombre: document.getElementById("productoNombre"),
  productoCantidad: document.getElementById("productoCantidad"),
  btnCancelarModal: document.getElementById("btnCancelarModal"),
  btnGuardarProducto: document.getElementById("btnGuardarProducto"),

  // Administración de Usuarios
  usuariosModal: document.getElementById("usuariosModal"),
  buscarUsuario: document.getElementById("buscarUsuario"),
  tablaUsuarios: document.getElementById("tablaUsuarios"),
  btnCancelarUsuarios: document.getElementById("btnCancelarUsuarios"),
  btnNuevoUsuario: document.getElementById("btnNuevoUsuario"),

  // Editar Usuario
  usuarioEditarModal: document.getElementById("usuarioEditarModal"),
  usuarioModalTitle: document.getElementById("usuarioModalTitle"),
  editUsuario: document.getElementById("editUsuario"),
  editPassword: document.getElementById("editPassword"),
  editRol: document.getElementById("editRol"),
  btnCancelarEditarUsuario: document.getElementById("btnCancelarEditarUsuario"),
  btnGuardarUsuario: document.getElementById("btnGuardarUsuario"),

  // Reportes
  reporteModal: document.getElementById("reporteModal"),
  tipoReporte: document.getElementById("tipoReporte"),
  btnCancelarReporte: document.getElementById("btnCancelarReporte"),
  btnDescargarReporte: document.getElementById("btnDescargarReporte"),
};

// Event Listeners
DOM.toggleRegistro.addEventListener("click", () => {
  DOM.loginSection.classList.add("hidden");
  DOM.registroSection.classList.remove("hidden");
});

DOM.toggleLogin.addEventListener("click", () => {
  DOM.registroSection.classList.add("hidden");
  DOM.loginSection.classList.remove("hidden");
});

console.log("Conectando event listeners...");
console.log("btnLogin element:", DOM.btnLogin);

DOM.btnLogout.addEventListener("click", cerrarSesion);
DOM.buscarProducto.addEventListener("input", filtrarProductos);
DOM.btnAgregarProducto.addEventListener("click", mostrarModalAgregar);
DOM.btnCancelarModal.addEventListener("click", ocultarModal);
DOM.btnGuardarProducto.addEventListener("click", guardarProducto);
DOM.btnGenerarReporte.addEventListener("click", () =>
  DOM.reporteModal.classList.remove("hidden")
);
DOM.btnCancelarReporte.addEventListener("click", () =>
  DOM.reporteModal.classList.add("hidden")
);

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

// Función para validar contraseña (agrégala al inicio con las otras funciones)
function validarPassword(password) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

// Validación en tiempo real (agrégala después de tus event listeners)
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

// Registro
DOM.btnRegistro.addEventListener("click", async () => {
  const user = document.getElementById("regUsuario").value.trim();
  const pass = document.getElementById("regPassword").value.trim();
  const rol = document.getElementById("regRol").value;

  if (!user || !pass) {
    mostrarMensajeRegistro("Completa todos los campos", 'error');
    return;
  }

  if (!validarPassword(pass)) {
    mostrarMensajeRegistro(
      "La contraseña debe contener:\n- 8+ caracteres\n- 1 mayúscula\n- 1 minúscula\n- 1 número\n- 1 carácter especial",
      'error'
    );
    return;
  }

  try {
    // Genera el hash de la contraseña
    const hashedPassword = await hashPassword(pass);

    const userRef = doc(db, "usuarios", user);
    const existing = await getDoc(userRef);

    if (existing.exists()) {
      mostrarMensajeRegistro("Ese usuario ya existe", 'error');
    } else {
      // Guarda el hash en lugar de la contraseña en texto plano
      await setDoc(userRef, {
        password: hashedPassword,
        rol,
      });
      mostrarMensajeRegistro("Usuario registrado con éxito", 'success');
      // Iniciar sesión automáticamente tras registro
      usuarioActual = { nombre: user, rol };
      setTimeout(() => {
        mostrarMenu();
        mostrarMensajeRegistro('', 'info');
      }, 1500);
    }
  } catch (error) {
    console.error("Error al registrar:", error);
    mostrarMensajeRegistro("Error al registrar usuario", 'error');
  }
});

// Login con protección contra fuerza bruta
DOM.btnLogin.addEventListener("click", async () => {
  console.log("Botón de login presionado");
  const user = document.getElementById("usuario").value.trim();
  const pass = document.getElementById("password").value;
  console.log("Usuario:", user, "Password length:", pass.length);

  try {
    const userRef = doc(db, "usuarios", user);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      mostrarMensajeLogin("Usuario o contraseña inválidos", 'error');
      return;
    }

    // Protección contra fuerza bruta
    const userData = docSnap.data();
    const now = Date.now();
    const failedAttempts = userData.failedAttempts || 0;
    const lockUntil = userData.lockUntil || 0;
    if (lockUntil && now < lockUntil) {
      const segundos = Math.ceil((lockUntil - now) / 1000);
      let mensaje;
      if (segundos >= 60) {
        const minutos = Math.floor(segundos / 60);
        const restoSegundos = segundos % 60;
        mensaje = `Cuenta bloqueada por intentos fallidos. Intenta de nuevo en ${minutos} minuto(s)${restoSegundos > 0 ? ` y ${restoSegundos} segundo(s)` : ''}.`;
      } else {
        mensaje = `Cuenta bloqueada por intentos fallidos. Intenta de nuevo en ${segundos} segundo(s).`;
      }
      mostrarMensajeLogin(mensaje, 'error');
      return;
    }

    // Genera el hash para comparar
    const hashedPassword = await hashPassword(pass);
    if (userData.password !== hashedPassword) {
      // Incrementar intentos fallidos
      let newFailed = failedAttempts + 1;
      let updateData = { failedAttempts: newFailed };
      document.getElementById("password").value = "";
      if (newFailed >= 5) {
        updateData.lockUntil = now + 15 * 1000; // 15 segundos
        mostrarMensajeLogin("Demasiados intentos fallidos. Cuenta bloqueada por 15 segundos.", 'error');
      } else {
        mostrarMensajeLogin("Usuario o contraseña inválidos", 'error');
      }
      await updateDoc(userRef, updateData);
      return;
    }

    // Login exitoso: resetear contador
    await updateDoc(userRef, { failedAttempts: 0, lockUntil: 0 });
    usuarioActual = { nombre: user, rol: userData.rol };
    mostrarMenu();
  } catch (error) {
    console.error("Error en login:", error);
    mostrarMensajeLogin("Error al iniciar sesión", 'error');
  }
});

// Mostrar mensajes en el login
function mostrarMensajeLogin(mensaje, tipo = 'info') {
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
function mostrarMensajeRegistro(mensaje, tipo = 'info') {
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

// --- Función para escapar texto y prevenir XSS ---
function escapeHTML(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[m];
  });
}

// Reemplazo de alert, confirm y prompt por mensajes/modales estilizados
function mostrarMensajeUI(mensaje, tipo = 'info', contenedor = document.body) {
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
function mostrarConfirmacionUI(mensaje, onConfirm) {
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

// Funciones de inventario
async function mostrarInventario(usuario) {
  const userDoc = await getDoc(doc(db, "usuarios", usuario));

  // Bloquear acceso a inventarios de otros administradores
  if (
    userDoc.exists() &&
    userDoc.data().rol === "administrador" &&
    usuario !== usuarioActual.nombre
  ) {
    alert("No puedes acceder al inventario de otro administrador");
    return;
  }

  inventarioActual = usuario;
  DOM.inventarioTitle.textContent = `Inventario de ${usuario}`;
  DOM.inventarioSection.classList.remove("hidden");

  // Mostrar botón de agregar solo si es el propio usuario o administrador viendo un no-admin
  const esAdminActual = usuarioActual.rol === "administrador";
  const esMismoUsuario = usuario === usuarioActual.nombre;
  const esUsuarioNoAdmin =
    userDoc.exists() && userDoc.data().rol !== "administrador";

  DOM.btnAgregarProducto.style.display =
    esMismoUsuario || (esAdminActual && esUsuarioNoAdmin) ? "block" : "none";

  await cargarProductos(usuario);
}

async function cargarProductos(usuario) {
  const ref = collection(db, "inventarios", usuario, "productos");
  const snapshot = await getDocs(ref);

  DOM.tablaProductos.innerHTML = "";
  productosCache = [];

  if (snapshot.empty) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="3" class="py-4 text-center text-gray-500">No hay productos en este inventario</td>`;
    DOM.tablaProductos.appendChild(row);
    return;
  }

  snapshot.forEach((doc) => {
    const producto = { id: doc.id, ...doc.data() };
    productosCache.push(producto);
    agregarFilaProducto(producto);
  });
}

function agregarFilaProducto(producto) {
  const row = document.createElement("tr");
  row.className = "hover:bg-gray-50";
  row.innerHTML = `
    <td class="py-2 px-4 border">${escapeHTML(producto.nombre)}</td>
    <td class="py-2 px-4 border">${escapeHTML(String(producto.cantidad))}</td>
    <td class="py-2 px-4 border">
      <button class="editar-btn bg-yellow-500 text-white py-1 px-2 rounded mr-2 hover:bg-yellow-600" data-id="${escapeHTML(producto.id)}">
        Editar
      </button>
      <button class="eliminar-btn bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600" data-id="${escapeHTML(producto.id)}">
        Eliminar
      </button>
    </td>
  `;
  DOM.tablaProductos.appendChild(row);
  row.querySelector(".editar-btn").addEventListener("click", () => editarProducto(producto));
  row.querySelector(".eliminar-btn").addEventListener("click", () => confirmarEliminarProducto(producto));
}

function filtrarProductos() {
  const termino = DOM.buscarProducto.value.toLowerCase();
  const filas = DOM.tablaProductos.querySelectorAll("tr");

  filas.forEach((fila) => {
    if (fila.querySelector("td")) {
      const nombreProducto = fila.querySelector("td").textContent.toLowerCase();
      fila.style.display = nombreProducto.includes(termino) ? "" : "none";
    }
  });
}

// Funciones para el modal de productos
function mostrarModalAgregar() {
  productoActual = null;
  DOM.modalTitle.textContent = "Agregar Producto";
  DOM.productoNombre.value = "";
  DOM.productoCantidad.value = "";
  DOM.productoModal.classList.remove("hidden");
}

function mostrarModalEditar(producto) {
  productoActual = producto;
  DOM.modalTitle.textContent = "Editar Producto";
  DOM.productoNombre.value = producto.nombre;
  DOM.productoCantidad.value = producto.cantidad;
  DOM.productoModal.classList.remove("hidden");
}

function ocultarModal() {
  DOM.productoModal.classList.add("hidden");
}

function editarProducto(producto) {
  // Verificar permisos básicos
  if (
    usuarioActual.rol !== "administrador" &&
    usuarioActual.nombre !== inventarioActual
  ) {
    alert("No tienes permisos para editar este producto");
    return;
  }

  // Verificar adicionalmente si es inventario de otro admin
  getDoc(doc(db, "usuarios", inventarioActual)).then((docSnap) => {
    if (
      docSnap.exists() &&
      docSnap.data().rol === "administrador" &&
      inventarioActual !== usuarioActual.nombre
    ) {
      alert("No puedes editar productos de otro administrador");
      return;
    }
    mostrarModalEditar(producto);
  });
}

function confirmarEliminarProducto(producto) {
  // Verificar permisos básicos
  if (
    usuarioActual.rol !== "administrador" &&
    usuarioActual.nombre !== inventarioActual
  ) {
    alert("No tienes permisos para eliminar este producto");
    return;
  }

  // Verificar adicionalmente si es inventario de otro admin
  getDoc(doc(db, "usuarios", inventarioActual)).then((docSnap) => {
    if (
      docSnap.exists() &&
      docSnap.data().rol === "administrador" &&
      inventarioActual !== usuarioActual.nombre
    ) {
      alert("No puedes eliminar productos de otro administrador");
      return;
    }

    mostrarConfirmacionUI(
      `¿Estás seguro de eliminar el producto "${escapeHTML(producto.nombre)}"?`,
      () => eliminarProducto(producto.id)
    );
  });
}

// Funciones CRUD productos
async function guardarProducto() {
  await precaucionOperacion();
  const nombre = DOM.productoNombre.value.trim();
  const cantidad = parseInt(DOM.productoCantidad.value, 10);
  if (!validarNombreProducto(nombre) || !validarCantidad(cantidad)) {
    mostrarMensajeUI("Por favor completa todos los campos correctamente", 'error');
    return;
  }
  try {
    if (productoActual) {
      await updateDoc(
        doc(db, "inventarios", inventarioActual, "productos", productoActual.id),
        { nombre, cantidad }
      );
      const index = productosCache.findIndex((p) => p.id === productoActual.id);
      if (index !== -1) {
        productosCache[index] = { ...productosCache[index], nombre, cantidad };
      }
      mostrarMensajeUI("Producto actualizado correctamente", 'success');
    } else {
      const docRef = await addDoc(
        collection(db, "inventarios", inventarioActual, "productos"),
        { nombre, cantidad }
      );
      productosCache.push({ id: docRef.id, nombre, cantidad });
      mostrarMensajeUI("Producto agregado correctamente", 'success');
    }
    DOM.tablaProductos.innerHTML = "";
    productosCache.forEach(agregarFilaProducto);
    ocultarModal();
    DOM.buscarProducto.value = "";
  } catch (error) {
    console.error("Error al guardar producto:", error);
    mostrarMensajeUI("Error al guardar producto", 'error');
  }
}

async function eliminarProducto(id) {
  await precaucionOperacion();
  try {
    await deleteDoc(doc(db, "inventarios", inventarioActual, "productos", id));
    productosCache = productosCache.filter((p) => p.id !== id);
    DOM.tablaProductos.innerHTML = "";
    if (productosCache.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="3" class="py-4 text-center text-gray-500">No hay productos en este inventario</td>`;
      DOM.tablaProductos.appendChild(row);
    } else {
      productosCache.forEach(agregarFilaProducto);
    }
    mostrarMensajeUI("Producto eliminado correctamente", 'success');
    DOM.buscarProducto.value = "";
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    mostrarMensajeUI("Error al eliminar producto", 'error');
  }
}

// Funciones de administración de usuarios
async function administrarUsuarios() {
  if (usuarioActual.rol !== "administrador") {
    alert("No tienes permisos para acceder a esta función");
    return;
  }

  // Cargar usuarios desde Firebase
  await cargarUsuarios();
  DOM.usuariosModal.classList.remove("hidden");
}

async function cargarUsuarios() {
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

function filtrarUsuarios() {
  const termino = DOM.buscarUsuario.value.toLowerCase();
  const filas = DOM.tablaUsuarios.querySelectorAll("tr");

  filas.forEach((fila) => {
    if (fila.querySelector("td")) {
      const nombreUsuario = fila.querySelector("td").textContent.toLowerCase();
      fila.style.display = nombreUsuario.includes(termino) ? "" : "none";
    }
  });
}

function editarUsuario(usuarioId, usuarioData) {
  // No permitir editar otros administradores
  if (
    usuarioData.rol === "administrador" &&
    usuarioId !== usuarioActual.nombre
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

function confirmarEliminarUsuario(usuarioId) {
  // No permitir eliminar el propio usuario
  if (usuarioId === usuarioActual.nombre) {
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

async function eliminarUsuario(usuarioId) {
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

async function guardarUsuario() {
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

async function mostrarSeleccionUsuario() {
  if (usuarioActual.rol !== "administrador") {
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

DOM.btnDescargarReporte.addEventListener("click", async () => {
  const tipoReporte = DOM.tipoReporte.value;
  let titulo = "";
  let productosFiltrados = [];

  // Filtrar productos según el tipo de reporte
  switch (tipoReporte) {
    case "inventario_completo":
      titulo = `Inventario completo de ${inventarioActual}`;
      productosFiltrados = [...productosCache];
      break;

    case "productos_bajo_stock":
      titulo = `Productos con stock bajo (${inventarioActual})`;
      productosFiltrados = productosCache.filter((p) => p.cantidad < 10); // Cambia 10 por tu límite
      break;

    case "movimientos_recientes":
      titulo = `Movimientos recientes (${inventarioActual})`;
      // Aquí necesitarías tener un historial de movimientos en tu base de datos
      alert("Funcionalidad de movimientos no implementada aún");
      DOM.reporteModal.classList.add("hidden");
      return;
  }

  if (productosFiltrados.length === 0) {
    alert("No hay datos para generar el reporte");
    return;
  }

  // Crear PDF
  const doc = new jsPDF();

  // Encabezado
  doc.setFontSize(18);
  function escapeText(text) {
    return text.replace(/[&<>"']/g, function (m) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m];
    });
  }
  doc.setFontSize(12);
  doc.text(escapeText(titulo), 14, 15);
  doc.text(`Generado por: ${escapeText(usuarioActual.nombre)}`, 14, 30);

  // Tabla de productos
  const headers = [["Producto", "Cantidad"]];
  const data = productosFiltrados.map((p) => [
    escapeText(p.nombre),
    p.cantidad,
  ]);

  doc.autoTable({
    startY: 40,
    head: headers,
    body: data,
    theme: "grid",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
    },
    styles: {
      cellPadding: 3,
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: "auto" },
    },
  });

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }

  // Guardar PDF
  doc.save(`reporte_inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
  DOM.reporteModal.classList.add("hidden");
});

// --- Medidas de precaución básicas contra abuso/DoS ---
const OPERACION_LIMITE = 30; // Máximo de operaciones permitidas por minuto
let operacionesRecientes = [];

function registrarOperacion() {
  const ahora = Date.now();
  // Elimina operaciones de hace más de 1 minuto
  operacionesRecientes = operacionesRecientes.filter(ts => ahora - ts < 60000);
  operacionesRecientes.push(ahora);
  if (operacionesRecientes.length > OPERACION_LIMITE) {
    return false; // Límite superado
  }
  return true;
}

function precaucionOperacion() {
  if (!registrarOperacion()) {
    alert("Has realizado demasiadas operaciones en poco tiempo. Espera unos segundos antes de continuar.");
    // Retraso artificial para frenar bots
    return new Promise(res => setTimeout(res, 2000));
  }
  return Promise.resolve();
}

// Ejemplo de uso: antes de operaciones críticas
async function guardarProducto() {
  await precaucionOperacion();
  const nombre = DOM.productoNombre.value.trim();
  const cantidad = parseInt(DOM.productoCantidad.value, 10);

  if (!nombre || isNaN(cantidad)) {
    alert("Por favor completa todos los campos correctamente");
    return;
  }

  try {
    if (productoActual) {
      await updateDoc(
        doc(
          db,
          "inventarios",
          inventarioActual,
          "productos",
          productoActual.id
        ),
        {
          nombre,
          cantidad,
        }
      );

      const index = productosCache.findIndex((p) => p.id === productoActual.id);
      if (index !== -1) {
        productosCache[index] = { ...productosCache[index], nombre, cantidad };
      }

      alert("Producto actualizado correctamente");
    } else {
      const docRef = await addDoc(
        collection(db, "inventarios", inventarioActual, "productos"),
        {
          nombre,
          cantidad,
        }
      );

      productosCache.push({ id: docRef.id, nombre, cantidad });
      alert("Producto agregado correctamente");
    }

    DOM.tablaProductos.innerHTML = "";
    productosCache.forEach(agregarFilaProducto);
    ocultarModal();
    DOM.buscarProducto.value = "";
  } catch (error) {
    console.error("Error al guardar producto:", error);
    alert("Error al guardar producto");
  }
}

async function eliminarProducto(id) {
  await precaucionOperacion();
  try {
    await deleteDoc(doc(db, "inventarios", inventarioActual, "productos", id));

    productosCache = productosCache.filter((p) => p.id !== id);

    DOM.tablaProductos.innerHTML = "";
    if (productosCache.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="3" class="py-4 text-center text-gray-500">No hay productos en este inventario</td>`;
      DOM.tablaProductos.appendChild(row);
    } else {
      productosCache.forEach(agregarFilaProducto);
    }

    alert("Producto eliminado correctamente");
    DOM.buscarProducto.value = "";
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    alert("Error al eliminar producto");
  }
}

async function guardarUsuario() {
  await precaucionOperacion();
  const usuario = DOM.editUsuario.value.trim();
  const password = DOM.editPassword.value.trim(); // Contraseña en texto plano
  const rol = DOM.editRol.value;

  if (password && !validarPassword(password)) {
    // Solo si se está cambiando la contraseña
    alert(
      "La nueva contraseña debe contener:\n- 8+ caracteres\n- 1 mayúscula\n- 1 minúscula\n- 1 número\n- 1 carácter especial"
    );
    return;
  }

  if (!usuario || !password) {
    alert("Completa todos los campos");
    return;
  }

  try {
    // Generar hash de la nueva contraseña
    const hashedPassword = await hashPassword(password);

    if (usuarioEditando) {
      // Actualizar usuario existente
      await updateDoc(doc(db, "usuarios", usuarioEditando.id), {
        password: hashedPassword, // Guardar la versión hasheada
        rol,
      });
      alert("Usuario actualizado correctamente");
    } else {
      // Crear nuevo usuario
      const userRef = doc(db, "usuarios", usuario);
      const existing = await getDoc(userRef);

      if (existing.exists()) {
        alert("Ese usuario ya existe");
        return;
      }

      await setDoc(userRef, {
        password: hashedPassword,
        rol,
      });
      alert("Usuario creado correctamente");
    }

    DOM.usuarioEditarModal.classList.add("hidden");
    await cargarUsuarios();
  } catch (error) {
    console.error("Error al guardar usuario:", error);
    alert("Error al guardar usuario: " + error.message);
  }
}

function cerrarSesion() {
  usuarioActual = null;
  inventarioActual = null;
  productosCache = [];
  DOM.menuSection.classList.add("hidden");
  DOM.inventarioSection.classList.add("hidden");
  DOM.loginSection.classList.remove("hidden");
  DOM.buscarProducto.value = "";

  document.getElementById("usuario").value = "";
  document.getElementById("password").value = "";
}

// Mostrar el menú principal tras login o registro exitoso
function mostrarMenu() {
  // Oculta login y registro
  DOM.loginSection.classList.add("hidden");
  DOM.registroSection.classList.add("hidden");
  // Muestra el menú principal
  DOM.menuSection.classList.remove("hidden");
  // Mensaje de bienvenida
  if (usuarioActual) {
    DOM.bienvenida.textContent = `Bienvenido, ${usuarioActual.nombre} (${usuarioActual.rol})`;
  }
  
  // Generar botones de acciones según el rol
  generarBotonesAcciones();
  
  // Muestra el inventario del usuario actual automáticamente (de forma asíncrona y segura)
  if (usuarioActual && usuarioActual.nombre) {
    setTimeout(() => {
      mostrarInventario(usuarioActual.nombre);
    }, 100);
  }
}

// Generar botones de acciones según el rol del usuario
function generarBotonesAcciones() {
  DOM.acciones.innerHTML = '';
  
  if (usuarioActual.rol === 'administrador') {    // Botones para administrador
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
      mostrarInventario(usuarioActual.nombre);
    });
    
    document.getElementById('btnVerInventarios').addEventListener('click', () => {
      mostrarSeleccionUsuario();
    });
    
    document.getElementById('btnAdministrarUsuarios').addEventListener('click', () => {
      administrarUsuarios();
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
      mostrarInventario(usuarioActual.nombre);
    });
  }
}

// Test de conexión con Firestore
(async () => {
  try {
    const testRef = collection(db, "usuarios");
    const snapshot = await getDocs(testRef);
    console.log(
      "✅ Conexión con Firestore exitosa. Documentos:",
      snapshot.size
    );
  } catch (e) {
    console.error("❌ Error al conectar con Firestore", e);
  }
})();

}); // Fin de DOMContentLoaded

// --- NOTA: Refuerza las reglas de seguridad de Firestore para roles y operaciones críticas. El frontend no es suficiente barrera. ---

// FUNCIÓN TEMPORAL PARA PRUEBAS DE SCROLL
// FUNCIÓN TEMPORAL PARA PRUEBAS DE SCROLL - Puede eliminarse en producción
function cargarUsuariosPrueba() {
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
function toggleModoUsuarios(usarDatosPrueba = false) {
  if (usarDatosPrueba) {
    // Para testing del scroll - descomentar la siguiente línea si es necesario
    // cargarUsuariosPrueba();
    console.log("Modo de prueba activado para usuarios");
  } else {
    cargarUsuarios();
    console.log("Cargando usuarios desde Firebase");
  }
}
