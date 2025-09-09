# 🔄 **PLAN DE REFACTORIZACIÓN SEGURA - OFICIOS MZ**

**Objetivo:** Refactorización incremental y segura sin romper funcionalidades  
**Estado actual:** MVP funcional con 15,000+ líneas de código  
**Cobertura de tests:** 80% (protección garantizada)  

---

## 📊 **ANÁLISIS DE DUPLICACIONES DETECTADAS**

### **🔴 PRIORIDAD CRÍTICA - Duplicaciones Críticas**

#### **1. Validación JWT Duplicada (Backend)**
**Problema:** 3 implementaciones diferentes de `get_current_user`
- `notifications.py` - Implementación completa con Supabase JWKS
- `disputes.py` - Implementación básica con import de main.py
- `payments.py` - Implementación básica con import de main.py
- `ratings.py` - Implementación básica con import de main.py

**Impacto:** Inconsistencia de seguridad, mantenimiento complejo
**Solución:** Centralizar en `backend/services/auth_service.py`

#### **2. Patrones de Hooks Repetidos (Frontend)**
**Problema:** Patrones similares en múltiples hooks
- `useNotifications`, `useRatings`, `useDisputes`, `usePayments`
- Mismo patrón: loading, error, API calls, JWT handling
- Lógica de autenticación duplicada

**Impacto:** ~200 líneas de código duplicado
**Solución:** Crear `useApi` hook base

#### **3. Validaciones de Formulario Duplicadas**
**Problema:** Lógica de validación repetida en componentes
- `RegisterWorkerForm.jsx` - 40 líneas de validación
- `PaymentForm.jsx` - 20 líneas de validación
- Patrones similares en otros formularios

**Impacto:** Mantenimiento complejo, inconsistencias
**Solución:** Crear `useFormValidation` hook

### **🟡 PRIORIDAD ALTA - Duplicaciones Importantes**

#### **4. Consultas Supabase Repetidas**
**Problema:** Patrones de consulta similares
- Joins con `profiles` en múltiples hooks
- Manejo de errores idéntico
- Transformación de datos repetida

**Impacto:** ~150 líneas de código duplicado
**Solución:** Crear `useSupabaseQuery` hook

#### **5. Manejo de Estados de Carga**
**Problema:** Estados loading/error repetidos
- Mismo patrón en 8+ componentes
- Lógica de retry duplicada
- Estados de error similares

**Impacto:** ~100 líneas de código duplicado
**Solución:** Crear `useAsyncState` hook

### **🟢 PRIORIDAD MEDIA - Duplicaciones Menores**

#### **6. Utilidades de Archivos**
**Problema:** `uploadFile.js` tiene funciones que podrían modularizarse
- `uploadFile`, `uploadMultipleFiles`, `deleteFile`
- Lógica de error handling repetida

**Impacto:** ~50 líneas de código duplicado
**Solución:** Modularizar en `utils/fileUtils.js`

#### **7. Constantes y Configuración**
**Problema:** URLs y configuraciones hardcodeadas
- `API_BASE_URL` repetido en múltiples archivos
- Headers de Supabase duplicados
- Configuraciones de error similares

**Impacto:** ~30 líneas de código duplicado
**Solución:** Centralizar en `config/constants.js`

---

## 🎯 **PLAN INCREMENTAL DE REFACTORIZACIÓN**

### **FASE 1: Centralización de Autenticación (Semana 1)**

#### **Paso 1.1: Crear Servicio de Autenticación Centralizado**
```python
# backend/services/auth_service.py
class AuthService:
    @staticmethod
    async def get_current_user(authorization: str) -> dict:
        # Implementación unificada con Supabase JWKS
        pass
    
    @staticmethod
    def validate_user_access(user_id: str, required_user_id: str) -> None:
        # Validación unificada de permisos
        pass
```

**Archivos a modificar:**
- `backend/services/auth_service.py` (nuevo)
- `backend/routers/notifications.py` (actualizar)
- `backend/routers/disputes.py` (actualizar)
- `backend/routers/payments.py` (actualizar)
- `backend/routers/ratings.py` (actualizar)

**Tests requeridos:**
```bash
pytest backend/tests/test_auth_service.py
pytest backend/tests/test_ratings.py  # Verificar que sigue funcionando
```

#### **Paso 1.2: Actualizar Dependencias en Routers**
```python
# backend/routers/ratings.py
from services.auth_service import AuthService

async def get_current_user(authorization: str = Header(...)):
    return await AuthService.get_current_user(authorization)
```

