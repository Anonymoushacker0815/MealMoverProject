export type Role = 'user' | 'manager' | 'owner';

export interface NavItem {
  label: string;
  route: string;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  user: [
    { label: 'Order', route: '/user/order' },
    { label: 'Loyalty', route: '/user/loyalty' },
  ],
  manager: [
    { label: 'Dashboard', route: '/manager/dashboard' },
    { label: 'Moderation', route: '/manager/moderation' },
    { label: 'Users', route: '/manager/users' },
    { label: 'Report', route: '/manager/report' },
    { label: 'Settings', route: '/manager/settings' },
  ],
  owner: [
    { label: 'Orders', route: '/owner/orders' },
    { label: 'Menu', route: '/owner/menu' },
    { label: 'Analytics', route: '/owner/analytics' },
    { label: 'Profile', route: '/owner/profile' },
  ],
};
