export type Role = 'user' | 'manager' | 'owner';

export interface NavItem {
  label: string;
  route: string;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  user: [
    { label: 'Order', route: '/user/order' },
    { label: 'Loyalty', route: '/user/loyalty' },
    { label: 'Profile', route: '/user/profile' },
  ],
  manager: [
    { label: 'Dashboard', route: '/manager/dashboard' },
    { label: 'Moderation', route: '/manager/moderation' },
    { label: 'Settings', route: '/manager/settings' },
  ],
  owner: [
    { label: 'Orders', route: '/owner/orders' },
    { label: 'Menu', route: '/owner/menu' },
    { label: 'Analytics', route: '/owner/analytics' },
    { label: 'Profile', route: '/owner/profile' },
  ],
};
