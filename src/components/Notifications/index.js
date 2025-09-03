// Exportaciones principales del sistema de notificaciones
export { default as NotificationBell } from './NotificationBell';
export { default as NotificationItem, NotificationItemCompact, NotificationCard } from './NotificationItem';
export { default as NotificationList, RecentNotifications } from './NotificationList';
export { 
  default as NotificationSystem, 
  NotificationHeader, 
  NotificationPage, 
  NotificationSidebar 
} from './NotificationSystem';

// Hook personalizado
export { useNotifications, useNotificationStats } from '../../hooks/useNotifications';