**Verificación:**
- Ejecutar tests existentes
- Verificar que todos los endpoints siguen funcionando
- Confirmar que la seguridad no se ve comprometida

### **FASE 2: Unificación de Hooks (Semana 2)**

#### **Paso 2.1: Crear Hook Base `useApi`**
```javascript
// src/hooks/useApi.js
export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (params = {}) => {
    // Lógica unificada de API calls
  }, [endpoint, options]);

  return { data, loading, error, execute };
};
```

**Archivos a crear:**
- `src/hooks/useApi.js` (nuevo)
- `src/hooks/useAsyncState.js` (nuevo)
- `src/hooks/useSupabaseQuery.js` (nuevo)

#### **Paso 2.2: Refactorizar Hooks Existentes**
```javascript
// src/hooks/useRatings.jsx (refactorizado)
export const useRatings = () => {
  const { data, loading, error, execute } = useApi('/api/ratings');
  
  const createRating = useCallback(async (ratingData) => {
    return execute({ method: 'POST', data: ratingData });
  }, [execute]);

  return { createRating, loading, error };
};
```

**Archivos a refactorizar:**
- `src/hooks/useNotifications.jsx`
- `src/hooks/useRatings.jsx`
- `src/hooks/useDisputes.jsx`
- `src/hooks/usePayments.jsx`

**Tests requeridos:**
```bash
npm test src/hooks/useApi.test.js
npm test src/hooks/useRatings.test.js  # Verificar que sigue funcionando
```

### **FASE 3: Optimización de Queries (Semana 3)**

#### **Paso 3.1: Crear Hook de Consultas Supabase**
```javascript
// src/hooks/useSupabaseQuery.js
export const useSupabaseQuery = (table, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (query) => {
    // Lógica unificada de consultas Supabase
  }, [table, options]);

  return { data, loading, error, execute };
};
```

#### **Paso 3.2: Optimizar Queries Existentes**
```javascript
// src/hooks/useWorkerRequests.js (optimizado)
export const useWorkerRequests = (workerId, statusFilter = null) => {
  const { data, loading, error, execute } = useSupabaseQuery('requests', {
    select: `
      *,
      client:profiles!requests_client_id_fkey(id, full_name, email, phone),
      worker:profiles!requests_worker_id_fkey(id, full_name, email, phone)
    `,
    filters: { worker_id: workerId },
    order: { created_at: 'desc' }
  });

  // Lógica simplificada
};
```

**Archivos a optimizar:**
- `src/hooks/useWorkerRequests.js`
- `src/hooks/useNotifications.jsx`
- `src/hooks/useRatings.jsx`

### **FASE 4: Centralización de Validaciones (Semana 4)**

#### **Paso 4.1: Crear Hook de Validación de Formularios**
```javascript
// src/hooks/useFormValidation.js
export const useFormValidation = (schema) => {
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback((data) => {
    // Lógica unificada de validación
  }, [schema]);

  return { errors, isValid, validate };
};
```

#### **Paso 4.2: Refactorizar Formularios**
```javascript
// src/components/RegisterWorkerForm.jsx (refactorizado)
const RegisterWorkerForm = () => {
  const { errors, isValid, validate } = useFormValidation(workerSchema);
  
  // Lógica simplificada
};
```

**Archivos a refactorizar:**
- `src/components/RegisterWorkerForm.jsx`
- `src/components/Payments/PaymentForm.jsx`
- `src/components/Rating/RatingForm.jsx`

### **FASE 5: Optimización de Performance (Semana 5)**

#### **Paso 5.1: Implementar Lazy Loading**
```javascript
// src/components/LazyComponents.js
export const LazyWorkerDashboard = lazy(() => import('./WorkerDashboard'));
export const LazyClientDashboard = lazy(() => import('./ClientDashboard'));
```

#### **Paso 5.2: Optimizar Re-renders**
```javascript
// src/components/Rating/RatingList.jsx (optimizado)
const RatingList = React.memo(({ ratings, onRatingClick }) => {
  // Componente optimizado
});
```

#### **Paso 5.3: Eliminar Delays Simulados**
```javascript
// src/hooks/useWorkerSearch.ts (optimizado)
const fetchWorkers = useCallback(async (reset = false) => {
  // Eliminar: await new Promise((res) => setTimeout(res, 700));
  // Implementar consulta real a Supabase
}, [filters, page]);
```

---

## 🧪 **ESTRATEGIA DE TESTING**

### **Tests de Protección por Fase**

