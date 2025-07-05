# Componentes UI Reutilizables

Esta carpeta contiene componentes UI reutilizables que siguen un diseño consistente y pueden ser utilizados en toda la aplicación.

## Componentes Disponibles

### TextInput
Componente de entrada de texto con validación y estilos consistentes.

```jsx
import { TextInput } from './ui';

<TextInput
  label="Nombre"
  name="name"
  type="text"
  register={register}
  error={errors.name}
  required={true}
  disabled={false}
  placeholder="Ingresa tu nombre"
/>
```

**Props:**
- `label` - Etiqueta del campo
- `name` - Nombre del campo
- `type` - Tipo de entrada (text, email, number, tel, etc.)
- `register` - Función de registro de react-hook-form
- `error` - Error del campo
- `required` - Si el campo es obligatorio
- `disabled` - Si el campo está deshabilitado
- `placeholder` - Placeholder del campo
- `validation` - Reglas de validación adicionales

### FileUpload
Componente para subir archivos con drag & drop y preview.

```jsx
import { FileUpload } from './ui';

<FileUpload
  label="Foto de perfil"
  name="profile_picture"
  register={register}
  error={errors.profile_picture}
  required={true}
  accept="image/*"
  maxSize={5}
  showPreview={true}
/>
```

**Props:**
- `label` - Etiqueta del campo
- `name` - Nombre del campo
- `accept` - Tipos de archivo aceptados
- `register` - Función de registro de react-hook-form
- `error` - Error del campo
- `required` - Si el campo es obligatorio
- `disabled` - Si el campo está deshabilitado
- `showPreview` - Si mostrar preview de la imagen
- `maxSize` - Tamaño máximo en MB

### CameraCapture
Componente para capturar fotos con la cámara web.

```jsx
import { CameraCapture } from './ui';

<CameraCapture
  label="Captura en vivo"
  name="live_capture"
  register={register}
  error={errors.live_capture}
  required={true}
  disabled={false}
  onCapture={(file, imageUrl) => {
    // Manejar la captura
  }}
/>
```

**Props:**
- `label` - Etiqueta del campo
- `name` - Nombre del campo
- `register` - Función de registro de react-hook-form
- `error` - Error del campo
- `required` - Si el campo es obligatorio
- `disabled` - Si el campo está deshabilitado
- `onCapture` - Callback cuando se captura una foto

### Select
Componente de selección con opciones personalizables.

```jsx
import { Select } from './ui';

const options = [
  { value: "option1", label: "Opción 1" },
  { value: "option2", label: "Opción 2" }
];

<Select
  label="Selecciona una opción"
  name="option"
  options={options}
  register={register}
  error={errors.option}
  required={true}
  placeholder="Elige una opción"
/>
```

**Props:**
- `label` - Etiqueta del campo
- `name` - Nombre del campo
- `options` - Array de opciones {value, label}
- `register` - Función de registro de react-hook-form
- `error` - Error del campo
- `required` - Si el campo es obligatorio
- `disabled` - Si el campo está deshabilitado
- `placeholder` - Placeholder del select

### LoadingSpinner
Componente de spinner de carga reutilizable.

```jsx
import { LoadingSpinner } from './ui';

<LoadingSpinner 
  size="md" 
  color="blue" 
  text="Cargando..." 
/>
```

**Props:**
- `size` - Tamaño del spinner (sm, md, lg, xl)
- `color` - Color del spinner (blue, green, red, gray, white)
- `text` - Texto a mostrar junto al spinner
- `className` - Clases CSS adicionales

## Características Comunes

### Estilos Consistentes
- Todos los componentes usan Tailwind CSS
- Colores y espaciados consistentes
- Estados de hover, focus y disabled
- Indicadores visuales de campos obligatorios

### Validación
- Integración con react-hook-form
- Manejo de errores consistente
- Iconos de error visuales
- Mensajes de error descriptivos

### Accesibilidad
- Labels asociados correctamente
- IDs únicos para cada campo
- Estados de focus visibles
- Textos descriptivos para lectores de pantalla

### Responsive Design
- Adaptable a diferentes tamaños de pantalla
- Grid system para layouts complejos
- Espaciado responsivo

## Uso con React Hook Form

Todos los componentes están diseñados para trabajar con react-hook-form:

```jsx
import { useForm } from 'react-hook-form';
import { TextInput, FileUpload, Select } from './ui';

const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextInput
        label="Nombre"
        name="name"
        register={register}
        error={errors.name}
        required={true}
      />
      
      <FileUpload
        label="Archivo"
        name="file"
        register={register}
        error={errors.file}
        required={true}
      />
      
      <Select
        label="Categoría"
        name="category"
        options={categoryOptions}
        register={register}
        error={errors.category}
        required={true}
      />
    </form>
  );
};
```

## Personalización

Los componentes pueden ser personalizados usando las props `className` y `validation`:

```jsx
<TextInput
  label="Campo personalizado"
  name="custom"
  register={register}
  className="my-custom-class"
  validation={{
    minLength: { value: 3, message: "Mínimo 3 caracteres" },
    pattern: { value: /^[A-Za-z]+$/, message: "Solo letras" }
  }}
/>
``` 