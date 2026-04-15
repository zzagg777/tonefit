import type { SVGAttributes } from 'react';

export type IconName =
  | 'mail'
  | 'hide'
  | 'show'
  | 'lock'
  | 'check'
  | 'question'
  | 'setting'
  | 'search'
  | 'filter'
  | 'loading'
  | 'no-symbol'
  | 'home'
  | 'profile'
  | 'alert'
  | 'pencil-ai'
  | 'library'
  | 'info'
  | 'close-circle'
  | 'check-circle';

interface IconProps extends SVGAttributes<SVGSVGElement> {
  /** 아이콘 이름 */
  name: IconName;
  /** 아이콘 크기(px), 기본값 24 */
  size?: number;
  /** 아이콘 색상. CSS 변수 또는 currentColor 사용 */
  color?: string;
  className?: string;
}

const Icon = ({
  name,
  size = 24,
  color = 'currentColor',
  className = '',
  style,
  ...props
}: IconProps) => {
  const base = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    xmlns: 'http://www.w3.org/2000/svg',
    className,
    style: { color, ...style },
    'aria-hidden': true,
    ...props,
  } as const;

  switch (name) {
    /* mail — 이메일 봉투 */
    case 'mail':
      return (
        <svg {...base} fill="none">
          <rect
            x="2"
            y="4"
            width="20"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M2 7.5 12 14l10-6.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    /* hide — 비밀번호 숨기기 (눈 가리기) */
    case 'hide':
      return (
        <svg {...base} fill="none">
          <path
            d="M11.83 9L15 12.16V12C15 11.2044 14.6839 10.4413 14.1213 9.87868C13.5587 9.31607 12.7956 9 12 9H11.83ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.77 9 12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C10.6739 17 9.40215 16.4732 8.46447 15.5355C7.52678 14.5979 7 13.3261 7 12C7 11.21 7.2 10.47 7.53 9.8ZM2 4.27L4.28 6.55L4.73 7C3.08 8.3 1.78 10 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.81 19.08L19.73 22L21 20.73L3.27 3M12 7C13.3261 7 14.5979 7.52678 15.5355 8.46447C16.4732 9.40215 17 10.6739 17 12C17 12.64 16.87 13.26 16.64 13.82L19.57 16.75C21.07 15.5 22.27 13.86 23 12C21.27 7.61 17 4.5 12 4.5C10.6 4.5 9.26 4.75 8 5.2L10.17 7.35C10.74 7.13 11.35 7 12 7Z"
            fill="currentColor"
          />
        </svg>
      );

    /* show — 비밀번호 숨기기 (눈 가리기) */
    case 'show':
      return (
        <svg {...base} fill="none">
          <path
            d="M12 9C11.2044 9 10.4413 9.31607 9.87868 9.87868C9.31607 10.4413 9 11.2044 9 12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12C15 11.2044 14.6839 10.4413 14.1213 9.87868C13.5587 9.31607 12.7956 9 12 9ZM12 17C10.6739 17 9.40215 16.4732 8.46447 15.5355C7.52678 14.5979 7 13.3261 7 12C7 10.6739 7.52678 9.40215 8.46447 8.46447C9.40215 7.52678 10.6739 7 12 7C13.3261 7 14.5979 7.52678 15.5355 8.46447C16.4732 9.40215 17 10.6739 17 12C17 13.3261 16.4732 14.5979 15.5355 15.5355C14.5979 16.4732 13.3261 17 12 17ZM12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z"
            fill="currentColor"
          />
        </svg>
      );

    /* lock — 자물쇠 */
    case 'lock':
      return (
        <svg {...base} fill="none">
          <rect
            x="3"
            y="11"
            width="18"
            height="11"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M7 11V7a5 5 0 0 1 10 0v4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    /* check — 채워진 원 안의 체크마크 */
    case 'check':
      return (
        <svg {...base} fill="currentColor">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.707 7.293a1 1 0 0 0-1.414 0L10 14.586l-1.293-1.293a1 1 0 1 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l6-6a1 1 0 0 0 0-1.414z"
            clipRule="evenodd"
          />
        </svg>
      );

    /* question — 채워진 원 안의 물음표 (ix:question-filled) */
    case 'question':
      return (
        <svg {...base} fill="currentColor">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 15.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-4.25v.75h-2v-1c0-1.378 1.5-1.841 1.5-3a1.5 1.5 0 0 0-3 0H7.5a3.5 3.5 0 0 1 7 0c0 1.724-1.5 2.275-1.5 3.25z"
            clipRule="evenodd"
          />
        </svg>
      );

    /* setting — 설정 톱니바퀴 (icon-park-solid:setting-one) */
    case 'setting':
      return (
        <svg {...base} fill="currentColor">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path
            fillRule="evenodd"
            d="M9.317 2.358a2 2 0 0 1 5.366 0l.44 1.462c.424.144.832.33 1.218.554l1.46-.44a2 2 0 0 1 2.14.864l1.497 2.594a2 2 0 0 1-.359 2.49l-1.105.975c.026.228.026.46 0 .686l1.105.976a2 2 0 0 1 .359 2.49l-1.498 2.594a2 2 0 0 1-2.138.864l-1.46-.44c-.387.224-.795.41-1.219.554l-.44 1.461a2 2 0 0 1-5.366 0l-.44-1.461a7.074 7.074 0 0 1-1.218-.554l-1.46.44a2 2 0 0 1-2.14-.864L2.562 14.01a2 2 0 0 1 .359-2.49l1.105-.976a7.01 7.01 0 0 1 0-.686l-1.105-.975a2 2 0 0 1-.359-2.49L4.06 5.798a2 2 0 0 1 2.138-.864l1.46.44a7.07 7.07 0 0 1 1.219-.554l.44-1.462z"
            clipRule="evenodd"
          />
        </svg>
      );

    /* search — 검색 돋보기 (iconamoon:search) */
    case 'search':
      return (
        <svg {...base} fill="none">
          <circle
            cx="11"
            cy="11"
            r="8"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="m21 21-4.35-4.35"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    /* filter — 필터 (tabler:filter-2) */
    case 'filter':
      return (
        <svg {...base} fill="none">
          <path
            d="M3 6h18M6 12h12M9 18h6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    /* loading — 270도 링 로딩 스피너 (svg-spinners:270-ring) */
    case 'loading':
      return (
        <svg {...base} fill="none">
          <g className="animate-spin" style={{ transformOrigin: '12px 12px' }}>
            <path
              d="M12 3a9 9 0 1 0 6.364 2.636"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      );

    /* no-symbol — 금지 기호 (heroicons:no-symbol-16-solid) */
    case 'no-symbol':
      return (
        <svg {...base} fill="currentColor">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM5.354 6.768A8 8 0 0 0 17.232 18.646L5.354 6.768zm1.414-1.414L18.646 17.232A8 8 0 0 0 6.768 5.354z"
            clipRule="evenodd"
          />
        </svg>
      );

    /* home — 홈 (solar:home-2-bold) */
    case 'home':
      return (
        <svg {...base} fill="currentColor">
          <path
            fillRule="evenodd"
            d="M11.293 2.293a1 1 0 0 1 1.414 0l9 9A1 1 0 0 1 21 13h-1v7a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4h-4v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7H3a1 1 0 0 1-.707-1.707l9-9z"
            clipRule="evenodd"
          />
        </svg>
      );

    /* profile — 사용자/프로필 (iconamoon:profile-fill) */
    case 'profile':
      return (
        <svg {...base} fill="currentColor">
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
          <path d="M20 21a8 8 0 1 0-16 0h16z" />
        </svg>
      );

    /* alert — 알림 벨 (fluent:alert-48-filled) */
    case 'alert':
      return (
        <svg {...base} fill="currentColor">
          <path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22z" />
          <path d="M20 17.17V17l-2-2v-5a6 6 0 0 0-4.8-5.88V3.5a1.2 1.2 0 0 0-2.4 0v.62A6 6 0 0 0 6 10v5l-2 2v.17A1 1 0 0 0 5 19h14a1 1 0 0 0 1-1.83z" />
        </svg>
      );

    /* pencil-ai — AI 교정 펜 (ri:pencil-ai-fill) */
    case 'pencil-ai':
      return (
        <svg {...base} fill="currentColor">
          {/* 펜 본체 */}
          <path d="M15.414 3a2 2 0 0 1 2.828 0l2.829 2.828a2 2 0 0 1 0 2.829L7.243 22H3v-4.243L15.414 3z" />
          {/* AI 반짝이 (sparkle) */}
          <path d="M20 13.5l-.6-1.2-.6 1.2-1.2.6 1.2.6.6 1.2.6-1.2 1.2-.6-1.2-.6z" />
          <path d="M18 9l-.4-.8-.4.8-.8.4.8.4.4.8.4-.8.8-.4-.8-.4z" />
        </svg>
      );

    /* library — 라이브러리/기록 (solar:library-bold-duotone) */
    case 'library':
      return (
        <svg {...base} fill="currentColor">
          {/* 세로 책 1 */}
          <rect x="3" y="3" width="4" height="18" rx="1" />
          {/* 세로 책 2 */}
          <rect x="9" y="3" width="4" height="18" rx="1" />
          {/* 비스듬한 책 */}
          <path d="M15.5 4.5 20.5 6l-4 15-5-1.5 4-15z" />
        </svg>
      );

    /* info — 정보 (ci:info) */
    case 'info':
      return (
        <svg {...base} fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M12 11v5M12 8v.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    /* close-circle — 원 안의 X (No) */
    case 'close-circle':
      return (
        <svg {...base} fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="m15 9-6 6M9 9l6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    /* check-circle — 원 안의 체크마크 (check_2) */
    case 'check-circle':
      return (
        <svg {...base} fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="m7 12 4 4 6-7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return null;
  }
};

export default Icon;
export type { IconProps };
