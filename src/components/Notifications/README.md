# 🔔 Sistema de Notificaciones - Oficios MZ

## 📋 Descripción

Sistema completo de notificaciones en tiempo real para la plataforma Oficios MZ. Incluye componentes React reutilizables, hooks personalizados, integración con Supabase Realtime y notificaciones automáticas para eventos del sistema.

## 🚀 Características

- ✅ **Notificaciones en tiempo real** con Supabase Realtime
- ✅ **Campana de notificaciones** con contador de no leídas
- ✅ **Dropdown interactivo** con lista de notificaciones
- ✅ **Múltiples tipos de notificación** (rating, payment, system, chat, etc.)
- ✅ **Notificaciones automáticas** para eventos del sistema
- ✅ **Componentes React reutilizables** y modulares
- ✅ **Hooks personalizados** para lógica de estado
- ✅ **Design System consistente** con Tailwind CSS
- ✅ **Responsive design** para móvil y desktop
- ✅ **Tests completos** unitarios e integración

## 📁 Estructura de Archivos

```
src/components/Notifications/
├── NotificationBell.jsx          # Campana de notificaciones con dropdown
├── NotificationItem.jsx          # Componente individual de notificación
├── NotificationList.jsx          # Lista completa de notificaciones
├── NotificationSystem.jsx        # Sistema principal de notificaciones
├── index.js                     # Exportaciones del módulo
├── examples.jsx                 # Ejemplos de uso
└── README.md                   # Esta documentación

src/hooks/
└── useNotifications.jsx         # Hook personalizado para notificaciones

backend/
├── routers/notifications.py     # Endpoints de notificaciones
├── services/notification_service.py  # Servicio de notificaciones automáticas
└── docs/notifications_database.sql   # Estructura de base de datos
```

## 🎯 Componentes Principales

### `<NotificationBell />`

Campana de notificaciones con dropdown interactivo.

**Props:**
- `userId` (string): ID del usuario
- `className` (string): Clases CSS adicionales
- `showUnreadCount` (boolean): Mostrar contador de no leídas
- `maxNotifications` (number): Máximo de notificaciones en dropdown
- `onNotificationClick` (function): Callback al hacer click en notificación

**Ejemplo:**
```jsx
<NotificationBell
  userId="user-123"
  onNotificationClick={(notification) => {
    console.log('Notification clicked:', notification);
  }}
/>
```

### `<NotificationItem />`

Componente para mostrar una notificación individual.

**Props:**
- `notification` (object): Objeto de notificación
- `onClick` (function): Callback al hacer click
- `className` (string): Clases CSS adicionales
- `showTimestamp` (boolean): Mostrar timestamp
- `showTypeIcon` (boolean): Mostrar ícono del tipo

**Ejemplo:**
```jsx
<NotificationItem
  notification={notification}
  onClick={() => markAsRead(notification.id)}
  showTimestamp={true}
  showTypeIcon={true}
/>
```

### `<NotificationList />`

Lista completa de notificaciones con paginación.

**Props:**
- `userId` (string): ID del usuario
- `showPagination` (boolean): Mostrar controles de paginación
- `itemsPerPage` (number): Elementos por página
- `showMarkAllRead` (boolean): Mostrar botón "marcar todas como leídas"
- `onNotificationClick` (function): Callback al hacer click

**Ejemplo:**
```jsx
<NotificationList
  userId="user-123"
  showPagination={true}
  itemsPerPage={10}
  onNotificationClick={handleNotificationClick}
/>
```

### `<NotificationSystem />`

Sistema principal que integra todos los componentes.

**Props:**
- `userId` (string): ID del usuario
- `mode` (string): Modo de operación ('bell', 'list', 'dashboard')
- `className` (string): Clases CSS adicionales
- `onNotificationClick` (function): Callback al hacer click

**Ejemplo:**
```jsx
<NotificationSystem
  userId="user-123"
  mode="dashboard"
  onNotificationClick={handleNotificationClick}
/>
```

## 🎣 Hooks Personalizados

### `useNotifications(userId)`

Hook principal para manejar notificaciones en tiempo real.

