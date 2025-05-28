// security.js - Medidas de seguridad y limitaciones
// --- Medidas de precaución básicas contra abuso/DoS ---
const OPERACION_LIMITE = 30; // Máximo de operaciones permitidas por minuto
let operacionesRecientes = [];

export function registrarOperacion() {
  const ahora = Date.now();
  // Elimina operaciones de hace más de 1 minuto
  operacionesRecientes = operacionesRecientes.filter(ts => ahora - ts < 60000);
  operacionesRecientes.push(ahora);
  if (operacionesRecientes.length > OPERACION_LIMITE) {
    return false; // Límite superado
  }
  return true;
}

export function precaucionOperacion() {
  if (!registrarOperacion()) {
    alert("Has realizado demasiadas operaciones en poco tiempo. Espera unos segundos antes de continuar.");
    // Retraso artificial para frenar bots
    return new Promise(res => setTimeout(res, 2000));
  }
  return Promise.resolve();
}