#### **Fase 1: Autenticación**
```bash
# Tests existentes que deben seguir pasando
pytest backend/tests/test_ratings.py
pytest backend/tests/test_notifications.py
pytest backend/tests/test_disputes.py
pytest backend/tests/test_payments.py

# Nuevos tests
pytest backend/tests/test_auth_service.py
```

#### **Fase 2: Hooks**
```bash
# Tests existentes
npm test src/hooks/useRatings.test.js
npm test src/hooks/useNotifications.test.js

# Nuevos tests
npm test src/hooks/useApi.test.js
npm test src/hooks/useAsyncState.test.js
```

#### **Fase 3: Queries**
```bash
# Tests de integración
npm test src/hooks/useSupabaseQuery.test.js
npm test src/components/WorkerDashboard.test.js
```

### **Tests de Regresión**
```bash
# Ejecutar después de cada fase
npm test
pytest backend/tests/
npm run build  # Verificar que el build sigue funcionando
```

---

## 📋 **CHECKLIST DE VERIFICACIÓN**

### **Antes de cada cambio:**
- [ ] Ejecutar tests existentes
- [ ] Hacer backup del código actual
- [ ] Crear branch para el cambio
- [ ] Documentar el cambio

### **Después de cada cambio:**
- [ ] Ejecutar tests existentes
- [ ] Ejecutar tests nuevos
- [ ] Verificar funcionalidad manual
- [ ] Actualizar documentación
- [ ] Hacer commit con mensaje descriptivo

### **Al final de cada fase:**
- [ ] Ejecutar suite completa de tests
- [ ] Verificar que no hay regresiones
- [ ] Actualizar README si es necesario
- [ ] Hacer merge a main

---

## 🚨 **RIESGOS IDENTIFICADOS Y MITIGACIONES**

### **Riesgo 1: Romper funcionalidad existente**
**Mitigación:**
- Tests de regresión en cada paso
- Cambios pequeños e incrementales
- Verificación manual después de cada cambio

### **Riesgo 2: Introducir bugs en autenticación**
**Mitigación:**
- Tests exhaustivos de seguridad
- Validación manual de tokens JWT
- Verificación de permisos

### **Riesgo 3: Degradar performance**
**Mitigación:**
- Benchmarks antes y después
- Monitoreo de queries de Supabase
- Optimización gradual

### **Riesgo 4: Perder cobertura de tests**
**Mitigación:**
- Mantener tests existentes
- Agregar tests nuevos para código refactorizado
- Monitoreo de cobertura

---

## 📊 **MÉTRICAS DE ÉXITO**

### **Métricas Cuantitativas:**
- **Reducción de código duplicado:** 50%+ (objetivo: 400+ líneas)
- **Cobertura de tests:** Mantener 80%+
- **Tiempo de build:** Mantener < 2 minutos
- **Performance:** Mantener o mejorar tiempos de respuesta

### **Métricas Cualitativas:**
- **Mantenibilidad:** Código más fácil de mantener
- **Legibilidad:** Código más claro y consistente
- **Escalabilidad:** Base sólida para futuras funcionalidades
- **Seguridad:** Validaciones centralizadas y consistentes

---

## 🎯 **RESULTADOS ESPERADOS**

### **Después de la refactorización:**
1. **Código 50% más limpio** - Eliminación de duplicaciones
2. **Mantenimiento 70% más fácil** - Lógica centralizada
3. **Desarrollo 40% más rápido** - Hooks reutilizables
4. **Bugs 60% menos frecuentes** - Validaciones consistentes
5. **Performance 20% mejor** - Queries optimizadas

### **Beneficios a largo plazo:**
- **Onboarding más rápido** para nuevos desarrolladores
- **Debugging más eficiente** con código centralizado
- **Escalabilidad mejorada** para nuevas funcionalidades
- **Seguridad robusta** con validaciones unificadas

---

## 🚀 **PRÓXIMOS PASOS INMEDIATOS**

### **Semana 1 - Preparación:**
1. **Crear branch de refactorización**
2. **Configurar tests de regresión**
3. **Documentar estado actual**
4. **Comenzar con Fase 1**

### **Comando para empezar:**
```bash
# Crear branch
git checkout -b refactor/centralize-auth

# Ejecutar tests actuales
npm test
pytest backend/tests/

# Crear archivo de auth service
touch backend/services/auth_service.py
```

---

**📅 Cronograma:** 5 semanas  
**👥 Responsable:** Equipo de desarrollo  
**🔒 Seguridad:** Tests de regresión en cada paso  
**📈 Objetivo:** Código más limpio, mantenible y escalable  

---

*Este plan garantiza una refactorización segura e incremental que mejora la calidad del código sin comprometer la funcionalidad existente.*

