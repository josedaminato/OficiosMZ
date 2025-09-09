import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente Skip Links para navegación accesible
 * Permite a usuarios con teclado saltar a secciones principales
 */
const SkipLinks = () => {
  const navigate = useNavigate();

  const skipLinks = [
    {
      id: 'skip-main',
      href: '#main-content',
      text: 'Saltar al contenido principal'
    },
    {
      id: 'skip-nav',
      href: '#main-navigation',
      text: 'Saltar a la navegación'
    },
    {
      id: 'skip-search',
      href: '#search-form',
      text: 'Saltar al buscador'
    },
    {
      id: 'skip-footer',
      href: '#main-footer',
      text: 'Saltar al pie de página'
    }
  ];

  const handleSkipClick = (e, href) => {
    e.preventDefault();
    
    // Si es un hash, hacer scroll al elemento
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="skip-links">
      {skipLinks.map(link => (
        <a
          key={link.id}
          href={link.href}
          onClick={(e) => handleSkipClick(e, link.href)}
          className="
            skip-link
            sr-only focus:not-sr-only
            absolute top-0 left-0 z-50
            bg-blue-600 text-white px-4 py-2
            text-sm font-medium rounded-br-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500
            transition-all duration-200 ease-in-out
            hover:bg-blue-700
          "
          style={{
            clip: 'rect(0, 0, 0, 0)',
            clipPath: 'inset(50%)',
            height: '1px',
            overflow: 'hidden',
            position: 'absolute',
            whiteSpace: 'nowrap',
            width: '1px'
          }}
        >
          {link.text}
        </a>
      ))}
    </div>
  );
};

export default SkipLinks;
