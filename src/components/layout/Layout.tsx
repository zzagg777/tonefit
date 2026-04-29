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
    <div className="flex bg-background-muted h-full lg:h-screen lg:overflow-hidden max-lg:min-h-screen">
      <SidebarNav />
      <Outlet />
    </div>
  );
}
