# Clocker React - Project Documentation & System Context

Este archivo sirve como base de conocimientos y guía de directrices fundamentales para cualquier modelo de Inteligencia Artificial (particularmente Gemini CLI) que trabaje sobre este repositorio. Contiene el contexto detallado de la arquitectura del proyecto, la estructura de directorios, convenciones de desarrollo y restricciones estrictas para evitar modificaciones accidentales o destructivas de código.

---

## 1. Visión General del Proyecto

**Clocker React** es una aplicación web interactiva en tiempo real orientada a la productividad, gestión de asistencia, colaboración y comunicación interna en entornos empresariales. La plataforma integra monitoreo de estados de empleados en tiempo real, chat multimedia interactivo, llamadas de audio/video mediante WebRTC, alertas masivas y un asistente de Inteligencia Artificial integrado.

### Características Principales:
1.  **Gestión de Estados (Status Manager):** Permite a los usuarios marcar su estado diario (Presente, Almuerzo, Break, Reunión, Soporte, etc.) mediante una interfaz intuitiva con temporizadores en tiempo real.
2.  **Monitoreo en Tiempo Real (Real-Time Status Grid):** Cuadrícula dinámica para administradores y supervisores que muestra el estado actual de cada miembro del equipo al instante.
3.  **Chat Multimedia Interno (Chat Panel):** Canal de mensajería instantánea directa y grupal compatible con reacciones de emojis, envío y vista previa de archivos multimedia (imágenes, audios).
4.  **Llamadas y Videollamadas (Call Manager - WebRTC):** Comunicación directa peer-to-peer de audio y video utilizando canales de señalización de sockets.
5.  **Notificaciones Globales y Alertas (Notification Center):** Centro de notificaciones visuales y sonoras (alertas de llamadas, mensajes nuevos, anuncios de sistema).
6.  **Asistente Inteligente (Clocker IA):** Widget flotante y arrastrable de Inteligencia Artificial que actúa como asistente de soporte o consultas dentro de la aplicación.

---

## 2. Pila Tecnológica (Tech Stack)

*   **Framework de UI:** React (v18.3.1) utilizando JavaScript moderno (JSX).
*   **Herramienta de Construcción:** Vite (v5.4.21) para un bundling ultrarrápido y soporte de módulos ES.
*   **Estilos:** Tailwind CSS (v4) configurado con PostCSS, apoyado por hojas de estilo personalizadas (`App.css` y `index.css`).
*   **Gestión de Estado & Contexto:** React Context API para la gestión reactiva global (`AuthContext`, `CallContext`, `NotificationContext`).
*   **Comunicación en Tiempo Real:** Socket.IO Client (v4.8.3) para persistir la conexión WebSocket bidireccional y de baja latencia con el backend.
*   **Llamadas Peer-to-Peer:** Simple-Peer (v9.11.1) para la negociación de conexiones WebRTC directas entre navegadores.
*   **Interacciones y UI Avanzada:**
    *   `react-draggable` (v4.7.0) para ventanas flotantes y móviles (asistente IA, panel de llamadas).
    *   `emoji-picker-react` (v4.19.1) para el chat.
    *   `react-datepicker` (v9.1.0) para selección de rangos de fechas.
    *   `react-markdown` (v10.1.0) para renderizado de contenido dinámico de IA.
    *   `date-fns` (v4.4.0) para formato preciso de fechas y horas de estados.
*   **Iconografía:** FontAwesome (`@fortawesome/react-fontawesome` y `@fortawesome/free-solid-svg-icons`).

---

## 3. Estructura Detallada del Proyecto (Directorio & Componentes)

A continuación se detalla la estructura física y lógica del código fuente para preservar la modularidad del sistema:

```text
C:\Users\Web Developer 1\Documents\JS\Clocker JS\clocker-react\
├───.env                            # Configuración de variables de entorno locales
├───.gitignore                      # Reglas de exclusión para Git
├───192.168.1.218+2-key.pem         # Certificado SSL privado para desarrollo HTTPS
├───192.168.1.218+2.pem             # Certificado SSL público para desarrollo HTTPS
├───catalyst.json                   # Archivo de configuración adicional
├───eslint.config.js                # Reglas de calidad y estilo de código de ESLint
├───index.html                      # Punto de entrada HTML del cliente
├───package-lock.json               # Árbol de dependencias exacto
├───package.json                    # Dependencias, scripts y metadatos del proyecto
├───postcss.config.js               # Configuración de PostCSS para el compilador CSS
├───README.md                       # Documentación básica para desarrolladores humanos
├───vite.config.js                  # Configuración del empaquetador Vite (incluye polyfills de Node)
│
├───public\                         # Recursos públicos no procesados por Vite
│   ├───images\                     # Recursos gráficos fijos
│   │   ├───icon.svg                # Icono de la pestaña del navegador
│   │   ├───logo.svg                # Logotipo oficial de Clocker
│   │   └───no-profile-photo.webp   # Imagen predeterminada para perfiles sin foto
│   └───sounds\                     # Efectos de sonido del sistema
│       ├───incoming call.mp3       # Tono de llamada de audio/video entrante
│       ├───noty.mp3                # Tono de nueva notificación o mensaje del chat
│       └───outcalling call.mp3     # Tono de espera al realizar una llamada saliente
│
└───src\                            # Código fuente principal de la aplicación React
    ├───App.css                     # Estilos globales y clases CSS de utilidad adicionales
    ├───App.jsx                     # Componente raíz. Inicializa contextos y carga componentes fijos diferidos
    ├───index.css                   # Hoja de estilo de entrada de Tailwind CSS y directivas básicas
    ├───main.jsx                    # Punto de entrada de renderizado de React en el DOM con StrictMode
    │
    ├───components\                 # Componentes visuales organizados por dominio
    │   ├───AppContent.jsx          # Conmutador principal de vistas: login o dashboard administrativo
    │   │
    │   ├───admin\                  # Panel de administración, monitoreo e interacciones grupales
    │   │   ├───ChatPanel.jsx       # Chat en vivo: mensajería privada, grupal, adjuntos y emojis (Socket.IO)
    │   │   ├───Dashboard.jsx       # Panel de control: coordina pestañas, paginación, filtros de usuarios
    │   │   ├───FilterBar.jsx       # Barra para filtrar listas de usuarios o historial (cédula, nombre, estado, fechas)
    │   │   ├───HistoryPanel.jsx    # Visualización detallada del historial de registros de asistencia y tiempos
    │   │   ├───NotificationsPanel.jsx # Panel para redactar y disparar notificaciones masivas o personalizadas
    │   │   ├───StatusGrid.jsx      # Panel interactivo en tiempo real que lista la situación/estado actual de todo el equipo
    │   │   ├───UserForm.jsx        # Formulario modal de creación y modificación de usuarios/permisos
    │   │   └───UserTable.jsx       # Tabla responsiva para mostrar, editar o suspender usuarios registrados
    │   │
    │   ├───ai\                     # Módulo de Inteligencia Artificial
    │   │   └───ClockerIA.jsx       # Interfaz flotante de chat arrastrable conectada al asistente IA
    │   │
    │   ├───auth\                   # Flujo de autenticación
    │   │   └───Login.jsx           # Formulario de inicio de sesión por cédula con retroalimentación animada
    │   │
    │   ├───call\                   # Infraestructura visual de WebRTC
    │   │   └───CallManager.jsx     # Ventana flotante interactiva para contestar, rechazar o silenciar llamadas
    │   │
    │   ├───common\                 # Componentes reutilizables estándar (Design System)
    │   │   ├───Badge.jsx           # Elemento indicador de etiquetas
    │   │   ├───Button.jsx          # Botón estándar con múltiples variantes (primary, secondary, danger)
    │   │   ├───Card.jsx            # Contenedor con bordes estilizados para estructurar información
    │   │   ├───Image.jsx           # Componente de imagen seguro con fallback de error
    │   │   ├───Input.jsx           # Campo de entrada controlado con etiquetas dinámicas
    │   │   ├───List.jsx            # Estructuras de lista consistentes
    │   │   ├───LoadingFallback.jsx # Animación de carga estándar para Suspense
    │   │   ├───MediaMessage.jsx    # Renderizador de archivos multimedia adjuntos en el chat (imagen/audio/documento)
    │   │   ├───MediaPreviewer.jsx  # Visor emergente para previsualizar imágenes a pantalla completa
    │   │   ├───Pagination.jsx      # Controladores de paginación para tablas e historial
    │   │   ├───Pin.jsx             # Indicador dinámico visual de estado
    │   │   ├───StatusBadge.jsx     # Etiqueta de estado del usuario con colores asociados
    │   │   └───Toast.jsx           # Notificación visual flotante temporal
    │   │
    │   ├───dashboard\              # Módulo de usuario final (Asistencia diaria)
    │   │   ├───CurrentStatus.jsx   # Visualización detallada del estado actual y temporizador del turno activo
    │   │   ├───StatusButtons.jsx   # Botonera reactiva para cambiar de estado de forma rápida
    │   │   └───StatusManager.jsx   # Contenedor lógico del flujo de marcación de tiempos del usuario logueado
    │   │
    │   ├───layout\                 # Estructura del Layout global
    │   │   ├───Header.jsx          # Barra de navegación superior con avatar de perfil, menú y campana de avisos
    │   │   ├───NotificationBell.jsx# Indicador visual e interactivo de notificaciones pendientes
    │   │   └───statusConfig.js     # Configuración y metadatos de los estados permitidos (colores, iconos, etiquetas)
    │   │
    │   └───profile\                # Módulo de perfil personal
    │       └───EditProfileModal.jsx# Formulario emergente para editar foto, contraseña, y datos personales
    │
    ├───contexts\                   # Gestores de estados globales (Context Providers)
    │   ├───AuthContext.jsx         # Gestión de login/logout, tokens JWT, socket por usuario, y permisos `can`
    │   ├───CallContext.jsx         # Orquestador WebRTC con Simple-Peer, gestión de streams locales, remotos y señalizaciones
    │   └───NotificationContext.jsx # Proveedor de alertas Toast, sonidos e integración de loaders globales
    │
    ├───hooks\                      # Hooks personalizados (Actualmente libre para expansión)
    │
    ├───services\                   # Conectores externos
    │   └───api.js                  # Servicio HTTP encapsulado (ApiService) para llamadas AJAX/fetch (POST, GET, PUT)
    │
    └───utils\                      # Utilidades y ayudantes independientes
        └───formatters.js           # Formateadores de fecha, hora, cronómetros y cadenas de texto
```

