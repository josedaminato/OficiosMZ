# Assets

Esta carpeta contiene todos los archivos estáticos de la aplicación.

## Estructura

```
src/assets/
├── logo.svg          # Logo principal de la aplicación
└── README.md         # Este archivo
```

## Uso

### Logo SVG
```jsx
import logo from '../assets/logo.svg';

// En tu componente
<img src={logo} alt="Logo OficiosMZ" />
```

### Imágenes
Para agregar nuevas imágenes:
1. Coloca el archivo en esta carpeta
2. Importa usando: `import imagen from '../assets/imagen.jpg'`
3. Usa en tu componente: `<img src={imagen} alt="Descripción" />`

## Formatos Recomendados

- **SVG**: Para iconos y logos (escalables)
- **WebP**: Para imágenes (mejor compresión)
- **PNG**: Para imágenes con transparencia
- **JPG**: Para fotografías

## Optimización

- Usa herramientas como [TinyPNG](https://tinypng.com/) para comprimir imágenes
- Considera usar lazy loading para imágenes grandes
- Implementa responsive images con diferentes tamaños


