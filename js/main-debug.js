// main-debug.js - Archivo principal optimizado

// Variables globales
let usuarioActual = null;
let db = null;

// Función principal de inicialización
document.addEventListener('DOMContentLoaded', async function() {
    try {        await initializeFirebase();
        setupEventListeners();
        setupValidations();
        console.log("✅ Aplicación inicializada correctamente");
    } catch (error) {
        console.error("❌ Error durante la inicialización:", error);
        showMessage("Error al inicializar la aplicación", "error");
    }
});

// Inicializar Firebase
async function initializeFirebase() {
    try {
        const { db: firebaseDB } = await import('../firebase-config.js');
        db = firebaseDB;
        
        // Test conexión
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const testRef = collection(db, "usuarios");
        const snapshot = await getDocs(testRef);
        console.log(`✅ Conectado a Firebase (${snapshot.size} usuarios)`);
        
    } catch (error) {
        console.error("❌ Error al inicializar Firebase:", error);
        throw error;
    }
}

// Configurar todos los event listeners
function setupEventListeners() {
    setupNavigation();
    setupAuthentication();
    setupLogout();
}

// Configurar navegación entre login/registro
function setupNavigation() {
    const toggleRegistro = document.getElementById('toggleRegistro');
    const toggleLogin = document.getElementById('toggleLogin');
    const loginSection = document.getElementById('login');
    const registroSection = document.getElementById('registro');
      if (toggleRegistro && loginSection && registroSection) {
        toggleRegistro.addEventListener('click', function(e) {
            e.preventDefault();
            loginSection.classList.add('hidden');
            registroSection.classList.remove('hidden');
        });
    } else {
        console.error("❌ Elementos de navegación no encontrados");
    }
      if (toggleLogin && loginSection && registroSection) {
        toggleLogin.addEventListener('click', function(e) {
            e.preventDefault();
            registroSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        });
    }
}

// Configurar autenticación
function setupAuthentication() {
    const btnLogin = document.getElementById('btnLogin');
    const btnRegistro = document.getElementById('btnRegistro');
      if (btnLogin) {
        btnLogin.addEventListener('click', async function(e) {
            e.preventDefault();
            await handleLogin();
        });
    }
      if (btnRegistro) {
        btnRegistro.addEventListener('click', async function(e) {
            e.preventDefault();
            await handleRegistration();
        });
    }
}

