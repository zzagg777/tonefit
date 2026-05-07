import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { ROUTES } from '@/constants';
import { Logo } from '@/components/ui/';

const SidebarNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [logoVariant, setLogoVariant] = useState<'default' | 'symbol'>(
    window.innerWidth < 1024 ? 'symbol' : 'default'
  );

  useEffect(() => {
    const handleResize = () => {
      setLogoVariant(window.innerWidth < 1024 ? 'symbol' : 'default');
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isEditorActive = location.pathname.startsWith('/home/editor');
  // const isLibraryActive = location.pathname === ROUTES.HISTORY;
  // const isSettingsActive = location.pathname === ROUTES.SETTINGS;

  const navBtnCls =
    'flex gap-5 h-17.5 items-center p-5 rounded-lg w-full cursor-pointer transition-colors text-left';

  const navLabelCls =
    'text-base font-semibold leading-6 tracking-tight max-lg:hidden';

  return (
    <aside className="max-lg:sticky top-0 lg:min-w-50 max-w-79 w-1/6 shrink-0 h-screen flex flex-col justify-between p-5 bg-background-page shadow-[0px_1px_4px_rgba(0,0,0,0.07)] z-10 max-lg:w-26.5">
      {/* 상단: 로고 + 네비게이션 */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center p-2.5 max-lg:justify-center">
          <Logo variant={logoVariant} />
        </div>

        <nav className="flex flex-col gap-2.5">
          <button
            onClick={() => navigate(ROUTES.EDITOR)}
            className={`${navBtnCls} ${isEditorActive ? 'bg-background-subtle' : 'bg-background-surface hover:bg-background-hover'}`}
          >
            <Icon
              name="pencil-ai"
              size={24}
              color={
                isEditorActive
                  ? 'var(--color-icon-primary)'
                  : 'var(--color-icon-placeholder)'
              }
            />
            <span
              className={`${navLabelCls} ${isEditorActive ? 'text-text-primary' : 'text-text-placeholder'}`}
            >
              이메일 교정
            </span>
          </button>

          {/* MVP 과정에서 임시 삭제 */}
          {/* <button
            onClick={() => navigate(ROUTES.HISTORY)}
            className={`${navBtnCls} ${isLibraryActive ? 'bg-background-subtle' : 'bg-background-surface hover:bg-background-hover'}`}
          >
            <Icon
              name="library"
              size={24}
              color={
                isLibraryActive
                  ? 'var(--color-icon-primary)'
                  : 'var(--color-icon-placeholder)'
              }
            />
            <span
              className={`text-base font-semibold leading-6 tracking-tight ${isLibraryActive ? 'text-text-primary' : 'text-text-placeholder'}`}
            >
              라이브러리
            </span>
          </button> */}

          {/* <button
            onClick={() => navigate(ROUTES.SETTINGS)}
            className={`${navBtnCls} ${isSettingsActive ? 'bg-background-subtle' : 'bg-background-page hover:bg-background-hover'}`}
          >
            <Icon
              name="setting"
              size={24}
              color={
                isSettingsActive
                  ? 'var(--color-icon-primary)'
                  : 'var(--color-icon-placeholder)'
              }
            />
            <span
              className={`${navLabelCls} ${isSettingsActive ? 'text-text-primary' : 'text-icon-placeholder'}`}
            >
              설정
            </span>
          </button> */}
        </nav>
      </div>

      {/* MVP 과정에서 임시 삭제 */}
      {/* 하단: 프로필 + 로그아웃 */}
      {/* <div className="flex flex-col gap-2.5">
        <div className="flex gap-4 items-center px-5">
          <div className="w-15 h-15 shrink-0 rounded-2xl shadow-[0px_1px_4px_rgba(0,0,0,0.07)] bg-background-subtle flex items-center justify-center">
            <Icon name="profile" size={32} color="var(--color-icon-tertiary)" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xl font-semibold leading-7 tracking-tight text-text-primary whitespace-nowrap">
              김준형
            </span>
            <div className="flex gap-1.5 items-center">
              <div className="w-2 h-2 rounded-full bg-text-placeholder shrink-0" />
              <span className="text-sm leading-5.5 tracking-tight text-text-primary whitespace-nowrap">
                Free Plan
              </span>
            </div>
          </div>
        </div>

        <button
          className={`${navBtnCls} bg-background-page hover:bg-background-hover`}
        >
          <Icon
            name="log-out"
            size={24}
            color="var(--color-icon-placeholder)"
          />
          <span className="text-base font-semibold leading-6 tracking-tight text-icon-placeholder">
            로그아웃
          </span>
        </button>
      </div> */}
    </aside>
  );
};

export default SidebarNav;
