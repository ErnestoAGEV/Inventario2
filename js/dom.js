// dom.js - Referencias a elementos del DOM
export const DOM = {
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
