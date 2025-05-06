// app.js
import { db } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, setDoc,
  addDoc, updateDoc, deleteDoc, query, where
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
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convierte el buffer a string hexadecimal
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}



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
  btnDescargarReporte: document.getElementById("btnDescargarReporte")
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

DOM.btnLogout.addEventListener("click", cerrarSesion);
DOM.buscarProducto.addEventListener("input", filtrarProductos);
DOM.btnAgregarProducto.addEventListener("click", mostrarModalAgregar);
DOM.btnCancelarModal.addEventListener("click", ocultarModal);
DOM.btnGuardarProducto.addEventListener("click", guardarProducto);
DOM.btnGenerarReporte.addEventListener("click", () => DOM.reporteModal.classList.remove("hidden"));
DOM.btnCancelarReporte.addEventListener("click", () => DOM.reporteModal.classList.add("hidden"));

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
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

// Validación en tiempo real (agrégala después de tus event listeners)
document.getElementById('regPassword').addEventListener('input', function(e) {
  const password = e.target.value;
  const feedbackDiv = document.getElementById('passwordFeedback');
  const registerBtn = document.getElementById('btnRegistro');
  
  // Definir requisitos
  const requirements = [
      { regex: /.{8,}/, text: 'Mínimo 8 caracteres' },
      { regex: /[A-Z]/, text: 'Al menos 1 mayúscula' },
      { regex: /[a-z]/, text: 'Al menos 1 minúscula' },
      { regex: /\d/, text: 'Al menos 1 número' },
      { regex: /[@$!%*?&]/, text: 'Al menos 1 carácter especial (@$!%*?&)' }
  ];
  
  // Verificar cada requisito
  let allValid = true;
  let feedbackHTML = '';
  
  requirements.forEach(req => {
      const isValid = req.regex.test(password);
      allValid = allValid && isValid;
      feedbackHTML += `
          <p class="${isValid ? 'text-green-500' : 'text-red-500'}">
              ${isValid ? '✓' : '✗'} ${req.text}
          </p>
      `;
  });
  
  // Actualizar UI
  feedbackDiv.innerHTML = feedbackHTML;
  e.target.classList.toggle('border-green-500', allValid && password.length > 0);
  e.target.classList.toggle('border-red-500', !allValid && password.length > 0);
  registerBtn.disabled = !allValid;
});


