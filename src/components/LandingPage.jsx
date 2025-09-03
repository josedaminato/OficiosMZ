import React from 'react';
import logo from '../assets/logo.svg';

// Paleta base
const COLORS = {
  background: '#181e29',
  heroGradient: 'linear-gradient(135deg, #2196f3 0%, #00bfff 100%)',
  card: '#232b3b',
  text: '#fff',
  subtitle: '#cfc6c1',
  cta: '#00bfff',
  ctaHover: '#2196f3',
  secondary: '#232b3b',
  border: '#514e4c',
};

const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', background: COLORS.background, fontFamily: 'Inter, Poppins, Montserrat, sans-serif' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2rem 3vw 1.5rem 3vw', background: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={logo} alt="Logo OficiosMZ" style={{ height: 48, marginRight: 12 }} />
          <span style={{ fontWeight: 800, fontSize: 28, color: COLORS.cta }}>OficiosMZ.com</span>
          <span style={{ color: COLORS.subtitle, fontSize: 14, marginLeft: 8 }}>Cada oficio, a un clic de distancia</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#" style={{ color: COLORS.cta, fontWeight: 600, borderBottom: `2px solid ${COLORS.cta}` }}>Inicio</a>
          <a href="#" style={{ color: COLORS.text, fontWeight: 500 }}>Buscar</a>
          <a href="#" style={{ color: COLORS.text, fontWeight: 500 }}>Blog</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-white font-medium hover:text-blue-400 transition-colors">Iniciar Sesión</a>
          <a href="/register" className="btn-primary">Registrarse</a>
          <a href="/register" className="btn-secondary border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">Soy Profesional</a>
        </div>
      </header>
      {/* Hero principal */}
      <section style={{ width: '100%', background: COLORS.heroGradient, borderRadius: 16, margin: '0 auto', maxWidth: 1400, marginTop: 32, padding: '4rem 2vw 5rem 2vw', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <h1 style={{ color: COLORS.text, fontWeight: 900, fontSize: '3.2rem', textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
          Encuentra Profesionales de Confianza en Mendoza
        </h1>
        <p style={{ color: COLORS.subtitle, fontSize: 22, textAlign: 'center', marginBottom: 40, fontWeight: 500 }}>
          Conectamos tus necesidades con los mejores especialistas locales. Rápido, seguro y eficiente.
        </p>
        {/* Buscador */}
        <div style={{ maxWidth: 600, margin: '0 auto', background: COLORS.card, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input type="text" placeholder="¿Qué oficio necesitas?" style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 16, background: COLORS.secondary, color: COLORS.text, outline: 'none' }} />
            <input type="text" placeholder="¿En qué zona? (Ej: Godoy Cruz)" style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 16, background: COLORS.secondary, color: COLORS.text, outline: 'none' }} />
          </div>
          <button style={{ background: COLORS.cta, color: COLORS.text, border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 18, cursor: 'pointer', marginTop: 8, transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = COLORS.ctaHover}
            onMouseOut={e => e.currentTarget.style.background = COLORS.cta}
          >
            <span style={{ fontSize: 20, marginRight: 8 }}>🔍</span> Buscar
          </button>
        </div>
      </section>
      {/* Espacio para futuras secciones: ¿Cómo funciona?, Beneficios, Testimonios, etc. */}
      <section style={{ maxWidth: 1200, margin: '64px auto 0 auto', padding: '0 2vw', color: COLORS.text }}>
        {/* Aquí se pueden agregar cards de beneficios, pasos, testimonios, etc. */}
      </section>
      {/* Footer */}
      <footer style={{ marginTop: 64, padding: '2rem 0', textAlign: 'center', color: COLORS.subtitle, fontSize: 15 }}>
        © {new Date().getFullYear()} OficiosMZ.com — Hecho con pasión en Mendoza
      </footer>
    </div>
  );
};

export default LandingPage; 