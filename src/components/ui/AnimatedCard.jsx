import React, { useState, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

/**
 * Card animada con microinteracciones avanzadas
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Contenido de la card
 * @param {string} props.className - Clases CSS adicionales
 * @param {boolean} props.hoverable - Si la card es hoverable
 * @param {boolean} props.clickable - Si la card es clickeable
 * @param {Function} props.onClick - Función de click
 * @param {string} props.variant - Variante de la card (default, elevated, outlined)
 * @param {boolean} props.animateOnScroll - Animar al hacer scroll
 * @param {number} props.delay - Delay de la animación
 */
const AnimatedCard = ({
  children,
  className = '',
  hoverable = true,
  clickable = false,
  onClick,
  variant = 'default',
  animateOnScroll = true,
  delay = 0,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const controls = useAnimation();

  // Variantes de la card
  const cardVariants = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg border-0',
    outlined: 'bg-transparent border-2 border-gray-300',
  };

  // Animaciones de entrada
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  // Animaciones de hover
  const hoverVariants = {
    rest: { 
      scale: 1,
      y: 0,
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
    },
    hover: { 
      scale: 1.02,
      y: -4,
      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    tap: { 
      scale: 0.98,
      y: -2,
      transition: {
        duration: 0.1
      }
    }
  };

  // Manejar hover
  const handleMouseEnter = () => {
    if (hoverable) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (hoverable) {
      setIsHovered(false);
    }
  };

  // Manejar presión
  const handleMouseDown = () => {
    if (clickable) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    if (clickable) {
      setIsPressed(false);
    }
  };

  // Manejar click
  const handleClick = (e) => {
    if (clickable && onClick) {
      onClick(e);
    }
  };

  // Animar al hacer scroll
  React.useEffect(() => {
    if (animateOnScroll && isInView) {
      controls.start('visible');
    }
  }, [isInView, controls, animateOnScroll]);

  return (
    <motion.div
      ref={ref}
      className={`
        relative rounded-lg transition-colors duration-200
        ${cardVariants[variant]}
        ${clickable ? 'cursor-pointer' : ''}
        ${className}
      `}
      variants={animateOnScroll ? containerVariants : undefined}
      initial={animateOnScroll ? 'hidden' : undefined}
      animate={animateOnScroll ? controls : undefined}
      whileHover={hoverable ? hoverVariants.hover : undefined}
      whileTap={clickable ? hoverVariants.tap : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      {...props}
    >
      {/* Contenido */}
      <motion.div
        className="relative z-10"
        animate={{
          y: isHovered ? -2 : 0,
        }}
        transition={{
          duration: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      >
        {children}
      </motion.div>

      {/* Efecto de brillo en hover */}
      {hoverable && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white to-transparent opacity-0 pointer-events-none"
          animate={{
            opacity: isHovered ? 0.1 : 0,
            x: isHovered ? ['0%', '100%'] : '0%',
          }}
          transition={{
            duration: 0.6,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Efecto de ripple en click */}
      {clickable && isPressed && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-blue-500 opacity-20 pointer-events-none"
          initial={{ scale: 0, opacity: 0.3 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};

export default AnimatedCard;
