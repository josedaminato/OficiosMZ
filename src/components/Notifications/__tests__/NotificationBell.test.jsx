import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationBell from '../NotificationBell';
import { useNotifications } from '../../../hooks/useNotifications';

// Mock del hook useNotifications
jest.mock('../../../hooks/useNotifications');

// Mock de lucide-react
jest.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon">🔔</div>,
  X: () => <div data-testid="x-icon">✕</div>,
  Check: () => <div data-testid="check-icon">✓</div>,
  CheckCheck: () => <div data-testid="check-check-icon">✓✓</div>,
}));

describe('NotificationBell', () => {
  const mockUserId = 'test-user-123';
  const mockNotifications = [
    {
      id: '1',
      title: 'Nueva Calificación',
      message: 'Has recibido una calificación de 5 estrellas',
      type: 'rating',
      is_read: false,
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      title: 'Pago Recibido',
      message: 'Se ha procesado tu pago de $2,500',
      type: 'payment',
      is_read: true,
      created_at: '2024-01-15T09:00:00Z'
    }
  ];

  const mockUseNotifications = {
    notifications: mockNotifications,
    unreadCount: 1,
    loading: false,
    error: null,
    loadNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn()
  };

  beforeEach(() => {
    useNotifications.mockReturnValue(mockUseNotifications);
    jest.clearAllMocks();
  });

  it('renderiza la campana de notificaciones', () => {
    render(<NotificationBell userId={mockUserId} />);
    
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
  });

  it('muestra el contador de notificaciones no leídas', () => {
    render(<NotificationBell userId={mockUserId} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('no muestra el contador cuando no hay notificaciones no leídas', () => {
    useNotifications.mockReturnValue({
      ...mockUseNotifications,
      unreadCount: 0
    });

    render(<NotificationBell userId={mockUserId} />);
    
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('abre el dropdown al hacer click en la campana', async () => {
    render(<NotificationBell userId={mockUserId} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    });
  });

  it('carga las notificaciones al abrir el dropdown', async () => {
    render(<NotificationBell userId={mockUserId} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(mockUseNotifications.loadNotifications).toHaveBeenCalledWith(1, 10);
    });
  });

  it('muestra las notificaciones en el dropdown', async () => {
    render(<NotificationBell userId={mockUserId} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Nueva Calificación')).toBeInTheDocument();
      expect(screen.getByText('Pago Recibido')).toBeInTheDocument();
    });
  });

  it('muestra el botón de marcar todas como leídas cuando hay notificaciones no leídas', async () => {
    render(<NotificationBell userId={mockUserId} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Leer todas')).toBeInTheDocument();
    });
  });

  it('no muestra el botón de marcar todas como leídas cuando no hay notificaciones no leídas', async () => {
    useNotifications.mockReturnValue({
      ...mockUseNotifications,
      unreadCount: 0
    });

    render(<NotificationBell userId={mockUserId} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Leer todas')).not.toBeInTheDocument();
    });
  });

  it('marca todas las notificaciones como leídas al hacer click en el botón', async () => {
    render(<NotificationBell userId={mockUserId} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      const markAllButton = screen.getByText('Leer todas');
      fireEvent.click(markAllButton);
    });
    
    expect(mockUseNotifications.markAllAsRead).toHaveBeenCalled();
  });

  it('cierra el dropdown al hacer click en el botón X', async () => {
    render(<NotificationBell userId={mockUserId} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      const closeButton = screen.getByTestId('x-icon');
      fireEvent.click(closeButton);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Notificaciones')).not.toBeInTheDocument();
    });
  });

  it('muestra mensaje cuando no hay notificaciones', async () => {
    useNotifications.mockReturnValue({
      ...mockUseNotifications,
      notifications: [],
      unreadCount: 0
    });

    render(<NotificationBell userId={mockUserId} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('No hay notificaciones')).toBeInTheDocument();
    });
  });

  it('muestra mensaje de error cuando hay un error', async () => {
    useNotifications.mockReturnValue({
      ...mockUseNotifications,
      error: 'Error al cargar notificaciones',
      notifications: []
    });

    render(<NotificationBell userId={mockUserId} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error al cargar notificaciones')).toBeInTheDocument();
    });
  });

  it('muestra indicador de carga', () => {
    useNotifications.mockReturnValue({
      ...mockUseNotifications,
      loading: true
    });

    render(<NotificationBell userId={mockUserId} />);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('llama a onNotificationClick cuando se hace click en una notificación', async () => {
    const mockOnNotificationClick = jest.fn();
    
    render(
      <NotificationBell 
        userId={mockUserId} 
        onNotificationClick={mockOnNotificationClick}
      />
    );
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      const notification = screen.getByText('Nueva Calificación');
      fireEvent.click(notification);
    });
    
    expect(mockOnNotificationClick).toHaveBeenCalledWith(mockNotifications[0]);
  });

  it('marca una notificación como leída al hacer click en ella', async () => {
    render(<NotificationBell userId={mockUserId} />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      const notification = screen.getByText('Nueva Calificación');
      fireEvent.click(notification);
    });
    
    expect(mockUseNotifications.markAsRead).toHaveBeenCalledWith('1');
  });

  it('cierra el dropdown al hacer click fuera de él', async () => {
    render(
      <div>
        <NotificationBell userId={mockUserId} />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    });
    
    const outsideElement = screen.getByTestId('outside');
    fireEvent.mouseDown(outsideElement);
    
    await waitFor(() => {
      expect(screen.queryByText('Notificaciones')).not.toBeInTheDocument();
    });
  });
});