**Estados:**
- `notifications`: Array de notificaciones
- `unreadCount`: Contador de notificaciones no leídas
- `loading`: Estado de carga
- `error`: Mensaje de error

**Métodos:**
- `loadNotifications(page, limit, unreadOnly)`: Cargar notificaciones
- `markAsRead(notificationId)`: Marcar como leída
- `markAllAsRead()`: Marcar todas como leídas
- `createNotification(notificationData)`: Crear notificación
- `clearError()`: Limpiar errores

**Ejemplo:**
```jsx
const { 
  notifications, 
  unreadCount, 
  loading, 
  markAsRead 
} = useNotifications('user-123');

if (loading) return <div>Cargando...</div>;

return (
  <div>
    <h3>Notificaciones ({unreadCount} sin leer)</h3>
    {notifications.map(notification => (
      <NotificationItem
        key={notification.id}
        notification={notification}
        onClick={() => markAsRead(notification.id)}
      />
    ))}
  </div>
);
```

### `useNotificationStats(userId)`

Hook para obtener estadísticas de notificaciones.

**Estados:**
- `stats`: Estadísticas (total, no leídas, última fecha)
- `loading`: Estado de carga
- `error`: Mensaje de error

**Métodos:**
- `refetch()`: Recargar estadísticas

**Ejemplo:**
```jsx
const { stats, loading } = useNotificationStats('user-123');

if (loading) return <div>Cargando estadísticas...</div>;

return (
  <div>
    <p>Total: {stats.total_notifications}</p>
    <p>No leídas: {stats.unread_notifications}</p>
  </div>
);
```

## 🔧 Configuración

### 1. Instalar dependencias

```bash
npm install lucide-react date-fns
```

### 2. Configurar variables de entorno

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Configurar base de datos

Ejecuta el script SQL en Supabase:

```sql
-- Ver backend/docs/notifications_database.sql
```

### 4. Habilitar Realtime

En el dashboard de Supabase:
1. Ve a Database > Replication
2. Habilita la replicación para la tabla `notifications`

### 5. Configurar backend

Asegúrate de que el backend FastAPI esté corriendo con los endpoints de notificaciones.

## 📖 Ejemplos de Uso

### Integración en Header

```jsx
import { NotificationHeader } from './components/Notifications';

function Header({ userId }) {
  return (
    <header className="bg-white shadow-sm px-6 py-4">
      <div className="flex items-center justify-between">
        <h1>Oficios MZ</h1>
        <NotificationHeader userId={userId} />
      </div>
    </header>
  );
}
```

### Página de Notificaciones

```jsx
import { NotificationPage } from './components/Notifications';

function NotificationsPage({ userId }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationPage userId={userId} />
    </div>
  );
}
```

### Dashboard con Notificaciones

```jsx
import { NotificationSystem } from './components/Notifications';

function Dashboard({ userId }) {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <NotificationSystem
        userId={userId}
        mode="dashboard"
      />
    </div>
  );
}
```

### Sidebar de Notificaciones

```jsx
import { NotificationSidebar } from './components/Notifications';

function App({ userId }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setSidebarOpen(true)}>
        Ver Notificaciones
      </button>
      
      <NotificationSidebar
        userId={userId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
```

## 🔄 Notificaciones Automáticas

El sistema incluye notificaciones automáticas para:

### Calificaciones
- Cuando se recibe una nueva calificación
- Mensaje personalizado según la puntuación
- Incluye información del evaluador y trabajo

### Pagos
- Cuando se libera un pago
- Incluye monto y detalles del trabajo
- Notificación al trabajador

### Trabajos
- Nueva solicitud de trabajo
- Trabajo aceptado
- Trabajo completado
- Trabajo cancelado

### Sistema
- Mensajes del sistema
- Actualizaciones importantes
- Mantenimiento programado

### Chat
- Nuevos mensajes
- Mensajes no leídos
- Notificaciones de chat grupal

## 🎨 Personalización

### Temas y estilos

Los componentes usan Tailwind CSS. Puedes personalizar los estilos:

```jsx
<NotificationBell
  className="custom-notification-bell"
  // ... otros props
/>
```

### Configuración de colores

```css
/* En tu CSS personalizado */
.notification-rating { @apply text-yellow-600; }
.notification-payment { @apply text-green-600; }
.notification-system { @apply text-blue-600; }
.notification-chat { @apply text-purple-600; }
```

### Íconos personalizados

```jsx
// Personalizar íconos por tipo
const customIcons = {
  rating: <Star className="w-4 h-4 text-yellow-500" />,
  payment: <CreditCard className="w-4 h-4 text-green-500" />,
  system: <Settings className="w-4 h-4 text-blue-500" />,
  chat: <MessageSquare className="w-4 h-4 text-purple-500" />
};
```

## 🔒 Seguridad

### Validaciones implementadas:

1. ✅ Solo usuarios autenticados pueden acceder a sus notificaciones
2. ✅ Validación JWT en cada request
3. ✅ Row Level Security (RLS) en Supabase
4. ✅ Validación de permisos por usuario
5. ✅ Sanitización de datos de entrada
6. ✅ Rate limiting en endpoints

### Políticas de seguridad:

- Los usuarios solo pueden ver sus propias notificaciones
- Solo el sistema puede crear notificaciones
- Validación de tokens JWT en cada request
- Protección contra inyección SQL

## 🚀 Performance

### Optimizaciones implementadas:

- ✅ **Lazy loading** de notificaciones
- ✅ **Paginación** para listas largas
- ✅ **Caché** de notificaciones en memoria
- ✅ **Debounce** en búsquedas
- ✅ **Memoización** con React.memo
- ✅ **Índices de base de datos** optimizados

### Real-time optimizado:

- Conexiones WebSocket eficientes
- Reconexión automática
- Manejo de desconexiones
- Throttling de actualizaciones

## 🧪 Testing

### Tests incluidos:

```bash
# Tests del backend
pytest backend/tests/test_notifications.py

# Tests del frontend
npm test src/components/Notifications
npm test src/hooks/useNotifications
```

### Tests de integración:

```bash
# Test completo del flujo de notificaciones
npm test -- --testPathPattern=notifications-integration
```

## 🐛 Troubleshooting

### Errores comunes:

**Error: "Usuario no autenticado"**
- Verificar que el usuario esté logueado
- Comprobar token JWT válido

**Error: "No se pueden cargar notificaciones"**
- Verificar conexión a Supabase
- Comprobar configuración de Realtime

**Error: "Notificaciones no aparecen en tiempo real"**
- Verificar que Realtime esté habilitado
- Comprobar suscripción a cambios

**Error de permisos en Supabase**
- Verificar políticas RLS
- Comprobar service role key

## 📚 API Reference

### Endpoints del backend:

```
POST /api/notifications/                    # Crear notificación
GET  /api/notifications/user/{user_id}      # Obtener notificaciones
PATCH /api/notifications/{id}/read          # Marcar como leída
PATCH /api/notifications/user/{id}/read-all # Marcar todas como leídas
GET  /api/notifications/user/{id}/stats     # Obtener estadísticas
GET  /api/notifications/health              # Health check
```

### Tipos de notificación:

- `rating`: Calificaciones recibidas
- `payment`: Pagos recibidos
- `system`: Mensajes del sistema
- `chat`: Mensajes de chat
- `job_request`: Solicitudes de trabajo
- `job_accepted`: Trabajo aceptado
- `job_completed`: Trabajo completado
- `job_cancelled`: Trabajo cancelado

## 🤝 Contribuir

Para contribuir al sistema de notificaciones:

1. Fork el repositorio
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Hacer commits: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📝 Changelog

### v1.0.0 (2024-01-15)
- ✅ Implementación inicial del sistema
- ✅ Componentes React completos
- ✅ Hooks personalizados
- ✅ Integración con Supabase Realtime
- ✅ Notificaciones automáticas
- ✅ Tests y documentación

---

**Oficios MZ** - Sistema de Notificaciones  
Desarrollado con ❤️ en Mendoza, Argentina