---

## 4. Flujos Clave de la Arquitectura

### A. Autenticación y Control de Permisos (`AuthContext.jsx`)
1.  La aplicación lee el almacenamiento local buscando `token` y `user` para restaurar la sesión automáticamente al iniciar.
2.  Si el token expira o el servidor responde con un estado `401 Unauthorized`, se gatilla un evento global `"unauthorized-access"`, el cual es escuchado por `AuthContext.jsx` para realizar un cierre de sesión seguro (`logout()`), limpiar el `localStorage` y forzar un refresco controlado de la página.
3.  La propiedad `can` verifica la existencia de permisos específicos. Ej.: `can("Manage Users")`. **Nunca** debe saltarse este mecanismo para ocultar o mostrar funciones en la interfaz.

### B. Inicialización y Túnel de Sockets (`AuthContext.jsx`)
1.  Al iniciar sesión con éxito, se ejecuta `initSocket(userId)`.
2.  El socket se conecta usando la URL `import.meta.env.VITE_SOCKET_URL` y se une de inmediato a una sala privada única para el usuario (`join_private`).
3.  Esta conexión socket (`socket.current`) se expone en todo el árbol de React a través del contexto de autenticación para que módulos como llamadas, chats y estados hagan uso de él sin necesidad de re-conectarse.

### C. Conectividad WebRTC (`CallContext.jsx` & `CallManager.jsx`)
1.  La señalización de WebRTC viaja en exclusiva a través del socket compartido.
2.  Los eventos críticos son:
    *   `incoming_call`: Dispara el sonido de llamada entrante en bucle y muestra la interfaz de llamada entrante. Si el usuario ya está ocupado, emite automáticamente `user_busy` al llamante.
    *   `call_accepted`: Detiene el audio de espera, levanta el componente `Simple-Peer` en modo iniciador, asocia el stream local de video/audio y se conecta de forma directa (P2P).
    *   `ice_candidate` & `call_ended`: Sincronizan la negociación de red e interrumpen limpiamente los streams liberando la cámara y el micrófono del navegador.

---

## 5. Directrices Estrictas de Desarrollo y No Alteración del Código

Para garantizar la estabilidad a largo plazo del código base, cualquier modificación debe respetar rigurosamente los siguientes lineamientos:

### 🚫 Prohibición de Refactorizaciones Masivas o Cambios "Por Gusto" (Cleanups No Solicitados)
*   **No Revertir ni Reescribir Estructuras Clave:** No modifiques componentes, funciones o flujos de trabajo que estén funcionando correctamente a menos que haya una instrucción directa del usuario o un error comprobado.
*   **Mantener el Diseño Visual de Tailwind v4:** No reemplaces las directivas de utilidad de Tailwind en los componentes. Cualquier cambio de diseño debe alinearse con la paleta de colores existente y el enfoque estético del sistema.
*   **Estilo y Convenciones de Código:** Adhiere firmemente a los estilos visuales del proyecto. Usa componentes estándar del diseño del sistema localizados en `src/components/common` (`Button`, `Input`, `Card`, `StatusBadge`, etc.) en lugar de crear marcas HTML nativas o implementar componentes de UI de terceros sin autorización previa.

