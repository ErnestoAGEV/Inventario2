// auth.js - Autenticación y gestión de usuarios
import { db } from "../firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { DOM } from './dom.js';
import { 
  hashPassword, 
  validarPassword, 
  validarNombreUsuario, 
  validarEmail, 
  validarCoincidenciaPassword,
  evaluarFortalezaPassword 
} from './utils.js';
import { mostrarMensajeLogin, mostrarMensajeRegistro, configurarValidacionPassword, mostrarMenu } from './ui.js';
import { precaucionOperacion } from './security.js';

// Variables globales de autenticación
export let usuarioActual = null;

export function setUsuarioActual(usuario) {
  usuarioActual = usuario;
  // Sincronizar con la variable global de main-debug.js si está disponible
  if (window.setUsuarioActual) {
    window.setUsuarioActual(usuario);
  }
}

export function getUsuarioActual() {
  // Priorizar la variable global de main-debug.js si está disponible
  if (window.getUsuarioActual && typeof window.getUsuarioActual === 'function') {
    return window.getUsuarioActual();
  }
  return usuarioActual;
}

// Configurar eventos de autenticación
export async function configurarEventosAuth() {
  console.log("🔧 Configurando eventos de autenticación...");
  
  // Verificar que los elementos existen
  console.log("toggleRegistro element:", DOM.toggleRegistro);
  console.log("toggleLogin element:", DOM.toggleLogin);
  console.log("btnLogin element:", DOM.btnLogin);
  console.log("btnRegistro element:", DOM.btnRegistro);
  
  // Eventos de navegación entre login/registro
  if (DOM.toggleRegistro) {
    DOM.toggleRegistro.addEventListener("click", () => {
      console.log("🔄 Cambiando a registro");
      DOM.loginSection.classList.add("hidden");
      DOM.registroSection.classList.remove("hidden");
    });
    console.log("✅ Event listener para toggleRegistro configurado");
  } else {
    console.error("❌ No se encontró el elemento toggleRegistro");
  }

  if (DOM.toggleLogin) {
    DOM.toggleLogin.addEventListener("click", () => {
      console.log("🔄 Cambiando a login");
      DOM.registroSection.classList.add("hidden");
      DOM.loginSection.classList.remove("hidden");
    });
    console.log("✅ Event listener para toggleLogin configurado");
  } else {
    console.error("❌ No se encontró el elemento toggleLogin");
  }
  // Configurar validación de contraseña (ahora es async)
  await configurarValidacionPassword();
  
  // Evento de registro simplificado
  if (DOM.btnRegistro) {
    DOM.btnRegistro.addEventListener("click", async () => {
      console.log("🔧 Botón de registro presionado");
      try {
        // Aplicar rate limiting
        await precaucionOperacion();
        
        const user = document.getElementById("regUsuario").value.trim();
        const pass = document.getElementById("regPassword").value.trim();
        const confirmPass = document.getElementById("regPasswordConfirm").value.trim();
        const email = document.getElementById("regEmail").value.trim();

        console.log("📝 Datos del registro:", { user, email, passLength: pass.length });

        // Validaciones básicas
        if (!user || !pass || !email) {
          mostrarMensajeRegistro("Completa todos los campos obligatorios", 'error');
          return;
        }

      // Validaciones avanzadas
      if (!validarNombreUsuario(user)) {
        mostrarMensajeRegistro("Nombre de usuario inválido. Debe tener 3-20 caracteres (letras, números, guiones bajos)", 'error');
        return;
      }

      if (!validarEmail(email)) {
        mostrarMensajeRegistro("Formato de email inválido", 'error');
        return;
      }

      const passwordEvaluation = evaluarFortalezaPassword(pass);
      if (!passwordEvaluation.esValida) {
        mostrarMensajeRegistro("La contraseña no cumple con todos los requisitos de seguridad", 'error');
        return;
      }

      if (!validarCoincidenciaPassword(pass, confirmPass)) {
        mostrarMensajeRegistro("Las contraseñas no coinciden", 'error');
        return;
      }

      // Verificar si el usuario ya existe
      const userDoc = await getDoc(doc(db, "usuarios", user));
      if (userDoc.exists()) {
        mostrarMensajeRegistro("El nombre de usuario ya existe", 'error');
        return;
      }

      // Crear el nuevo usuario
      const hashedPassword = await hashPassword(pass);
      const fechaActual = new Date().toISOString();
      
      const nuevoUsuario = {
        username: user,
        password: hashedPassword,
        email: email,
        rol: "empleado", // Rol por defecto
        fechaCreacion: fechaActual,
        ultimoAcceso: fechaActual,
        estadoCuenta: "activa"
      };

      await setDoc(doc(db, "usuarios", user), nuevoUsuario);
      
      mostrarMensajeRegistro("Cuenta creada exitosamente. Iniciando sesión...", 'success');
      
      // Auto-login después del registro
      setTimeout(async () => {
        usuarioActual = {
          nombre: user,
          rol: nuevoUsuario.rol,
          email: nuevoUsuario.email
        };
        
        // Actualizar último acceso
        await updateDoc(doc(db, "usuarios", user), {
          ultimoAcceso: new Date().toISOString()
        });
        
        mostrarMenu();
      }, 1000);      
    } catch (error) {
      console.error("Error en registro:", error);
      mostrarMensajeRegistro("Error al crear la cuenta. Inténtalo nuevamente.", 'error');
    }
    });
    console.log("✅ Event listener para btnRegistro configurado");
  } else {
    console.error("❌ No se encontró el elemento btnRegistro");
  }

  // Evento de login con protección contra fuerza bruta
  if (DOM.btnLogin) {
    DOM.btnLogin.addEventListener("click", async () => {
      console.log("🔧 Botón de login presionado");
      const user = document.getElementById("usuario").value.trim();
      const pass = document.getElementById("password").value;
      console.log("👤 Usuario:", user, "Password length:", pass.length);

      try {const userRef = doc(db, "usuarios", user);
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
      
      // Login exitoso: resetear contador y actualizar último acceso
      await updateDoc(userRef, {
        failedAttempts: 0, 
        lockUntil: 0,
        ultimoAcceso: new Date().toISOString()
      });
      
      usuarioActual = { 
        nombre: user, 
        rol: userData.rol,
        email: userData.email || null,
        nombreCompleto: userData.nombreCompleto || null,
        fechaCreacion: userData.fechaCreacion || null,
        ultimoAcceso: userData.ultimoAcceso || null
      };
        mostrarMenu();
    } catch (error) {
      console.error("Error en login:", error);
      mostrarMensajeLogin("Error al iniciar sesión", 'error');
    }
    });
    console.log("✅ Event listener para btnLogin configurado");
  } else {
    console.error("❌ No se encontró el elemento btnLogin");
  }
  
  console.log("🔧 Configuración de eventos de autenticación completada");
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
