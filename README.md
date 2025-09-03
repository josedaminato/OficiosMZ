# Oficios MZ - Plataforma de Trabajadores

Una plataforma web para conectar trabajadores con clientes en Mendoza, Argentina.

## 🚀 Características

- **Autenticación completa** con Supabase Auth
- **Registro de trabajadores** con captura de fotos y documentos
- **Dashboard para trabajadores** y clientes
- **Sistema de routing** con React Router
- **Componentes UI reutilizables**
- **Subida de archivos** a Supabase Storage
- **Notificaciones** con react-toastify

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx          # Formulario de login
│   │   └── ProtectedRoute.jsx     # Componente para rutas protegidas
│   ├── Dashboard/
│   │   ├── WorkerDashboard.jsx    # Dashboard del trabajador
│   │   └── ClientDashboard.jsx    # Dashboard del cliente
│   ├── ui/                        # Componentes UI reutilizables
│   │   ├── index.js               # Exportaciones de componentes
│   │   ├── TextInput.jsx          # Campo de texto
│   │   ├── FileUpload.jsx         # Subida de archivos
│   │   ├── CameraCapture.jsx      # Captura de cámara
│   │   ├── Select.jsx             # Campo select
│   │   └── LoadingSpinner.jsx     # Spinner de carga
│   └── RegisterWorkerForm.jsx     # Formulario de registro
├── hooks/
│   └── useSupabase.js             # Hooks para Supabase y autenticación
├── utils/
│   ├── uploadFile.js              # Utilidades para subida de archivos
│   └── mendozaDepartments.ts      # Datos de departamentos
├── supabaseClient.js              # Configuración de Supabase
└── App.jsx                        # Componente principal con routing
```

## 🛠️ Tecnologías Utilizadas

- **React 18** - Framework de UI
- **React Router DOM** - Enrutamiento
- **Supabase** - Backend como servicio (Auth, Database, Storage)
- **Tailwind CSS** - Framework de estilos
- **React Toastify** - Notificaciones
- **date-fns** - Manipulación de fechas

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd oficios_mz
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### 4. Ejecutar el proyecto
```bash
npm run dev
```

## 🗂️ Sistema de Routing

La aplicación utiliza React Router DOM con las siguientes rutas:

### Rutas Públicas
- `/login` - Formulario de inicio de sesión
- `/register` - Formulario de registro de trabajadores

### Rutas Protegidas
- `/dashboard` - Dashboard del trabajador (requiere autenticación)
- `/client-dashboard` - Dashboard del cliente (requiere autenticación)

### Redirecciones
- `/` - Redirige a `/login`
- `/*` - Redirige a `/login` (rutas no encontradas)

## 🔐 Autenticación

El sistema de autenticación está implementado usando Supabase Auth con un contexto de React:

### AuthProvider
Envuelve toda la aplicación y proporciona:
- Estado del usuario autenticado
- Funciones de login/logout
- Funciones de registro
- Restablecimiento de contraseña

### useAuth Hook
```javascript
const { user, loading, signIn, signOut, signUp } = useAuth();
```

### ProtectedRoute
Componente que protege rutas que requieren autenticación:
```javascript
<ProtectedRoute>
  <ComponenteProtegido />
</ProtectedRoute>
```

## 🎨 Componentes UI

### TextInput
Campo de texto reutilizable con validación y manejo de errores.

```javascript
<TextInput
  label="Email"
  name="email"
  type="email"
  value={email}
  onChange={handleChange}
  required={true}
  error={errors.email}
/>
```

### FileUpload
Componente para subida de archivos con drag & drop.

```javascript
<FileUpload
  label="Foto de perfil"
  accept="image/*"
  onChange={handleFileChange}
  required={true}
  error={errors.file}
/>
```

### CameraCapture
Componente para captura de fotos con la cámara del dispositivo.

```javascript
<CameraCapture
  label="Captura en vivo"
  onCapture={handleCapture}
  disabled={loading}
/>
```

### Select
Campo select con opciones personalizables.

```javascript
<Select
  label="Oficio"
  value={oficio}
  onChange={handleChange}
  options={oficioOptions}
  required={true}
/>
```

### LoadingSpinner
Spinner de carga con diferentes tamaños y colores.

```javascript
<LoadingSpinner 
  size="md" 
  color="blue" 
  text="Cargando..." 
/>
```

## 📤 Subida de Archivos

El sistema utiliza Supabase Storage para la subida de archivos:

### Función uploadFile
```javascript
import { uploadFile } from '../utils/uploadFile';

const url = await uploadFile('avatars', file, 'path/to/file.jpg');
```

### Buckets Configurados
- `avatars` - Fotos de perfil y capturas en vivo
- `documents` - Documentos DNI y otros archivos

## 🎯 Funcionalidades Principales

### Registro de Trabajadores
- Formulario completo con validación
- Subida de foto de perfil
- Captura en vivo con cámara
- Subida de documentos DNI (opcional)
- Información de oficio y especialidades
- Zonas de trabajo

### Dashboard del Trabajador
- Vista general de solicitudes activas
- Ingresos del mes
- Calificación promedio
- Acciones rápidas
- Navegación y logout

### Dashboard del Cliente
- Gestión de solicitudes
- Historial de gastos
- Trabajos completados
- Búsqueda de trabajadores
- Acciones rápidas

## 🔧 Desarrollo

### Estructura de Componentes
Los componentes siguen un patrón consistente:
- Props tipadas y documentadas
- Manejo de estados de carga
- Validación de errores
- Estilos con Tailwind CSS

### Hooks Personalizados
- `useAuth` - Gestión de autenticación
- `useSupabase` - Operaciones generales de Supabase

### Manejo de Errores
- Toast notifications para errores
- Validación de formularios
- Manejo de errores de red
- Estados de carga apropiados

## 🚀 Despliegue

### Build de Producción
```bash
npm run build
```

### Variables de Entorno de Producción
Asegúrate de configurar las variables de entorno correctas para producción.

## 📝 Notas de Desarrollo

- El proyecto utiliza Vite como bundler
- Tailwind CSS está configurado para purging automático
- Los componentes están optimizados para reutilización
- El sistema de routing está configurado para SPA
- La autenticación persiste entre sesiones

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles. 