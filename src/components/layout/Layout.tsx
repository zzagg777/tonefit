import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
/**
 * Layout
 * - 공통 레이아웃 컴포넌트
 * - layout > header + main + footer
 *
 */
export default function Layout() {
  return (
    <div className="layout bg-background-muted h-screen flex justify-between flex-col">
      <Header />
      <main className="content h-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