### 📐 Skill de Arquitectura de Componentes (`clean-component-architecture`)
Todo ajuste, creación o refactorización de componentes debe guiarse por la skill `.agents/skills/clean-component-architecture/SKILL.md`:
1.  **Componentes Atómicos y Regla Anti-Monolito:** Mantener componentes concisos (< 150-200 líneas). Extraer subcomponentes o custom hooks si manejan múltiples responsabilidades.
2.  **Comentarios en Inglés y con Propósito:** Todos los comentarios deben ser en **inglés**. Cero comentarios obvios/ruidosos (`// handle click`, `// set state`). Documentar únicamente decisiones no evidentes, contratos de estado o peculiaridades técnicas.
3.  **Colores y Tokens Tailwind v4:** Usar exclusivamente tokens `@theme` (`vgsdarkblue`, `vgsred`, `vgsgray`, `vgswhite`, etc.). Prohibido hardcodear colores hexadecimales o RGB en estilos inline o clases ad-hoc.
4.  **Animaciones Centralizadas:** Usar utilidades de `@theme` (`animate-toast-in`, `animate-btn-pulse`, `hover-gradient`) o microinteracciones estándar de Tailwind. **Prohibido inyectar animaciones ad-hoc internas (`@keyframes` o loops JS) dentro de componentes**.
5.  **Cero Redundancia (DRY):** Reutilizar siempre utilidades existentes (`src/utils/formatters.js`, `src/components/layout/statusConfig.js`, `src/services/api.js`). No duplicar estados que puedan derivarse en tiempo de render.

### ⚠️ Manejo Seguro del Sistema de Tipos y Excepciones
*   **Prohibición de Hacks:** Nunca utilices atajos para eludir validaciones del navegador, ni uses casts de tipo innecesarios.
*   **Manejo de Respuestas HTTP:** Toda llamada al backend debe pasar a través de la instancia singleton de `api.js`. Las respuestas deben validar la propiedad `.success` y manejar los errores de manera elegante, notificando al usuario a través del `NotificationContext` (Toast / Alert) en lugar de silenciar excepciones en bloques `catch`.

### 🔄 Flujos Reactivos y Evitar Fugas de Memoria
*   **Limpieza de Listeners y Suscripciones (Socket.IO & WebRTC):** Al añadir oyentes de eventos a sockets o elementos del DOM en hooks de efectos (`useEffect`), es **obligatorio** retornar una función de limpieza para removerlos (`socket.off("evento")` / `removeEventListener`), previniendo así duplicación de acciones y fugas severas de memoria.
*   **Preservar Code Splitting (Lazy Loading):** Los paneles pesados dentro del Dashboard (`StatusManager`, `UserTable`, `HistoryPanel`, `ChatPanel`, etc.) y widgets persistentes (`CallManager`, `ClockerIA`) deben cargarse estrictamente con `lazy` y envolverse en `Suspense` con un fallback adecuado para evitar la sobrecarga del paquete bundle inicial.

### 🛠️ Flujo de Trabajo en Entorno de Desarrollo (HTTPS & SSL)
*   Debido al uso de características de seguridad del navegador para WebRTC (captura de cámara y micrófono), el entorno de desarrollo de Vite está configurado para ejecutarse bajo **HTTPS** utilizando los certificados autofirmados provistos en la raíz (`192.168.1.218+2.pem` y su llave). No modifiques las llaves del proyecto ni alteres la configuración HTTPS en `vite.config.js`.

---

## 6. Variables de Entorno Requeridas (`.env`)

Asegúrate de que las variables de entorno estén siempre configuradas y declaradas adecuadamente dentro del archivo `.env`:

```env
VITE_API_URL=https://api.tu-servidor-clocker.com/api
VITE_SOCKET_URL=https://api.tu-servidor-clocker.com
```

*   **VITE_API_URL:** Punto de entrada para el consumo de servicios REST.
*   **VITE_SOCKET_URL:** Dirección de conexión para la instancia en tiempo real de Socket.IO.

---
*Este documento es de lectura prioritaria. Ante cualquier conflicto entre instrucciones generales de la sesión y las directrices marcadas en este archivo, las reglas aquí descritas prevalecerán con total autoridad.*
