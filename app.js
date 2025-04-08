import { db } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, setDoc,
  addDoc, updateDoc, deleteDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let usuarioActual = null;
let productoActual = null;
let inventarioActual = null;
let productosCache = [];

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
  
  // Modal
  productoModal: document.getElementById("productoModal"),
  modalTitle: document.getElementById("modalTitle"),
  productoNombre: document.getElementById("productoNombre"),
  productoCantidad: document.getElementById("productoCantidad"),
  btnCancelarModal: document.getElementById("btnCancelarModal"),
  btnGuardarProducto: document.getElementById("btnGuardarProducto")
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

// Registro
DOM.btnRegistro.addEventListener("click", async () => {
  const user = document.getElementById("regUsuario").value.trim();
  const pass = document.getElementById("regPassword").value.trim();
  const rol = document.getElementById("regRol").value;

  if (!user || !pass) return alert("Completa todos los campos");

  const userRef = doc(db, "usuarios", user);
  const existing = await getDoc(userRef);
  if (existing.exists()) {
    alert("Ese usuario ya existe");
  } else {
    await setDoc(userRef, { password: pass, rol });
    alert("Usuario registrado con éxito");
    DOM.registroSection.classList.add("hidden");
    DOM.loginSection.classList.remove("hidden");
  }
});

// Login
DOM.btnLogin.addEventListener("click", async () => {
  const user = document.getElementById("usuario").value;
  const pass = document.getElementById("password").value;

  const docSnap = await getDoc(doc(db, "usuarios", user));
  if (!docSnap.exists() || docSnap.data().password !== pass) {
    alert("Usuario o contraseña inválidos");
    return;
  }

  usuarioActual = { nombre: user, rol: docSnap.data().rol };
  mostrarMenu();
});

// Mostrar menú según rol
function mostrarMenu() {
  DOM.loginSection.classList.add("hidden");
  DOM.registroSection.classList.add("hidden");
  DOM.menuSection.classList.remove("hidden");
  DOM.bienvenida.textContent = `Bienvenido ${usuarioActual.nombre} (${usuarioActual.rol.toUpperCase()})`;

  DOM.acciones.innerHTML = "";

  if (usuarioActual.rol === "empleado") {
    agregarBoton("Ver mi inventario", () => mostrarInventario(usuarioActual.nombre));
  }

  if (usuarioActual.rol === "supervisor" || usuarioActual.rol === "administrador") {
    agregarBoton("Ver todos los inventarios", mostrarSeleccionUsuario);
  }

  if (usuarioActual.rol === "administrador") {
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
  inventarioActual = usuario;
  DOM.inventarioTitle.textContent = `Inventario de ${usuario}`;
  DOM.inventarioSection.classList.remove("hidden");
  
  // Mostrar solo el botón de agregar si es el inventario propio o si es admin
  DOM.btnAgregarProducto.style.display = 
    (usuario === usuarioActual.nombre || usuarioActual.rol === "administrador") 
    ? "block" : "none";
  
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
  
  // Agregar eventos a los botones
  row.querySelector(".editar-btn").addEventListener("click", () => editarProducto(producto));
  row.querySelector(".eliminar-btn").addEventListener("click", () => confirmarEliminarProducto(producto));
}

function filtrarProductos() {
  const termino = DOM.buscarProducto.value.toLowerCase();
  const filas = DOM.tablaProductos.querySelectorAll("tr");
  
  filas.forEach(fila => {
    if (fila.querySelector("td")) { // Ignora la fila de "no hay productos"
      const nombreProducto = fila.querySelector("td").textContent.toLowerCase();
      fila.style.display = nombreProducto.includes(termino) ? "" : "none";
    }
  });
}

async function mostrarSeleccionUsuario() {
  const usuariosRef = collection(db, "usuarios");
  const usuariosSnap = await getDocs(usuariosRef);
  
  let usuarios = [];
  usuariosSnap.forEach(doc => {
    usuarios.push({id: doc.id, ...doc.data()});
  });
  
  if (usuarios.length === 0) {
    alert("No hay usuarios registrados");
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

// Funciones para el modal
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
  if (usuarioActual.rol !== "administrador" && usuarioActual.nombre !== inventarioActual) {
    alert("No tienes permisos para editar este producto");
    return;
  }
  mostrarModalEditar(producto);
}

function confirmarEliminarProducto(producto) {
  if (usuarioActual.rol !== "administrador" && usuarioActual.nombre !== inventarioActual) {
    alert("No tienes permisos para eliminar este producto");
    return;
  }
  
  if (confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
    eliminarProducto(producto.id);
  }
}

// Funciones CRUD
async function guardarProducto() {
  const nombre = DOM.productoNombre.value.trim();
  const cantidad = parseInt(DOM.productoCantidad.value, 10);
  
  if (!nombre || isNaN(cantidad)) {
    alert("Por favor completa todos los campos correctamente");
    return;
  }
  
  try {
    if (productoActual) {
      // Editar producto existente
      await updateDoc(doc(db, "inventarios", inventarioActual, "productos", productoActual.id), {
        nombre,
        cantidad
      });
      
      // Actualizar caché
      const index = productosCache.findIndex(p => p.id === productoActual.id);
      if (index !== -1) {
        productosCache[index] = { ...productosCache[index], nombre, cantidad };
      }
      
      alert("Producto actualizado correctamente");
    } else {
      // Agregar nuevo producto
      const docRef = await addDoc(collection(db, "inventarios", inventarioActual, "productos"), {
        nombre,
        cantidad
      });
      
      // Agregar a caché
      productosCache.push({ id: docRef.id, nombre, cantidad });
      
      alert("Producto agregado correctamente");
    }
    
    // Actualizar vista
    DOM.tablaProductos.innerHTML = "";
    if (productosCache.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="3" class="py-4 text-center text-gray-500">No hay productos en este inventario</td>`;
      DOM.tablaProductos.appendChild(row);
    } else {
      productosCache.forEach(agregarFilaProducto);
    }
    
    ocultarModal();
    DOM.buscarProducto.value = ""; // Limpiar búsqueda
  } catch (error) {
    console.error("Error al guardar producto:", error);
    alert("Error al guardar producto");
  }
}

async function eliminarProducto(id) {
  try {
    await deleteDoc(doc(db, "inventarios", inventarioActual, "productos", id));
    
    // Actualizar caché
    productosCache = productosCache.filter(p => p.id !== id);
    
    // Recargar la tabla
    DOM.tablaProductos.innerHTML = "";
    if (productosCache.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="3" class="py-4 text-center text-gray-500">No hay productos en este inventario</td>`;
      DOM.tablaProductos.appendChild(row);
    } else {
      productosCache.forEach(agregarFilaProducto);
    }
    
    alert("Producto eliminado correctamente");
    DOM.buscarProducto.value = ""; // Limpiar búsqueda
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    alert("Error al eliminar producto");
  }
}

async function administrarUsuarios() {
  alert("Funcionalidad de administración de usuarios en desarrollo");
}

function cerrarSesion() {
  usuarioActual = null;
  inventarioActual = null;
  productosCache = [];
  DOM.menuSection.classList.add("hidden");
  DOM.inventarioSection.classList.add("hidden");
  DOM.loginSection.classList.remove("hidden");
  DOM.buscarProducto.value = "";
  
  // Limpiar campos de login
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