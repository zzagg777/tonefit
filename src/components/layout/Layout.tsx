import { Outlet } from 'react-router-dom';
import SidebarNav from '@/components/layout/SidebarNav';

/**
 * Layout
 * - 공통 레이아웃 컴포넌트
 * - layout > SidebarNav + main + footer
 *
 */
export default function Layout() {
  return (
    <div className="flex h-screen bg-background-muted overflow-hidden">
      <SidebarNav />
      <Outlet />
    </div>
  );
}
