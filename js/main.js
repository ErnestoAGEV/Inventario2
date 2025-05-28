// main.js - Archivo principal que coordina todo
import { db } from "../firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { DOM } from './dom.js';
import { configurarEventosAuth, cerrarSesion } from './auth.js';
import { configurarEventosInventario } from './inventory.js';
import { configurarEventosAdmin } from './admin.js';
import { configurarEventosReportes } from './reports.js';

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM cargado, inicializando aplicación...");

  // Configurar todos los eventos
  configurarEventosGlobales();
  configurarEventosAuth();
  configurarEventosInventario();
  configurarEventosAdmin();
  configurarEventosReportes();

  // Test de conexión con Firestore
  testConexionFirestore();
});

// Configurar eventos globales
function configurarEventosGlobales() {
  console.log("Conectando event listeners...");
  console.log("btnLogin element:", DOM.btnLogin);

  DOM.btnLogout.addEventListener("click", cerrarSesion);
}

// Test de conexión con Firestore
async function testConexionFirestore() {
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
}
