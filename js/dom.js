// dom.js - Referencias dinámicas a elementos del DOM
export const DOM = {
  // Login/Registro
  get loginSection() { return document.getElementById("login"); },
  get registroSection() { return document.getElementById("registro"); },
  get toggleRegistro() { return document.getElementById("toggleRegistro"); },
  get toggleLogin() { return document.getElementById("toggleLogin"); },
  get btnLogin() { return document.getElementById("btnLogin"); },
  get btnRegistro() { return document.getElementById("btnRegistro"); },
  get btnLogout() { return document.getElementById("btnLogout"); },

  // Menú
  get menuSection() { return document.getElementById("menu"); },
  get bienvenida() { return document.getElementById("bienvenida"); },
  get acciones() { return document.getElementById("acciones"); },

  // Inventario
  get inventarioSection() { return document.getElementById("inventarioSection"); },
  get inventarioTitle() { return document.getElementById("inventarioTitle"); },
  get tablaProductos() { return document.getElementById("tablaProductos"); },
  get btnAgregarProducto() { return document.getElementById("btnAgregarProducto"); },
  get buscarProducto() { return document.getElementById("buscarProducto"); },
  get btnGenerarReporte() { return document.getElementById("btnGenerarReporte"); },

  // Modal Producto
  get productoModal() { return document.getElementById("productoModal"); },
  get modalTitle() { return document.getElementById("modalTitle"); },
  get productoNombre() { return document.getElementById("productoNombre"); },
  get productoCantidad() { return document.getElementById("productoCantidad"); },
  get btnCancelarModal() { return document.getElementById("btnCancelarModal"); },
  get btnGuardarProducto() { return document.getElementById("btnGuardarProducto"); },
  
  // Administración de Usuarios
  get usuariosModal() { return document.getElementById("usuariosModal"); },
  get buscarUsuario() { return document.getElementById("buscarUsuario"); },
  get tablaUsuarios() { return document.getElementById("tablaUsuarios"); },
  get btnCancelarUsuarios() { return document.getElementById("btnCancelarUsuarios"); },

  // Editar Usuario
  get usuarioEditarModal() { return document.getElementById("usuarioEditarModal"); },
  get usuarioModalTitle() { return document.getElementById("usuarioModalTitle"); },
  get editUsuario() { return document.getElementById("editUsuario"); },
  get editPassword() { return document.getElementById("editPassword"); },
  get editRol() { return document.getElementById("editRol"); },
  get btnCancelarEditarUsuario() { return document.getElementById("btnCancelarEditarUsuario"); },
  get btnGuardarUsuario() { return document.getElementById("btnGuardarUsuario"); },

  // Reportes
  get reporteModal() { return document.getElementById("reporteModal"); },
  get tipoReporte() { return document.getElementById("tipoReporte"); },
  get btnCancelarReporte() { return document.getElementById("btnCancelarReporte"); },
  get btnDescargarReporte() { return document.getElementById("btnDescargarReporte"); },
};
