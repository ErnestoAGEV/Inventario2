// auth.js - Autenticación y gestión de usuarios
import { db } from "../firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { DOM } from './dom.js';
import { hashPassword, validarPassword } from './utils.js';
import { mostrarMensajeLogin, mostrarMensajeRegistro, configurarValidacionPassword, mostrarMenu } from './ui.js';

// Variables globales de autenticación
export let usuarioActual = null;

export function setUsuarioActual(usuario) {
  usuarioActual = usuario;
}

export function getUsuarioActual() {
  return usuarioActual;
}

// Configurar eventos de autenticación
export function configurarEventosAuth() {
  // Eventos de navegación entre login/registro
  DOM.toggleRegistro.addEventListener("click", () => {
    DOM.loginSection.classList.add("hidden");
    DOM.registroSection.classList.remove("hidden");
  });

  DOM.toggleLogin.addEventListener("click", () => {
    DOM.registroSection.classList.add("hidden");
    DOM.loginSection.classList.remove("hidden");
  });

  // Configurar validación de contraseña
  configurarValidacionPassword();

  // Evento de registro
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

  // Evento de login con protección contra fuerza bruta
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
}

// Cerrar sesión
export function cerrarSesion() {
  usuarioActual = null;
  DOM.menuSection.classList.add("hidden");
  DOM.inventarioSection.classList.add("hidden");
  DOM.loginSection.classList.remove("hidden");
  DOM.buscarProducto.value = "";

  document.getElementById("usuario").value = "";
  document.getElementById("password").value = "";
}
