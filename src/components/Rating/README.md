# 🏆 Sistema de Calificaciones - Oficios MZ

## 📋 Descripción

Sistema completo de calificaciones para la plataforma Oficios MZ, que permite a usuarios calificar y ser calificados después de completar trabajos. Incluye componentes React reutilizables, hooks personalizados y integración con backend FastAPI y Supabase.

## 🚀 Características

- ✅ **Calificaciones de 1 a 5 estrellas** con comentarios opcionales
- ✅ **Validaciones completas** de reglas de negocio
- ✅ **Componentes React reutilizables** y modulares
- ✅ **Hooks personalizados** para lógica de estado
- ✅ **Integración con Supabase** para tiempo real
- ✅ **Design System consistente** con Tailwind CSS
- ✅ **Accesibilidad** y buenas prácticas UX
- ✅ **Responsive design** para móvil y desktop

## 📁 Estructura de Archivos

```
src/components/Rating/
├── RatingForm.jsx          # Formulario para crear calificaciones
├── RatingSummary.jsx       # Resumen y estadísticas de calificaciones
├── RatingList.jsx          # Lista de calificaciones recibidas
├── RatingSystem.jsx        # Componente principal del sistema
├── index.js               # Exportaciones del módulo
├── examples.jsx           # Ejemplos de uso
└── README.md             # Esta documentación

src/hooks/
└── useRatings.jsx         # Hook personalizado para ratings
```

## 🎯 Componentes Principales

### `<RatingForm />`

Formulario para crear una nueva calificación.

**Props:**
- `jobId` (string): ID del trabajo a calificar
- `ratedUserId` (string): ID del usuario que será calificado
- `onSubmit` (function): Callback cuando se envía la calificación
- `onCancel` (function): Callback para cancelar
- `isLoading` (boolean): Estado de carga

**Ejemplo:**
```jsx
<RatingForm
  jobId=\"job-123\"
  ratedUserId=\"user-456\"
  onSubmit={handleRatingSubmit}
  onCancel={() => setShowForm(false)}
  isLoading={loading}
/>
```

### `<RatingSummary />`

Muestra el resumen de calificaciones de un usuario.

**Props:**
- `averageScore` (number): Promedio de calificaciones
- `totalRatings` (number): Total de calificaciones recibidas
- `size` (string): Tamaño del componente ('small', 'medium', 'large')
- `showDetails` (boolean): Mostrar detalles adicionales
- `className` (string): Clases CSS adicionales

**Ejemplo:**
```jsx
<RatingSummary
  averageScore={4.5}
  totalRatings={23}
  size=\"medium\"
  showDetails={true}
/>
```

### `<RatingList />`

Lista paginada de calificaciones recibidas.

**Props:**
- `userId` (string): ID del usuario cuyas calificaciones mostrar
- `limit` (number): Cantidad de calificaciones por página
- `showPagination` (boolean): Mostrar controles de paginación
- `className` (string): Clases CSS adicionales

**Ejemplo:**
```jsx
<RatingList
  userId=\"user-123\"
  limit={5}
  showPagination={true}
/>
```

### `<RatingSystem />`

Componente principal que integra todo el sistema.

**Props:**
- `mode` (string): Modo de operación ('view', 'rate', 'manage')
- `userId` (string): ID del usuario
- `jobId` (string): ID del trabajo (requerido para modo 'rate')
- `ratedUserId` (string): ID del usuario a calificar
- `showStats` (boolean): Mostrar estadísticas
- `showList` (boolean): Mostrar lista de calificaciones
- `className` (string): Clases CSS adicionales

**Ejemplo:**
```jsx
<RatingSystem
  mode=\"view\"
  userId=\"user-123\"
  showStats={true}
  showList={true}
/>
```

## 🎣 Hooks Personalizados

### `useRatings()`

Hook principal para operaciones de calificaciones.

**Métodos:**
- `createRating(ratingData)`: Crear nueva calificación
- `getUserRatings(userId, page, limit)`: Obtener calificaciones de usuario
- `getUserRatingAverage(userId)`: Obtener promedio de calificaciones
- `canRateJob(jobId)`: Verificar si se puede calificar un trabajo
- `clearError()`: Limpiar errores

**Estados:**
- `loading`: Estado de carga
- `error`: Mensaje de error

**Ejemplo:**
```jsx
const { createRating, loading, error } = useRatings();

const handleSubmit = async (ratingData) => {
  try {
    await createRating(ratingData);
    alert('Calificación enviada!');
  } catch (err) {
    console.error('Error:', err);
  }
};
```

### `useUserRatings(userId)`

Hook para obtener y gestionar calificaciones en tiempo real.

**Estados:**
- `ratings`: Array de calificaciones
- `averageScore`: Promedio de calificaciones
- `totalRatings`: Total de calificaciones
- `loading`: Estado de carga
- `error`: Mensaje de error

