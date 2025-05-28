// utils.js - Utilidades y funciones de validación

// Función para generar hash SHA-256 (cliente-side)
export async function hashPassword(password) {
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

// Función para validar contraseña
export function validarPassword(password) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

// Función para validar nombre de producto
export function validarNombreProducto(nombre) {
  return nombre && nombre.trim().length > 0;
}

// Función para validar cantidad
export function validarCantidad(cantidad) {
  return !isNaN(cantidad) && cantidad >= 0;
}

// Función para escapar texto en reportes PDF
export function escapeText(text) {
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
