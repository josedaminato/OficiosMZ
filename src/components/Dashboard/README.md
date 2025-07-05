# Dashboard del Trabajador - Refactorización

## Cambios Implementados

### 🔄 **Reemplazo de Datos Mock por Supabase**

**Antes:**
```javascript
const mockRequests = [
  {
    request_id: 'REQ123',
    cliente: 'María Cliente',
    oficio: 'Albañil',
    estado: 'En curso',
  }
];
```

**Después:**
- **Hook personalizado**: `useWorkerRequests` para manejar datos reales
- **Consulta a Supabase**: Filtrado por ID del trabajador
- **Tiempo real**: Suscripción a cambios en la base de datos
- **Estados de carga**: Loading, error y empty states

### 🧩 **Componente RequestCard Separado**

**Nuevo componente**: `RequestCard.jsx`

**Características:**
- **Diseño moderno**: Cards con información detallada
- **Estados visuales**: Colores e iconos por estado
- **Acciones integradas**: Aceptar, rechazar, ver detalles
- **Información completa**: Cliente, fecha, presupuesto, ubicación
- **Responsive**: Adaptable a diferentes tamaños de pantalla

**Props:**
```javascript
<RequestCard
  request={requestData}
  onViewDetails={handleViewDetails}
  onAccept={handleAccept}
  onReject={handleReject}
  loading={actionLoading}
/>
```

### 📊 **Estadísticas y Filtros**

**Estadísticas rápidas:**
- Total de solicitudes
- Pendientes
- En curso
- Completadas
- Canceladas/Rechazadas

**Filtros de estado:**
- Todas
- Pendientes
- En curso
- Completadas

**Vistas:**
- Grid (cuadrícula)
- List (lista)

### 🔧 **Hook Personalizado: useWorkerRequests**

**Funcionalidades:**
- **Carga de datos**: Consulta a Supabase con joins
- **Filtrado**: Por estado y trabajador
- **Acciones**: Aceptar, rechazar, completar, cancelar
- **Tiempo real**: Suscripción a cambios
- **Estadísticas**: Cálculo automático de métricas
- **Manejo de errores**: Toast notifications

**Uso:**
```javascript
const {
  requests,
  loading,
  error,
  stats,
  acceptRequest,
  rejectRequest,
  // ... más funciones
} = useWorkerRequests(workerId, statusFilter);
```

### 🎨 **Mejoras de UX/UI**

**Estados de carga:**
- Spinner con texto descriptivo
- Estados de error con opción de reintentar
- Estado vacío con mensajes contextuales

**Notificaciones:**
- Toast notifications para acciones
- Mensajes de éxito y error
- Posicionamiento personalizado

**Diseño responsivo:**
- Grid adaptativo
- Controles móviles
- Espaciado consistente

## Estructura de Archivos

```
src/
├── components/
│   └── Dashboard/
│       ├── WorkerDashboard.tsx    # Dashboard principal (refactorizado)
│       ├── RequestCard.jsx        # Componente de tarjeta (nuevo)
│       └── README.md             # Esta documentación
├── hooks/
│   └── useWorkerRequests.js      # Hook personalizado (nuevo)
└── utils/
    └── uploadFile.js             # Utilidades de archivos
```

## Esquema de Base de Datos

**Tabla `requests`:**
```sql
CREATE TABLE requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id),
  worker_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  budget DECIMAL(10,2),
  location TEXT,
  urgency TEXT,
  status TEXT DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  cancellation_reason TEXT
);
```

**Tabla `profiles`:**
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Funcionalidades Implementadas

### ✅ **Carga de Datos**
- Consulta real a Supabase
- Filtrado por trabajador
- Joins con tabla de perfiles
- Ordenamiento por fecha

### ✅ **Gestión de Estados**
- Aceptar solicitudes
- Rechazar solicitudes
- Completar trabajos
- Cancelar solicitudes

### ✅ **Tiempo Real**
- Suscripción a cambios
- Actualización automática
- Notificaciones en tiempo real

### ✅ **Filtros y Vistas**
- Filtros por estado
- Vista de cuadrícula/lista
- Búsqueda y ordenamiento

### ✅ **Estadísticas**
- Métricas en tiempo real
- Contadores por estado
- Dashboard analítico

## Próximos Pasos

1. **Implementar búsqueda** por texto
2. **Agregar paginación** para grandes volúmenes
3. **Filtros avanzados** por fecha, presupuesto
4. **Exportar datos** a PDF/Excel
5. **Notificaciones push** para nuevas solicitudes

## Dependencias

- `react-toastify`: Notificaciones
- `date-fns`: Formateo de fechas
- `@supabase/supabase-js`: Cliente de base de datos 