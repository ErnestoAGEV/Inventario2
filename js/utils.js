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

// Función para validar nombre de usuario
export function validarNombreUsuario(username) {
  // Requisitos: 3-20 caracteres, solo letras, números y guiones bajos
  const regex = /^[a-zA-Z0-9_]{3,20}$/;
  return regex.test(username);
}

// Función para validar email (ahora obligatorio)
export function validarEmail(email) {
  if (!email || email.trim() === '') return false; // Email es obligatorio
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Función para validar coincidencia de contraseñas
export function validarCoincidenciaPassword(password, confirmPassword) {
  return password === confirmPassword && password.length > 0;
}

// Función para evaluar y mostrar visualmente los requisitos de contraseña
export function evaluarRequisitosPassword(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password)
  };
  
  // Actualizar elementos visuales
  const reqElements = {
    length: document.getElementById('req-length'),
    uppercase: document.getElementById('req-uppercase'),
    lowercase: document.getElementById('req-lowercase'),
    number: document.getElementById('req-number'),
    special: document.getElementById('req-special')
  };
  
  // Actualizar colores según cumplimiento
  Object.keys(requirements).forEach(req => {
    const element = reqElements[req];
    if (element) {
      if (requirements[req]) {
        element.className = 'text-green-500 transition-colors';
      } else {
        element.className = 'text-red-500 transition-colors';
      }
    }
  });
  
  // Retornar si todos los requisitos se cumplen
  return Object.values(requirements).every(req => req);
}

// Función para validar fortaleza de contraseña (simplificada)
export function evaluarFortalezaPassword(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password)
  };
  
  const score = Object.values(requirements).filter(req => req).length;
  
  let nivel;
  if (score < 3) nivel = 'débil';
  else if (score < 5) nivel = 'media';
  else nivel = 'fuerte';
    return {
    nivel,
    score,
    esValida: score === 5
  };
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
