import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { ROUTES } from '@/constants';

const SidebarNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isEditorActive = location.pathname.startsWith('/home/editor');
  const isLibraryActive = location.pathname === ROUTES.HISTORY;
  const isSettingsActive = location.pathname === ROUTES.SETTINGS;

  const navBase =
    'flex gap-5 h-17.5 items-center p-5 rounded-lg w-full cursor-pointer transition-colors text-left';

  return (
    <aside className="w-[316px] shrink-0 h-screen flex flex-col justify-between p-5 bg-background-page shadow-[0px_1px_4px_rgba(0,0,0,0.07)] z-10">
      {/* 상단: 로고 + 네비게이션 */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-center p-2.5">
          <span className="text-2xl font-bold leading-8 tracking-tight text-text-primary">
            ToneFit
          </span>
        </div>

        <nav className="flex flex-col gap-2.5">
          <button
            onClick={() => navigate(ROUTES.EDITOR)}
            className={`${navBase} ${isEditorActive ? 'bg-background-subtle' : 'bg-background-surface hover:bg-background-hover'}`}
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
              className={`text-base font-semibold leading-6 tracking-tight ${isEditorActive ? 'text-text-primary' : 'text-text-placeholder'}`}
            >
              이메일 교정
            </span>
          </button>

          <button
            onClick={() => navigate(ROUTES.HISTORY)}
            className={`${navBase} ${isLibraryActive ? 'bg-background-subtle' : 'bg-background-surface hover:bg-background-hover'}`}
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
          </button>

          <button
            onClick={() => navigate(ROUTES.SETTINGS)}
            className={`${navBase} ${isSettingsActive ? 'bg-background-subtle' : 'bg-background-page hover:bg-background-hover'}`}
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
              className={`text-base font-semibold leading-6 tracking-tight ${isSettingsActive ? 'text-text-primary' : 'text-icon-placeholder'}`}
            >
              설정
            </span>
          </button>
        </nav>
      </div>

      {/* 하단: 프로필 + 로그아웃 */}
      <div className="flex flex-col gap-2.5">
        <div className="flex gap-4 items-center px-5">
          <div className="w-[60px] h-[60px] shrink-0 rounded-2xl shadow-[0px_1px_4px_rgba(0,0,0,0.07)] bg-background-subtle flex items-center justify-center">
            <Icon name="profile" size={32} color="var(--color-icon-tertiary)" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xl font-semibold leading-7 tracking-tight text-text-primary whitespace-nowrap">
              김준형
            </span>
            <div className="flex gap-1.5 items-center">
              <div className="w-2 h-2 rounded-full bg-text-placeholder shrink-0" />
              <span className="text-sm leading-[22px] tracking-tight text-text-primary whitespace-nowrap">
                Free Plan
              </span>
            </div>
          </div>
        </div>

        <button
          className={`${navBase} bg-background-page hover:bg-background-hover`}
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
      </div>
    </aside>
  );
};

export default SidebarNav;
