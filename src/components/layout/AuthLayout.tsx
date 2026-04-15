import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
/**
 * AuthLayout
 * - 인증 레이아웃 컴포넌트 (로그인·약관동의·회원가입·가입완료)
 * - auth__layout > auth__inner
 */
interface AuthLayoutProps {
  variant?: 'center' | 'top'; // center: 중앙, top: 상단 패딩
}
const AuthLayout = ({ variant = 'center' }: AuthLayoutProps) => {
  const contentAlignClass = variant === 'top' ? 'items-start' : 'items-center';

  return (
    <div className="layout layout--auth min-h-screen">
      <Header />
      <main
        className={`auth w-full min-w-200 min-h-[calc(100vh-170px)] bg-background-surface flex ${contentAlignClass} justify-center px-6 py-17`}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AuthLayout;
