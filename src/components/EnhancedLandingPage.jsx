import React, { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Search, ArrowRight, CheckCircle, Star, Users, Shield, Clock } from 'lucide-react';
import logo from '../assets/logo.svg';
import EnhancedButton from './ui/EnhancedButton';
import EnhancedTextInput from './ui/EnhancedTextInput';
import AnimatedCard from './ui/AnimatedCard';
import SkipLinks from './ui/SkipLinks';

/**
 * Landing Page mejorada con microinteracciones y accesibilidad
 */
const EnhancedLandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Referencias para animaciones
  const heroRef = React.useRef(null);
  const featuresRef = React.useRef(null);
  const statsRef = React.useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isFeaturesInView = useInView(featuresRef, { once: true });
  const isStatsInView = useInView(statsRef, { once: true });

  // Manejar búsqueda
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    // Simular búsqueda
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSearching(false);
    // Aquí iría la lógica de búsqueda real
    console.log('Buscando:', { searchQuery, locationQuery });
  };

  // Características principales
  const features = [
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Trabajadores Verificados",
      description: "Todos nuestros profesionales pasan por un proceso de verificación riguroso",
      delay: 0.1
    },
    {
      icon: <Clock className="w-8 h-8 text-green-600" />,
      title: "Respuesta Rápida",
      description: "Conectamos con trabajadores disponibles en tu zona en minutos",
      delay: 0.2
    },
    {
      icon: <Star className="w-8 h-8 text-yellow-600" />,
      title: "Calificaciones Reales",
      description: "Sistema de calificaciones basado en trabajos completados",
      delay: 0.3
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: "Comunidad Local",
      description: "Apoyamos a trabajadores de Mendoza y alrededores",
      delay: 0.4
    }
  ];

  // Estadísticas
  const stats = [
    { number: "500+", label: "Trabajadores Activos", delay: 0.1 },
    { number: "1,200+", label: "Trabajos Completados", delay: 0.2 },
    { number: "4.8/5", label: "Calificación Promedio", delay: 0.3 },
    { number: "24h", label: "Tiempo de Respuesta", delay: 0.4 }
  ];

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <SkipLinks />
      
      {/* Header */}
      <motion.header 
        className="relative z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <img src={logo} alt="Logo OficiosMZ" className="h-12 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-blue-600">OficiosMZ</h1>
                <p className="text-xs text-gray-500">Cada oficio, a un clic de distancia</p>
              </div>
            </motion.div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Navegación principal">
              <a href="#inicio" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
                Inicio
              </a>
              <a href="#buscar" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
                Buscar
              </a>
              <a href="#como-funciona" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
                Cómo Funciona
              </a>
              <a href="#contacto" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
                Contacto
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <EnhancedButton
                variant="ghost"
                size="md"
                onClick={() => window.location.href = '/login'}
                className="hidden sm:inline-flex"
              >
                Iniciar Sesión
              </EnhancedButton>
              <EnhancedButton
                variant="primary"
                size="md"
                onClick={() => window.location.href = '/register'}
              >
                Registrarse
              </EnhancedButton>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        id="main-content"
        ref={heroRef}
        className="relative py-20 px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate={isHeroInView ? "visible" : "hidden"}
      >
        <div className="max-w-7xl mx-auto text-center">
          {/* Título Principal */}
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            variants={itemVariants}
          >
            Encuentra{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Profesionales
            </span>{' '}
            de Confianza
          </motion.h1>

          <motion.p 
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto"
            variants={itemVariants}
          >
            Conectamos tus necesidades con los mejores especialistas locales. 
            Rápido, seguro y eficiente.
          </motion.p>

          {/* Buscador Mejorado */}
          <motion.div 
            className="max-w-2xl mx-auto mb-16"
            variants={itemVariants}
          >
            <AnimatedCard 
              className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-2xl"
              hoverable={false}
            >
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EnhancedTextInput
                    label="¿Qué oficio necesitas?"
                    name="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ej: Plomero, Electricista, Carpintero..."
                    required
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="text-lg"
                  />
                  <EnhancedTextInput
                    label="¿En qué zona?"
                    name="location"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="Ej: Godoy Cruz, Las Heras..."
                    required
                    className="text-lg"
                  />
                </div>
                
                <EnhancedButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSearching}
                  className="w-full md:w-auto"
                  fullWidth
                >
                  {isSearching ? 'Buscando...' : 'Buscar Profesionales'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </EnhancedButton>
              </form>
            </AnimatedCard>
          </motion.div>

          {/* Características Principales */}
          <motion.div 
            ref={featuresRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
            variants={containerVariants}
            initial="hidden"
            animate={isFeaturesInView ? "visible" : "hidden"}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AnimatedCard 
                  className="p-6 text-center hover:shadow-lg transition-all duration-300"
                  delay={feature.delay}
                >
                  <div className="mb-4 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </AnimatedCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Estadísticas */}
      <motion.section 
        ref={statsRef}
        className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        variants={containerVariants}
        initial="hidden"
        animate={isStatsInView ? "visible" : "hidden"}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center"
                variants={itemVariants}
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100 text-sm md:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Final */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            ¿Listo para encontrar tu próximo profesional?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a miles de personas que ya confían en OficiosMZ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <EnhancedButton
              variant="primary"
              size="lg"
              onClick={() => window.location.href = '/register'}
            >
              Comenzar Ahora
              <ArrowRight className="w-5 h-5 ml-2" />
            </EnhancedButton>
            <EnhancedButton
              variant="secondary"
              size="lg"
              onClick={() => window.location.href = '/login'}
            >
              Ya tengo cuenta
            </EnhancedButton>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer 
        id="main-footer"
        className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8"
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src={logo} alt="Logo OficiosMZ" className="h-8 w-auto" />
            <span className="text-xl font-bold">OficiosMZ</span>
          </div>
          <p className="text-gray-400 mb-4">
            © {new Date().getFullYear()} OficiosMZ.com — Hecho con pasión en Mendoza
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Términos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedLandingPage;
