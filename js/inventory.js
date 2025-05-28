// inventory.js - Gestión del inventario y productos
import { db } from "../firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { DOM } from './dom.js';
import { getUsuarioActual } from './auth.js';
import { escapeHTML, mostrarMensajeUI, mostrarConfirmacionUI } from './ui.js';
import { validarNombreProducto, validarCantidad } from './utils.js';
import { precaucionOperacion } from './security.js';

// Variables globales del inventario
export let inventarioActual = null;
export let productoActual = null;
export let productosCache = [];

export function setInventarioActual(inventario) {
  inventarioActual = inventario;
}

export function getInventarioActual() {
  return inventarioActual;
}

export function setProductoActual(producto) {
  productoActual = producto;
}

export function getProductosCache() {
  return productosCache;
}

export function setProductosCache(productos) {
  productosCache = productos;
}

// Configurar eventos del inventario
export function configurarEventosInventario() {
  DOM.buscarProducto.addEventListener("input", filtrarProductos);
  DOM.btnAgregarProducto.addEventListener("click", mostrarModalAgregar);
  DOM.btnCancelarModal.addEventListener("click", ocultarModal);
  DOM.btnGuardarProducto.addEventListener("click", guardarProducto);
}

// Funciones de inventario
export async function mostrarInventario(usuario) {
  const userDoc = await getDoc(doc(db, "usuarios", usuario));

  // Bloquear acceso a inventarios de otros administradores
  if (
    userDoc.exists() &&
    userDoc.data().rol === "administrador" &&
    usuario !== getUsuarioActual().nombre
  ) {
    alert("No puedes acceder al inventario de otro administrador");
    return;
  }

  inventarioActual = usuario;
  DOM.inventarioTitle.textContent = `Inventario de ${usuario}`;
  DOM.inventarioSection.classList.remove("hidden");

  // Mostrar botón de agregar solo si es el propio usuario o administrador viendo un no-admin
  const esAdminActual = getUsuarioActual().rol === "administrador";
  const esMismoUsuario = usuario === getUsuarioActual().nombre;
  const esUsuarioNoAdmin =
    userDoc.exists() && userDoc.data().rol !== "administrador";

  DOM.btnAgregarProducto.style.display =
    esMismoUsuario || (esAdminActual && esUsuarioNoAdmin) ? "block" : "none";

  await cargarProductos(usuario);
}

export async function cargarProductos(usuario) {
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

export function agregarFilaProducto(producto) {
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

export function filtrarProductos() {
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
export function mostrarModalAgregar() {
  productoActual = null;
  DOM.modalTitle.textContent = "Agregar Producto";
  DOM.productoNombre.value = "";
  DOM.productoCantidad.value = "";
  DOM.productoModal.classList.remove("hidden");
}

export function mostrarModalEditar(producto) {
  productoActual = producto;
  DOM.modalTitle.textContent = "Editar Producto";
  DOM.productoNombre.value = producto.nombre;
  DOM.productoCantidad.value = producto.cantidad;
  DOM.productoModal.classList.remove("hidden");
}

export function ocultarModal() {
  DOM.productoModal.classList.add("hidden");
}

export function editarProducto(producto) {
  // Verificar permisos básicos
  if (
    getUsuarioActual().rol !== "administrador" &&
    getUsuarioActual().nombre !== inventarioActual
  ) {
    alert("No tienes permisos para editar este producto");
    return;
  }

  // Verificar adicionalmente si es inventario de otro admin
  getDoc(doc(db, "usuarios", inventarioActual)).then((docSnap) => {
    if (
      docSnap.exists() &&
      docSnap.data().rol === "administrador" &&
      inventarioActual !== getUsuarioActual().nombre
    ) {
      alert("No puedes editar productos de otro administrador");
      return;
    }

    mostrarModalEditar(producto);
  });
}

export function confirmarEliminarProducto(producto) {
  // Verificar permisos básicos
  if (
    getUsuarioActual().rol !== "administrador" &&
    getUsuarioActual().nombre !== inventarioActual
  ) {
    alert("No tienes permisos para eliminar este producto");
    return;
  }

  // Verificar adicionalmente si es inventario de otro admin
  getDoc(doc(db, "usuarios", inventarioActual)).then((docSnap) => {
    if (
      docSnap.exists() &&
      docSnap.data().rol === "administrador" &&
      inventarioActual !== getUsuarioActual().nombre
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
export async function guardarProducto() {
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

      mostrarMensajeUI("Producto actualizado correctamente", 'success');
    } else {
      const docRef = await addDoc(
        collection(db, "inventarios", inventarioActual, "productos"),
        {
          nombre,
          cantidad,
        }
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

export async function eliminarProducto(id) {
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
