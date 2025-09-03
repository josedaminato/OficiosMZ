import { renderHook, act } from '@testing-library/react';
import { useNotifications, useNotificationStats } from '../useNotifications';
import { supabase } from '../../supabaseClient';

// Mock de supabase
jest.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn()
    },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({
          unsubscribe: jest.fn()
        }))
      }))
    }))
  }
}));

// Mock de fetch
global.fetch = jest.fn();

describe('useNotifications', () => {
  const mockUserId = 'test-user-123';
  const mockSession = {
    access_token: 'mock-access-token'
  };

  const mockNotifications = [
    {
      id: '1',
      user_id: mockUserId,
      title: 'Nueva Calificación',
      message: 'Has recibido una calificación de 5 estrellas',
      type: 'rating',
      is_read: false,
      metadata: { score: 5 },
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de supabase auth
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    });
    
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    });
  });

  it('inicializa con estado correcto', () => {
    const { result } = renderHook(() => useNotifications(mockUserId));
    
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('carga notificaciones correctamente', async () => {
    const mockResponse = {
      notifications: mockNotifications,
      unread_count: 1,
      total: 1,
      page: 1,
      limit: 20
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useNotifications(mockUserId));

    await act(async () => {
      await result.current.loadNotifications();
    });

    expect(result.current.notifications).toEqual(mockNotifications);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('maneja errores al cargar notificaciones', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useNotifications(mockUserId));

    await act(async () => {
      try {
        await result.current.loadNotifications();
      } catch (error) {
        // Error esperado
      }
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  it('marca notificación como leída correctamente', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const { result } = renderHook(() => useNotifications(mockUserId));

    // Configurar estado inicial
    act(() => {
      result.current.notifications = mockNotifications;
      result.current.unreadCount = 1;
    });

    await act(async () => {
      await result.current.markAsRead('1');
    });

    expect(result.current.notifications[0].is_read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('marca todas las notificaciones como leídas', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, updated_count: 2 })
    });

    const { result } = renderHook(() => useNotifications(mockUserId));

    // Configurar estado inicial
    act(() => {
      result.current.notifications = [
        { ...mockNotifications[0], is_read: false },
        { ...mockNotifications[0], id: '2', is_read: false }
      ];
      result.current.unreadCount = 2;
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(result.current.notifications.every(n => n.is_read)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('crea nueva notificación correctamente', async () => {
    const newNotification = {
      id: '2',
      user_id: mockUserId,
      title: 'Nueva Notificación',
      message: 'Mensaje de prueba',
      type: 'system',
      is_read: false,
      metadata: {},
      created_at: '2024-01-15T11:00:00Z',
      updated_at: '2024-01-15T11:00:00Z'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => newNotification
    });

    const { result } = renderHook(() => useNotifications(mockUserId));

    // Configurar estado inicial
    act(() => {
      result.current.notifications = mockNotifications;
      result.current.unreadCount = 1;
    });

    const notificationData = {
      user_id: mockUserId,
      title: 'Nueva Notificación',
      message: 'Mensaje de prueba',
      type: 'system'
    };

    await act(async () => {
      await result.current.createNotification(notificationData);
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.notifications[0]).toEqual(newNotification);
    expect(result.current.unreadCount).toBe(2);
  });

  it('limpia errores correctamente', () => {
    const { result } = renderHook(() => useNotifications(mockUserId));

    act(() => {
      result.current.error = 'Test error';
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('no ejecuta efectos si userId es null', () => {
    const { result } = renderHook(() => useNotifications(null));

    expect(result.current.notifications).toEqual([]);
    expect(result.current.loading).toBe(true);
    
    // No debería hacer llamadas a la API
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('useNotificationStats', () => {
  const mockUserId = 'test-user-123';
  const mockSession = {
    access_token: 'mock-access-token'
  };

  const mockStats = {
    total_notifications: 10,
    unread_notifications: 3,
    last_notification_date: '2024-01-15T10:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    });
  });

  it('inicializa con estado correcto', () => {
    const { result } = renderHook(() => useNotificationStats(mockUserId));
    
    expect(result.current.stats).toEqual({
      total_notifications: 0,
      unread_notifications: 0,
      last_notification_date: null
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('carga estadísticas correctamente', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    });

    const { result } = renderHook(() => useNotificationStats(mockUserId));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('maneja errores al cargar estadísticas', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useNotificationStats(mockUserId));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  it('no ejecuta efectos si userId es null', () => {
    const { result } = renderHook(() => useNotificationStats(null));

    expect(result.current.stats).toEqual({
      total_notifications: 0,
      unread_notifications: 0,
      last_notification_date: null
    });
    
    // No debería hacer llamadas a la API
    expect(fetch).not.toHaveBeenCalled();
  });
});