// Registro
DOM.btnRegistro.addEventListener("click", async () => {
  const user = document.getElementById("regUsuario").value.trim();
  const pass = document.getElementById("regPassword").value.trim();
  const rol = document.getElementById("regRol").value;

  if (!user || !pass) return alert("Completa todos los campos");

  if (!validarPassword(pass)) {
    alert("La contraseña debe contener:\n- 8+ caracteres\n- 1 mayúscula\n- 1 minúscula\n- 1 número\n- 1 carácter especial");
    return;
  }

  try {
    // Genera el hash de la contraseña
    const hashedPassword = await hashPassword(pass);

    const userRef = doc(db, "usuarios", user);
    const existing = await getDoc(userRef);
    
    if (existing.exists()) {
      alert("Ese usuario ya existe");
    } else {
      // Guarda el hash en lugar de la contraseña en texto plano
      await setDoc(userRef, { 
        password: hashedPassword, 
        rol 
      });
      alert("Usuario registrado con éxito");
      DOM.registroSection.classList.add("hidden");
      DOM.loginSection.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error al registrar:", error);
    alert("Error al registrar usuario");
  }
});

// Login
DOM.btnLogin.addEventListener("click", async () => {
  const user = document.getElementById("usuario").value;
  const pass = document.getElementById("password").value;

  try {
    // Genera el hash para comparar
    const hashedPassword = await hashPassword(pass);
    
    const docSnap = await getDoc(doc(db, "usuarios", user));
    if (!docSnap.exists() || docSnap.data().password !== hashedPassword) {
      alert("Usuario o contraseña inválidos");
      return;
    }

    usuarioActual = { nombre: user, rol: docSnap.data().rol };
    mostrarMenu();
    
  } catch (error) {
    console.error("Error en login:", error);
    alert("Error al iniciar sesión");
  }
});

// Mostrar menú según rol
function mostrarMenu() {
  DOM.loginSection.classList.add("hidden");
  DOM.registroSection.classList.add("hidden");
  DOM.menuSection.classList.remove("hidden");
  DOM.bienvenida.textContent = `Bienvenido ${usuarioActual.nombre} (${usuarioActual.rol.toUpperCase()})`;

  DOM.acciones.innerHTML = "";

  // Todos los usuarios pueden ver su inventario
  agregarBoton("Ver mi inventario", () => mostrarInventario(usuarioActual.nombre));

  // Solo administradores pueden ver estas opciones
  if (usuarioActual.rol === "administrador") {
    agregarBoton("Ver todos los inventarios", mostrarSeleccionUsuario);
    agregarBoton("Administrar usuarios", administrarUsuarios);
  }
}

function agregarBoton(texto, accion) {
  const btn = document.createElement("button");
  btn.textContent = texto;
  btn.className = "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700";
  btn.onclick = accion;
  DOM.acciones.appendChild(btn);
}

// Funciones de inventario
async function mostrarInventario(usuario) {
  const userDoc = await getDoc(doc(db, "usuarios", usuario));
  
  // Bloquear acceso a inventarios de otros administradores
  if (userDoc.exists() && userDoc.data().rol === "administrador" && usuario !== usuarioActual.nombre) {
    alert("No puedes acceder al inventario de otro administrador");
    return;
  }
  
  inventarioActual = usuario;
  DOM.inventarioTitle.textContent = `Inventario de ${usuario}`;
  DOM.inventarioSection.classList.remove("hidden");
  
  // Mostrar botón de agregar solo si es el propio usuario o administrador viendo un no-admin
  const esAdminActual = usuarioActual.rol === "administrador";
  const esMismoUsuario = usuario === usuarioActual.nombre;
  const esUsuarioNoAdmin = userDoc.exists() && userDoc.data().rol !== "administrador";
  
  DOM.btnAgregarProducto.style.display = 
    (esMismoUsuario || (esAdminActual && esUsuarioNoAdmin)) ? "block" : "none";
  
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
  
  snapshot.forEach(doc => {
    const producto = { id: doc.id, ...doc.data() };
    productosCache.push(producto);
    agregarFilaProducto(producto);
  });
}

function agregarFilaProducto(producto) {
  const row = document.createElement("tr");
  row.className = "hover:bg-gray-50";
  row.innerHTML = `
    <td class="py-2 px-4 border">${producto.nombre}</td>
    <td class="py-2 px-4 border">${producto.cantidad}</td>
    <td class="py-2 px-4 border">
      <button class="editar-btn bg-yellow-500 text-white py-1 px-2 rounded mr-2 hover:bg-yellow-600" data-id="${producto.id}">
        Editar
      </button>
      <button class="eliminar-btn bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600" data-id="${producto.id}">
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
  
  filas.forEach(fila => {
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
  if (usuarioActual.rol !== "administrador" && usuarioActual.nombre !== inventarioActual) {
    alert("No tienes permisos para editar este producto");
    return;
  }
  
  // Verificar adicionalmente si es inventario de otro admin
  getDoc(doc(db, "usuarios", inventarioActual)).then((docSnap) => {
    if (docSnap.exists() && docSnap.data().rol === "administrador" && inventarioActual !== usuarioActual.nombre) {
      alert("No puedes editar productos de otro administrador");
      return;
    }
    mostrarModalEditar(producto);
  });
}

function confirmarEliminarProducto(producto) {
  // Verificar permisos básicos
  if (usuarioActual.rol !== "administrador" && usuarioActual.nombre !== inventarioActual) {
    alert("No tienes permisos para eliminar este producto");
    return;
  }
  
  // Verificar adicionalmente si es inventario de otro admin
  getDoc(doc(db, "usuarios", inventarioActual)).then((docSnap) => {
    if (docSnap.exists() && docSnap.data().rol === "administrador" && inventarioActual !== usuarioActual.nombre) {
      alert("No puedes eliminar productos de otro administrador");
      return;
    }
    
    if (confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
      eliminarProducto(producto.id);
    }
  });
}

// Funciones CRUD productos
async function guardarProducto() {
  const nombre = DOM.productoNombre.value.trim();
  const cantidad = parseInt(DOM.productoCantidad.value, 10);
  
  if (!nombre || isNaN(cantidad)) {
    alert("Por favor completa todos los campos correctamente");
    return;
  }
  
  try {
    if (productoActual) {
      await updateDoc(doc(db, "inventarios", inventarioActual, "productos", productoActual.id), {
        nombre,
        cantidad
      });
      
      const index = productosCache.findIndex(p => p.id === productoActual.id);
      if (index !== -1) {
        productosCache[index] = { ...productosCache[index], nombre, cantidad };
      }
      
      alert("Producto actualizado correctamente");
    } else {
      const docRef = await addDoc(collection(db, "inventarios", inventarioActual, "productos"), {
        nombre,
        cantidad
      });
      
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
  try {
    await deleteDoc(doc(db, "inventarios", inventarioActual, "productos", id));
    
    productosCache = productosCache.filter(p => p.id !== id);
    
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

// Funciones de administración de usuarios
async function administrarUsuarios() {
  if (usuarioActual.rol !== "administrador") {
    alert("No tienes permisos para acceder a esta función");
    return;
  }
  
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
  
  snapshot.forEach(doc => {
    const usuario = doc.data();
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";
    row.innerHTML = `
      <td class="py-2 px-4 border">${doc.id}</td>
      <td class="py-2 px-4 border">${usuario.rol.toUpperCase()}</td>
      <td class="py-2 px-4 border">
        <button class="editar-usuario-btn bg-yellow-500 text-white py-1 px-2 rounded mr-2 hover:bg-yellow-600" data-id="${doc.id}">
          Editar
        </button>
        <button class="eliminar-usuario-btn bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600" data-id="${doc.id}">
          Eliminar
        </button>
      </td>
    `;
    DOM.tablaUsuarios.appendChild(row);
    
    row.querySelector(".editar-usuario-btn").addEventListener("click", () => editarUsuario(doc.id, usuario));
    row.querySelector(".eliminar-usuario-btn").addEventListener("click", () => confirmarEliminarUsuario(doc.id));
  });
}

function filtrarUsuarios() {
  const termino = DOM.buscarUsuario.value.toLowerCase();
  const filas = DOM.tablaUsuarios.querySelectorAll("tr");
  
  filas.forEach(fila => {
    if (fila.querySelector("td")) {
      const nombreUsuario = fila.querySelector("td").textContent.toLowerCase();
      fila.style.display = nombreUsuario.includes(termino) ? "" : "none";
    }
  });
}

function editarUsuario(usuarioId, usuarioData) {
  // No permitir editar otros administradores
  if (usuarioData.rol === "administrador" && usuarioId !== usuarioActual.nombre) {
    alert("No puedes editar a otro administrador");
    return;
  }
  
  usuarioEditando = { id: usuarioId, ...usuarioData };
  DOM.usuarioModalTitle.textContent = "Editar Usuario";
  DOM.editUsuario.disabled = true;
  DOM.editUsuario.value = usuarioId;
  DOM.editPassword.value = usuarioData.password;
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
      
      if (confirm(`¿Estás seguro de eliminar el usuario "${usuarioId}"? Esta acción no se puede deshacer.`)) {
        eliminarUsuario(usuarioId);
      }
    }
  });
}

async function eliminarUsuario(usuarioId) {
  try {
    await deleteDoc(doc(db, "usuarios", usuarioId));
    
    const inventarioRef = doc(db, "inventarios", usuarioId);
    const inventarioSnap = await getDoc(inventarioRef);
    if (inventarioSnap.exists()) {
      await deleteDoc(inventarioRef);
    }
    
    await cargarUsuarios();
    alert("Usuario eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    alert("Error al eliminar usuario");
  }
}

async function guardarUsuario() {
  const usuario = DOM.editUsuario.value.trim();
  const password = DOM.editPassword.value.trim(); // Contraseña en texto plano
  const rol = DOM.editRol.value;
  
  if (password && !validarPassword(password)) { // Solo si se está cambiando la contraseña
    alert("La nueva contraseña debe contener:\n- 8+ caracteres\n- 1 mayúscula\n- 1 minúscula\n- 1 número\n- 1 carácter especial");
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
        rol
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
        rol 
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

async function mostrarSeleccionUsuario() {
  const usuariosRef = collection(db, "usuarios");
  const usuariosSnap = await getDocs(usuariosRef);
  
  let usuarios = [];
  usuariosSnap.forEach(doc => {
    // Solo incluir usuarios que no sean administradores
    if (doc.data().rol !== "administrador") {
      usuarios.push({id: doc.id, ...doc.data()});
    }
  });
  
  if (usuarios.length === 0) {
    alert("No hay usuarios disponibles para ver sus inventarios");
    return;
  }
  
  let mensaje = "Selecciona un usuario para ver su inventario:\n";
  usuarios.forEach((user, index) => {
    mensaje += `${index + 1}. ${user.id} (${user.rol})\n`;
  });
  
  const seleccion = prompt(mensaje);
  if (!seleccion) return;
  
  const index = parseInt(seleccion) - 1;
  if (isNaN(index) || index < 0 || index >= usuarios.length) {
    alert("Selección inválida");
    return;
  }
  
  await mostrarInventario(usuarios[index].id);
}

DOM.btnDescargarReporte.addEventListener("click", async () => {
  const tipoReporte = DOM.tipoReporte.value;
  let titulo = "";
  let productosFiltrados = [];
  
  // Filtrar productos según el tipo de reporte
  switch(tipoReporte) {
      case "inventario_completo":
          titulo = `Inventario completo de ${inventarioActual}`;
          productosFiltrados = [...productosCache];
          break;
          
      case "productos_bajo_stock":
          titulo = `Productos con stock bajo (${inventarioActual})`;
          productosFiltrados = productosCache.filter(p => p.cantidad < 10); // Cambia 10 por tu límite
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
  doc.text(titulo, 14, 15);
  doc.setFontSize(12);
  doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 23);
  doc.text(`Generado por: ${usuarioActual.nombre} (${usuarioActual.rol})`, 14, 30);
  
  // Tabla de productos
  const headers = [["Producto", "Cantidad"]];
  const data = productosFiltrados.map(p => [p.nombre, p.cantidad]);
  
  doc.autoTable({
      startY: 40,
      head: headers,
      body: data,
      theme: 'grid',
      headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255
      },
      styles: {
          cellPadding: 3,
          fontSize: 10
      },
      columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 'auto' }
      }
  });
  
  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
  }
  
  // Guardar PDF
  doc.save(`reporte_inventario_${new Date().toISOString().slice(0,10)}.pdf`);
  DOM.reporteModal.classList.add("hidden");
});

// Después de guardar/editar/eliminar productos
async function registrarMovimiento(accion, producto) {
  try {
      await addDoc(collection(db, "movimientos"), {
          usuario: usuarioActual.nombre,
          fecha: new Date(),
          accion: accion, // "crear", "actualizar", "eliminar"
          producto: producto.nombre,
          cantidad: producto.cantidad,
          inventario: inventarioActual
      });
  } catch (error) {
      console.error("Error registrando movimiento:", error);
  }
}

// Luego llamar esta función en las operaciones CRUD:
// Ejemplo en guardarProducto():
await registrarMovimiento(productoActual ? "actualizar" : "crear", { nombre, cantidad });

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

// Test de conexión con Firestore
(async () => {
  try {
    const testRef = collection(db, "usuarios");
    const snapshot = await getDocs(testRef);
    console.log("✅ Conexión con Firestore exitosa. Documentos:", snapshot.size);
  } catch (e) {
    console.error("❌ Error al conectar con Firestore", e);
  }
})();