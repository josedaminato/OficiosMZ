# Configuración de Supabase

## Variables de Entorno

El cliente de Supabase ahora utiliza variables de entorno para mayor seguridad y flexibilidad.

### Variables Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Cómo obtener las credenciales

1. **Ve a tu proyecto de Supabase**: https://supabase.com/dashboard
2. **Selecciona tu proyecto**
3. **Ve a Settings > API**
4. **Copia los valores**:
   - **Project URL**: `VITE_SUPABASE_URL`
   - **anon public**: `VITE_SUPABASE_ANON_KEY`

## Configuración del Cliente

El cliente de Supabase está configurado con las siguientes optimizaciones:

### Autenticación
- `autoRefreshToken: true` - Renueva tokens automáticamente
- `persistSession: true` - Mantiene la sesión entre recargas
- `detectSessionInUrl: true` - Detecta tokens en la URL

### Realtime
- `eventsPerSecond: 10` - Límite de eventos por segundo

## Validaciones Implementadas

### Variables de Entorno
- Verifica que `VITE_SUPABASE_URL` esté definida
- Verifica que `VITE_SUPABASE_ANON_KEY` esté definida
- Valida el formato de la URL de Supabase

### Conexión
- Función `checkSupabaseConnection()` para verificar conectividad
- Manejo de errores mejorado
- Logs de debugging en modo desarrollo

## Uso en el Código

```javascript
import { supabase, checkSupabaseConnection } from './supabaseClient';

// Verificar conexión
const isConnected = await checkSupabaseConnection();

// Usar el cliente
const { data, error } = await supabase
  .from('profiles')
  .select('*');
```

## Seguridad

### ✅ Buenas Prácticas
- Variables de entorno para credenciales
- Validación de configuración al inicio
- Clave anónima pública (no la service_role key)
- Logs solo en modo desarrollo

### ⚠️ Importante
- **Nunca** commits el archivo `.env` con credenciales reales
- Usa `.env.example` como plantilla
- En producción, configura las variables en tu plataforma de hosting

## Troubleshooting

### Error: "VITE_SUPABASE_URL no está definida"
- Verifica que el archivo `.env` existe
- Asegúrate de que las variables empiecen con `VITE_`
- Reinicia el servidor de desarrollo

### Error de conexión
- Verifica que la URL y clave sean correctas
- Usa `checkSupabaseConnection()` para diagnosticar
- Revisa la consola del navegador para errores detallados 