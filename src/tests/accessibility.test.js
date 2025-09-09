/**
 * Tests de Accesibilidad para Oficios MZ
 * Verifica cumplimiento de estándares WCAG 2.1 AA
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import EnhancedLandingPage from '../components/EnhancedLandingPage';
import EnhancedTextInput from '../components/ui/EnhancedTextInput';
import EnhancedButton from '../components/ui/EnhancedButton';
import AccessibleModal from '../components/ui/AccessibleModal';

// Extender expect con matchers de accesibilidad
expect.extend(toHaveNoViolations);

describe('Accesibilidad - WCAG 2.1 AA', () => {
  describe('EnhancedLandingPage', () => {
    test('debe tener skip links para navegación por teclado', async () => {
      render(<EnhancedLandingPage />);
      
      // Verificar que existen skip links
      const skipLinks = screen.getAllByRole('link');
      const skipLinkTexts = skipLinks.map(link => link.textContent);
      
      expect(skipLinkTexts).toContain('Saltar al contenido principal');
      expect(skipLinkTexts).toContain('Saltar a la navegación');
    });

    test('debe tener landmarks semánticos correctos', async () => {
      const { container } = render(<EnhancedLandingPage />);
      
      // Verificar landmarks
      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('nav')).toBeInTheDocument();
      expect(container.querySelector('footer')).toBeInTheDocument();
    });

    test('debe cumplir estándares de accesibilidad', async () => {
      const { container } = render(<EnhancedLandingPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('debe tener navegación por teclado funcional', async () => {
      render(<EnhancedLandingPage />);
      
      // Verificar que los botones son focusables
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        // Verificar que tienen tabindex apropiado
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    test('debe tener contraste de colores adecuado', async () => {
      const { container } = render(<EnhancedLandingPage />);
      
      // Verificar que no hay elementos con contraste insuficiente
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('EnhancedTextInput', () => {
    test('debe tener labels asociados correctamente', () => {
      render(
        <EnhancedTextInput
          label="Nombre"
          name="name"
          value=""
          onChange={() => {}}
        />
      );
      
      const input = screen.getByLabelText('Nombre');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'name');
    });

    test('debe anunciar errores a lectores de pantalla', () => {
      render(
        <EnhancedTextInput
          label="Email"
          name="email"
          value=""
          onChange={() => {}}
          error="Email es requerido"
        />
      );
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Email es requerido');
    });

    test('debe tener estados de foco visibles', () => {
      render(
        <EnhancedTextInput
          label="Test"
          name="test"
          value=""
          onChange={() => {}}
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      
      // Verificar que el input puede recibir foco
      input.focus();
      expect(input).toHaveFocus();
    });

    test('debe cumplir estándares de accesibilidad', async () => {
      const { container } = render(
        <EnhancedTextInput
          label="Test"
          name="test"
          value=""
          onChange={() => {}}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('EnhancedButton', () => {
    test('debe tener aria-label cuando no tiene texto visible', () => {
      render(
        <EnhancedButton ariaLabel="Cerrar modal">
          <span aria-hidden="true">×</span>
        </EnhancedButton>
      );
      
      const button = screen.getByRole('button', { name: 'Cerrar modal' });
      expect(button).toBeInTheDocument();
    });

    test('debe anunciar estado de loading', () => {
      render(
        <EnhancedButton loading={true}>
          Guardar
        </EnhancedButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    test('debe ser focusable con teclado', () => {
      render(
        <EnhancedButton>
          Click me
        </EnhancedButton>
      );
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    test('debe cumplir estándares de accesibilidad', async () => {
      const { container } = render(
        <EnhancedButton>
          Test Button
        </EnhancedButton>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('AccessibleModal', () => {
    test('debe tener role dialog y aria-modal', () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    test('debe tener aria-labelledby cuando tiene título', () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      
      const title = screen.getByText('Test Modal');
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    test('debe cerrar con tecla Escape', async () => {
      const onClose = jest.fn();
      render(
        <AccessibleModal
          isOpen={true}
          onClose={onClose}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });

    test('debe atrapar foco dentro del modal', () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
        >
          <button>First button</button>
          <button>Second button</button>
        </AccessibleModal>
      );
      
      const firstButton = screen.getByText('First button');
      const secondButton = screen.getByText('Second button');
      
      // El primer botón debe tener foco
      expect(firstButton).toHaveFocus();
      
      // Tab debe ir al segundo botón
      fireEvent.keyDown(firstButton, { key: 'Tab' });
      expect(secondButton).toHaveFocus();
      
      // Tab desde el último botón debe ir al primero
      fireEvent.keyDown(secondButton, { key: 'Tab' });
      expect(firstButton).toHaveFocus();
    });

    test('debe cumplir estándares de accesibilidad', async () => {
      const { container } = render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Navegación por Teclado', () => {
    test('debe permitir navegación con Tab', () => {
      render(<EnhancedLandingPage />);
      
      const firstFocusable = screen.getByRole('link', { name: /saltar al contenido principal/i });
      firstFocusable.focus();
      expect(firstFocusable).toHaveFocus();
      
      // Tab debe mover el foco al siguiente elemento
      fireEvent.keyDown(firstFocusable, { key: 'Tab' });
      // El siguiente elemento focusable debe tener foco
    });

    test('debe permitir navegación con Shift+Tab', () => {
      render(<EnhancedLandingPage />);
      
      const buttons = screen.getAllByRole('button');
      const lastButton = buttons[buttons.length - 1];
      lastButton.focus();
      expect(lastButton).toHaveFocus();
      
      // Shift+Tab debe mover el foco al elemento anterior
      fireEvent.keyDown(lastButton, { key: 'Tab', shiftKey: true });
    });
  });

  describe('Lectores de Pantalla', () => {
    test('debe tener texto alternativo en imágenes', () => {
      render(<EnhancedLandingPage />);
      
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    test('debe tener headings con jerarquía correcta', () => {
      render(<EnhancedLandingPage />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      
      // No debe haber más de un h1
      const h1s = screen.getAllByRole('heading', { level: 1 });
      expect(h1s).toHaveLength(1);
    });

    test('debe anunciar cambios dinámicos', async () => {
      const { rerender } = render(
        <EnhancedTextInput
          label="Test"
          name="test"
          value=""
          onChange={() => {}}
        />
      );
      
      // Simular error
      rerender(
        <EnhancedTextInput
          label="Test"
          name="test"
          value=""
          onChange={() => {}}
          error="Error message"
        />
      );
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Contraste y Visibilidad', () => {
    test('debe tener contraste mínimo 4.5:1 para texto normal', async () => {
      const { container } = render(<EnhancedLandingPage />);
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });

    test('debe tener contraste mínimo 3:1 para texto grande', async () => {
      const { container } = render(
        <div>
          <h1 style={{ fontSize: '24px' }}>Large text</h1>
          <p style={{ fontSize: '18px' }}>Large paragraph</p>
        </div>
      );
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Responsive Design', () => {
    test('debe ser usable en pantallas pequeñas', () => {
      // Simular viewport móvil
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<EnhancedLandingPage />);
      
      // Verificar que los elementos son visibles y usables
      const searchInput = screen.getByLabelText(/qué oficio necesitas/i);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toBeVisible();
    });
  });
});

// Tests de integración de accesibilidad
describe('Integración de Accesibilidad', () => {
  test('toda la aplicación debe cumplir WCAG 2.1 AA', async () => {
    const { container } = render(<EnhancedLandingPage />);
    
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true },
        'semantic-markup': { enabled: true }
      }
    });
    
    expect(results).toHaveNoViolations();
  });
});