// Configurar logout
function setupLogout() {
    const btnLogout = document.getElementById('btnLogout');    if (btnLogout) {
        btnLogout.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
}

// Manejar login
async function handleLogin() {
    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;
    
    if (!usuario || !password) {
        showMessage("Usuario y contraseña son requeridos", "error");
        return;
    }
    
    try {        showMessage("Verificando credenciales...", "info");
        // Import Firestore functions
        const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { hashPassword } = await import('./utils.js');
        
        // Get user document
        const userRef = doc(db, "usuarios", usuario);
        const docSnap = await getDoc(userRef);
        
        if (!docSnap.exists()) {
            showMessage("Usuario o contraseña inválidos", "error");
            return;
        }
        
        const userData = docSnap.data();
        const hashedPassword = await hashPassword(password);
        
        if (userData.password !== hashedPassword) {
            showMessage("Usuario o contraseña inválidos", "error");
            document.getElementById("password").value = "";
            return;
        }
          // Login exitoso
        usuarioActual = {
            nombre: usuario,
            rol: userData.rol,
            email: userData.email || null
        };
        
        // Actualizar último acceso
        await updateDoc(userRef, {
            ultimoAcceso: new Date().toISOString()
        });
        
        showMessage("¡Bienvenido!", "success");
        showMenu();
          } catch (error) {
        console.error("Error en login:", error);
        showMessage("Error al iniciar sesión", "error");
    }
}

// Manejar registro
async function handleRegistration() {
    const usuario = document.getElementById('regUsuario').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regPasswordConfirm').value;
    
    // Validaciones básicas
    if (!usuario || !email || !password || !confirmPassword) {
        showMessage("Completa todos los campos obligatorios", "error");
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage("Las contraseñas no coinciden", "error");
        return;
    }
    
    try {        showMessage("Creando cuenta...", "info");
        // Import required functions
        const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { hashPassword, validarNombreUsuario, validarEmail } = await import('./utils.js');
        
        // Validaciones avanzadas
        if (!validarNombreUsuario(usuario)) {
            showMessage("Nombre de usuario inválido. Debe tener 3-20 caracteres", "error");
            return;
        }
        
        if (!validarEmail(email)) {
            showMessage("Formato de email inválido", "error");
            return;
        }
        
        // Verificar si el usuario ya existe
        const userDoc = await getDoc(doc(db, "usuarios", usuario));
        if (userDoc.exists()) {
            showMessage("El nombre de usuario ya existe", "error");
            return;
        }
        
        // Crear el nuevo usuario
        const hashedPassword = await hashPassword(password);
        const fechaActual = new Date().toISOString();
        
        const nuevoUsuario = {
            username: usuario,
            password: hashedPassword,
            email: email,
            rol: "empleado",
            fechaCreacion: fechaActual,
            ultimoAcceso: fechaActual,
            estadoCuenta: "activa"
        };
          await setDoc(doc(db, "usuarios", usuario), nuevoUsuario);
        
        showMessage("Cuenta creada exitosamente. Iniciando sesión...", "success");
        
        // Auto-login
        setTimeout(() => {
            usuarioActual = {
                nombre: usuario,
                rol: nuevoUsuario.rol,
                email: nuevoUsuario.email
            };
            showMenu();
        }, 1000);
          } catch (error) {
        console.error("Error en registro:", error);
        showMessage("Error al crear la cuenta. Inténtalo nuevamente.", "error");
    }
}

// Manejar logout
function handleLogout() {
    usuarioActual = null;
    
    // Ocultar menú y mostrar login
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('login').classList.remove('hidden');
    document.getElementById('registro').classList.add('hidden');
    
    // Limpiar formularios
    const inputs = ['usuario', 'password', 'regUsuario', 'regEmail', 'regPassword', 'regPasswordConfirm'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    
    showMessage("Sesión cerrada", "success");
}

// Mostrar menú principal
function showMenu() {
    const loginSection = document.getElementById('login');
    const registroSection = document.getElementById('registro');
    const menuSection = document.getElementById('menu');
    const bienvenida = document.getElementById('bienvenida');
    
    if (loginSection) loginSection.classList.add('hidden');
    if (registroSection) registroSection.classList.add('hidden');
    if (menuSection) menuSection.classList.remove('hidden');
    
    if (bienvenida && usuarioActual) {
        bienvenida.textContent = `Bienvenido, ${usuarioActual.nombre} (${usuarioActual.rol})`;
    }
    
    // Configurar acciones del menú basadas en el rol
    setupMenuActions();
      // Mostrar inventario automáticamente como en el código original
    if (usuarioActual && usuarioActual.nombre) {
        setTimeout(() => {
            import('./inventory.js').then(inventoryModule => {
                inventoryModule.mostrarInventario(usuarioActual.nombre);
            }).catch(err => {
                console.error("Error al cargar inventario automáticamente:", err);
            });
        }, 100);
    }
}

// Configurar acciones del menú según el rol (completa funcionalidad restaurada)
function setupMenuActions() {
    const acciones = document.getElementById('acciones');
    if (!acciones || !usuarioActual) {
        console.error("❌ No se puede configurar el menú - elemento acciones o usuario no disponible");
        return;
    }
    
    acciones.innerHTML = '';
    
    if (usuarioActual.rol === 'administrador') {
        // Botones para administrador
        acciones.innerHTML = `
            <button id="btnMiInventario" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                <span>Mi Inventario</span>
            </button>
            <button id="btnVerInventarios" class="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                <span>Ver Inventarios</span>
            </button>
            <button id="btnAdministrarUsuarios" class="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
                <span>Administrar Usuarios</span>
            </button>
            <button id="btnMiPerfil" class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                <i class="fas fa-user-cog"></i>
                <span>Mi Perfil</span>
            </button>
        `;
        // Agregar event listeners        
        document.getElementById('btnMiInventario').addEventListener('click', () => {
            import('./inventory.js').then(inventoryModule => {
                inventoryModule.mostrarInventario(usuarioActual.nombre);
            }).catch(err => console.error("Error importando inventory.js:", err));
        });
        
        document.getElementById('btnVerInventarios').addEventListener('click', () => {
            import('./admin.js').then(adminModule => {
                adminModule.mostrarSeleccionUsuario();
            }).catch(err => console.error("Error importando admin.js:", err));
        });
        
        document.getElementById('btnAdministrarUsuarios').addEventListener('click', () => {
            import('./admin.js').then(adminModule => {
                adminModule.administrarUsuarios();
            }).catch(err => console.error("Error importando admin.js:", err));
        });
        
        document.getElementById('btnMiPerfil').addEventListener('click', () => {
            import('./profile.js').then(profileModule => {
                profileModule.mostrarPerfilUsuario();
            }).catch(err => console.error("Error importando profile.js:", err));
        });
          // ✅ CONFIGURAR EVENTOS INTERNOS DE LOS MÓDULOS
        Promise.all([
            import('./inventory.js'),
            import('./admin.js'), 
            import('./reports.js'),
            import('./profile.js')        ]).then(([inventoryModule, adminModule, reportsModule, profileModule]) => {
            // Configurar eventos de inventario (botones modales, búsqueda, etc.)
            inventoryModule.configurarEventosInventario();
            
            // Configurar eventos de administración (usuarios, etc.)
            adminModule.configurarEventosAdmin();
            
            // Configurar eventos de reportes
            reportsModule.configurarEventosReportes();
            
            // Configurar eventos de perfil
            profileModule.configurarEventosPerfil();        }).catch(err => {
            console.error("Error configurando eventos de módulos:", err);        });
    } else {
        // Botones para empleado
        acciones.innerHTML = `
            <button id="btnMiInventarioEmpleado" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                <span>Mi Inventario</span>
            </button>
            <button id="btnMiPerfil" class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                <i class="fas fa-user-cog"></i>
                <span>Mi Perfil</span>            </button>
        `;
          // Agregar event listeners
        document.getElementById('btnMiInventarioEmpleado').addEventListener('click', () => {
            import('./inventory.js').then(inventoryModule => {
                inventoryModule.mostrarInventario(usuarioActual.nombre);
            }).catch(err => console.error("Error importando inventory.js:", err));
        });
          document.getElementById('btnMiPerfil').addEventListener('click', () => {
            import('./profile.js').then(profileModule => {
                profileModule.mostrarPerfilUsuario();
            }).catch(err => console.error("Error importando profile.js:", err));
        });
          // ✅ CONFIGURAR EVENTOS INTERNOS DE LOS MÓDULOS PARA EMPLEADOS
        Promise.all([
            import('./inventory.js'),
            import('./reports.js'),
            import('./profile.js')        ]).then(([inventoryModule, reportsModule, profileModule]) => {
            // Configurar eventos de inventario (botones modales, búsqueda, etc.)
            inventoryModule.configurarEventosInventario();
            
            // Configurar eventos de reportes
            reportsModule.configurarEventosReportes();
            
            // Configurar eventos de perfil
            profileModule.configurarEventosPerfil();        }).catch(err => {
            console.error("Error configurando eventos de módulos para empleado:", err);
        });
    }
}

// Configurar validaciones
function setupValidations() {
    // Configurar validación de contraseña en tiempo real
    const regPassword = document.getElementById('regPassword');
    if (regPassword) {
        regPassword.addEventListener('input', function() {
            validatePasswordRequirements(this.value);
        });
    }
    
    // Configurar validación de confirmación de contraseña
    const regPasswordConfirm = document.getElementById('regPasswordConfirm');
    if (regPasswordConfirm) {
        regPasswordConfirm.addEventListener('input', function() {
            const password = document.getElementById('regPassword').value;
            validatePasswordConfirmation(password, this.value);
        });
    }
}

// Validar requisitos de contraseña
function validatePasswordRequirements(password) {
    const requirements = {
        'req-length': password.length >= 8,
        'req-uppercase': /[A-Z]/.test(password),
        'req-lowercase': /[a-z]/.test(password),
        'req-number': /\d/.test(password),
        'req-special': /[@$!%*?&]/.test(password)
    };
    
    Object.entries(requirements).forEach(([id, met]) => {
        const element = document.getElementById(id);
        if (element) {
            element.className = met ? 'text-green-500 transition-colors' : 'text-red-500 transition-colors';
        }
    });
    
    // Habilitar/deshabilitar botón de registro
    const btnRegistro = document.getElementById('btnRegistro');
    const allMet = Object.values(requirements).every(Boolean);
    if (btnRegistro) {
        btnRegistro.disabled = !allMet;
        btnRegistro.className = allMet 
            ? 'w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors'
            : 'w-full bg-gray-400 text-white py-3 rounded-lg font-medium cursor-not-allowed';
    }
}

// Validar confirmación de contraseña
function validatePasswordConfirmation(password, confirmation) {
    const feedback = document.getElementById('passwordConfirmFeedback');
    if (!feedback) return;
    
    if (!confirmation) {
        feedback.textContent = '';
        feedback.className = 'text-xs mt-1';
    } else if (password === confirmation) {
        feedback.textContent = '✓ Las contraseñas coinciden';
        feedback.className = 'text-xs mt-1 text-green-500';
    } else {
        feedback.textContent = '✗ Las contraseñas no coinciden';
        feedback.className = 'text-xs mt-1 text-red-500';
    }
}

// Función para mostrar mensajes
function showMessage(mensaje, tipo = 'info', timeout = 3000) {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    
    // Crear toast
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 transition-all duration-300 transform translate-x-full ${
        tipo === 'error' ? 'bg-red-500' : 
        tipo === 'success' ? 'bg-green-500' : 
        tipo === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
    }`;
    toast.textContent = mensaje;
    
    document.body.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Remover después del timeout
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, timeout);
}

// Funciones de utilidad para compatibilidad con otros módulos
export function getUsuarioActual() {
    return usuarioActual;
}

export function setUsuarioActual(usuario) {
    usuarioActual = usuario;
}

// Hacer las funciones disponibles globalmente para los módulos que las necesiten
window.getUsuarioActual = getUsuarioActual;
window.setUsuarioActual = setUsuarioActual;

// También exportar otras funciones útiles para debugging
export { showMessage };
window.showMessage = showMessage;