**Ejemplo:**
```jsx
const { ratings, averageScore, totalRatings, loading } = useUserRatings('user-123');

if (loading) return <div>Cargando...</div>;

return (
  <div>
    <h3>Promedio: {averageScore.toFixed(1)}</h3>
    <p>Total: {totalRatings} calificaciones</p>
  </div>
);
```

## 🔧 Configuración

### 1. Instalar dependencias

```bash
npm install date-fns
```

### 2. Configurar variables de entorno

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Configurar backend

Asegúrate de que el backend FastAPI esté corriendo con los endpoints de ratings.

### 4. Configurar Supabase

Ejecuta las migraciones SQL para crear las tablas necesarias:

```sql
-- Ver backend/docs/ratings_database.sql
```

## 📖 Ejemplos de Uso

### Calificar después de un trabajo completado

```jsx
import { RatingSystem } from './components/Rating';

function JobCompletion({ jobId, workerId, clientId, currentUserId }) {
  const ratedUserId = currentUserId === clientId ? workerId : clientId;
  
  return (
    <RatingSystem
      mode=\"rate\"
      userId={ratedUserId}
      jobId={jobId}
      ratedUserId={ratedUserId}
      showStats={false}
      showList={false}
    />
  );
}
```

### Mostrar calificaciones en perfil de trabajador

```jsx
import { RatingSystem } from './components/Rating';

function WorkerProfile({ workerId }) {
  return (
    <RatingSystem
      mode=\"view\"
      userId={workerId}
      showStats={true}
      showList={true}
    />
  );
}
```

### Badge compacto de calificaciones

```jsx
import { WorkerRatingBadge } from './components/Rating';

function WorkerCard({ worker }) {
  return (
    <div className=\"worker-card\">
      <h3>{worker.name}</h3>
      <WorkerRatingBadge 
        workerId={worker.id} 
        onClick={() => openProfile(worker.id)}
      />
    </div>
  );
}
```

## 🎨 Personalización

### Temas y estilos

Los componentes usan Tailwind CSS. Puedes personalizar los estilos modificando las clases:

```jsx
<RatingSystem
  className=\"custom-rating-system\"
  // ... otros props
/>
```

### Configuración de colores

```css
/* En tu CSS personalizado */
.rating-excellent { @apply text-green-600; }
.rating-good { @apply text-yellow-600; }
.rating-poor { @apply text-red-600; }
```

## 🔒 Validaciones y Seguridad

### Reglas de negocio implementadas:

1. ✅ Solo usuarios autenticados pueden calificar
2. ✅ Solo se puede calificar trabajos completados
3. ✅ Solo participantes del trabajo pueden calificar
4. ✅ Una calificación por trabajo por usuario
5. ✅ Score debe estar entre 1 y 5
6. ✅ Validación de tokens JWT

### Validaciones frontend:

- Campo de score obligatorio (1-5)
- Límite de caracteres en comentarios (500)
- Prevención de envíos duplicados
- Manejo de errores de red

## 🚀 Performance

### Optimizaciones implementadas:

- ✅ **Lazy loading** de componentes
- ✅ **Memoización** con React.memo
- ✅ **Debounce** en búsquedas
- ✅ **Paginación** en listas largas
- ✅ **Carga progresiva** de datos
- ✅ **Caché** de calificaciones

### Real-time con Supabase:

```jsx
// Los componentes se actualizan automáticamente
// cuando hay nuevas calificaciones
const { ratings, averageScore } = useUserRatings(userId);
```

## 🧪 Testing

### Tests incluidos:

```bash
# Ejecutar tests del sistema de ratings
npm test src/components/Rating
npm test src/hooks/useRatings
```

### Tests de integración:

```bash
# Test completo del flujo de calificaciones
npm test -- --testPathPattern=ratings-integration
```

## 🐛 Troubleshooting

### Errores comunes:

**Error: \"Usuario no autenticado\"**
- Verificar que el usuario esté logueado
- Comprobar token JWT válido

**Error: \"Ya has calificado este trabajo\"**
- Normal, cada usuario solo puede calificar una vez por trabajo

**Error: \"Trabajo no completado\"**
- Solo se pueden calificar trabajos con status 'completado'

**Error de red al cargar calificaciones**
- Verificar conexión al backend
- Comprobar endpoints de la API

## 📚 API Reference

### Endpoints utilizados:

```
POST /api/ratings/                    # Crear calificación
GET  /api/ratings/user/{user_id}      # Obtener calificaciones de usuario
GET  /api/ratings/user/{user_id}/average  # Obtener promedio de usuario
GET  /api/ratings/health              # Health check
```

## 🤝 Contribuir

Para contribuir al sistema de calificaciones:

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
- ✅ Integración con FastAPI y Supabase
- ✅ Tests y documentación

---

**Oficios MZ** - Sistema de Calificaciones  
Desarrollado con ❤️ en Mendoza, Argentina




