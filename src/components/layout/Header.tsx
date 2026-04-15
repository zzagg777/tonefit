import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';

/**
 * Header
 * - 공통 헤더 컴포넌트
 * - 좌측: ToneFit 로고 (홈 링크)
 * - 우측: 로그인 버튼 + 무료로 시작하기 버튼
 *
 */
export default function Header() {
  return (
    <header
      className="
        flex items-center justify-between
        bg-background-page
        border-b border-border-default
        rounded-tl-2xl rounded-tr-2xl
        px-5 py-4
        w-full
        z-9999
      "
      style={{ boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.07)' }}
    >
      {/* ── 로고 ─────────────────────────────────────────── */}
      <Link
        to={ROUTES.HOME}
        className="p-2.5 text-4xl leading-9 font-bold tracking-tight text-text-primary"
      >
        ToneFit
      </Link>

      {/* ── 우측 버튼 영역 ────────────────────────────────── */}
      <div className="flex items-center gap-2.5">
        {/* 로그인 */}
        <Link
          to={ROUTES.LOGIN}
          className="
            px-5 py-2
            rounded-md
            text-base leading-5 font-medium tracking-tight
            text-text-secondary
            hover:text-text-primary
            transition-colors
          "
        >
          로그인
        </Link>

        {/* 무료로 시작하기 */}
        <Link
          to={ROUTES.JOIN_ACCEPT}
          className="
            px-5 py-2
            rounded-md
            text-sm leading-5 font-medium tracking-tight
            bg-background-inverse text-text-inverse
            hover:bg-background-hover-2
            active:bg-background-pressed-2
            transition-colors
          "
        >
          무료로 시작하기
        </Link>
      </div>
    </header>
  );
}
