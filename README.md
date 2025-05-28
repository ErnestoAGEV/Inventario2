#  Sistema de Gestión de Inventarios

Un sistema web moderno para la gestión de inventarios con autenticación de usuarios, roles diferenciados y una interfaz intuitiva desarrollado con JavaScript vanilla y Firebase Firestore.

##  Características

###  Autenticación y Seguridad
- **Sistema de login seguro** con hash SHA-256 para contraseñas
- **Protección contra fuerza bruta** (bloqueo temporal tras intentos fallidos)
- **Validación de contraseñas robustas** (8+ caracteres, mayúsculas, minúsculas, números y símbolos)
- **Control de acceso basado en roles** (Administrador/Empleado)
- **Rate limiting** para prevenir ataques DoS

###  Gestión de Usuarios
- **Dos tipos de roles:**
  - **Administrador**: Acceso completo al sistema
  - **Empleado**: Acceso limitado a su propio inventario
- **Administración de usuarios** (solo para administradores)
- **Creación, edición y eliminación** de cuentas de usuario

###  Gestión de Inventarios
- **Inventarios individuales** por usuario
- **CRUD completo** de productos (Crear, Leer, Actualizar, Eliminar)
- **Búsqueda y filtrado** de productos en tiempo real
- **Validación de datos** para nombres y cantidades

###  Panel de Administrador
- **Vista de inventarios de empleados** 
- **Gestión centralizada de usuarios**
- **Modal con scroll optimizado** para listas largas de usuarios
- **Permisos granulares** de edición y eliminación

###  Reportes
- **Generación de PDFs** para reportes de inventario
- **Múltiples tipos de reportes:**
  - Inventario completo
  - Productos con stock bajo

###  Interfaz de Usuario
- **Diseño moderno** con Tailwind CSS
- **Componentes glass-effect** para modales
- **Animaciones suaves** y transiciones
- **Responsive design** para múltiples dispositivos
- **Iconografía Font Awesome**

##  Tecnologías Utilizadas

- **Frontend:**
  - JavaScript
  - HTML5 & CSS
  - Tailwind CSS
  - Font Awesome Icons
  
- **Backend:**
  - Firebase Firestore (Base de datos NoSQL)
  
- **Librerías:**
  - jsPDF (Generación de reportes PDF)
  - jsPDF AutoTable (Tablas en PDF)

##  Estructura del Proyecto

```
Inventario2/
├── index.html          # Página principal del sistema
├── landing.html        # Página de bienvenida
├── app.js             # Lógica principal de la aplicación
├── firebase-config.js  # Configuración de Firebase
└── README.md          # Documentación del proyecto
```

##  Instalación y Configuración

### Prerrequisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Proyecto de Firebase configurado
- Acceso a internet para CDNs

### Configuración de Firebase

1. **Crear proyecto en Firebase:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Crea un nuevo proyecto
   - Habilita Firestore Database

2. **Configurar Firestore:**
   - En la consola de Firebase, ve a Firestore Database
   - Configura las reglas de seguridad (ver sección de seguridad)

3. **Obtener configuración:**
   - Ve a Configuración del proyecto > General
   - En "Tus apps", selecciona la configuración web
   - Copia la configuración y actualiza `firebase-config.js`

### Configuración Local

1. **Clonar o descargar** los archivos del proyecto
2. **Actualizar `firebase-config.js`** con tu configuración de Firebase:

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};
```

3. **Abrir `index.html`** en tu navegador
4. **Crear el primer usuario administrador** desde el formulario de registro


##  Uso del Sistema

###  Primer Uso
1. Abre `index.html` en tu navegador
2. Crea una cuenta de administrador usando el botón "Crear cuenta nueva"
3. Completa el formulario con una contraseña segura
4. Una vez logueado, aparecerá el panel de administrador

###  Como Usuario Administrador
- **Mi Inventario**: Gestiona tu propio inventario
- **Ver Inventarios**: Accede a inventarios de empleados
- **Administrar Usuarios**: Crear, editar y eliminar usuarios

###  Como Usuario Empleado
- **Mi Inventario**: Gestiona únicamente tu inventario personal
- Sin acceso a funciones administrativas

###  Generar Reportes
1. Desde cualquier inventario, clic en "Generar Reporte"
2. Selecciona el tipo de reporte deseado
3. El PDF se descarga automáticamente


##  Estructura de Datos

### Colección `usuarios`
```javascript
{
  "nombreUsuario": {
    password: "hash_sha256",
    rol: "administrador" | "empleado",
    failedAttempts: 0,  // Para protección contra fuerza bruta
    lockUntil: 0        // Timestamp de bloqueo
  }
}
```

### Colección `inventarios/{userId}/productos`
```javascript
{
  "productoId": {
    nombre: "Nombre del producto",
    cantidad: 100
  }
}
```
