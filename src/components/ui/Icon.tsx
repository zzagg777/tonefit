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
  | 'check-circle'
  | 'check-circle-bg'
  | 'log-out'
  | 'arrow-left'
  | 'arrow-right'
  | 'copy'
  | 'x'
  | 'chevron-right';

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
        <svg {...base} fill="none">
          <path
            d="M14.3199 0C15.0344 0 15.6947 0.381189 16.052 0.99998L20.0935 7.99998C20.4508 8.61879 20.4508 9.38121 20.0935 10L16.052 17C15.6947 17.6188 15.0344 18 14.3199 18H6.0414C5.32688 18 4.66663 17.6188 4.30936 17L0.267807 10C-0.0894739 9.38121 -0.0894743 8.61879 0.267807 7.99998L4.30936 0.999981C4.66663 0.38119 5.32688 0 6.0414 0H14.3199ZM10.1807 5.82324C8.42642 5.82333 7.00391 7.24574 7.00391 9C7.00391 10.7543 8.42642 12.1767 10.1807 12.1768C11.935 12.1768 13.3574 10.7543 13.3574 9C13.3574 7.24568 11.935 5.82324 10.1807 5.82324Z"
            fill="currentColor"
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
        <svg {...base} fill="none">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8 7C8 5.93913 8.42143 4.92172 9.17157 4.17157C9.92172 3.42143 10.9391 3 12 3C13.0609 3 14.0783 3.42143 14.8284 4.17157C15.5786 4.92172 16 5.93913 16 7C16 8.06087 15.5786 9.07828 14.8284 9.82843C14.0783 10.5786 13.0609 11 12 11C10.9391 11 9.92172 10.5786 9.17157 9.82843C8.42143 9.07828 8 8.06087 8 7ZM8 13C6.67392 13 5.40215 13.5268 4.46447 14.4645C3.52678 15.4021 3 16.6739 3 18C3 18.7956 3.31607 19.5587 3.87868 20.1213C4.44129 20.6839 5.20435 21 6 21H18C18.7956 21 19.5587 20.6839 20.1213 20.1213C20.6839 19.5587 21 18.7956 21 18C21 16.6739 20.4732 15.4021 19.5355 14.4645C18.5979 13.5268 17.3261 13 16 13H8Z"
            fill="currentColor"
          />
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
          <path
            d="M16.1445 10.0964L6.24451 19.9964H2.00151V15.7534L11.9015 5.85336L16.1445 10.0964ZM15.4375 2.31736C15.625 2.12989 15.8793 2.02458 16.1445 2.02458C16.4097 2.02458 16.664 2.12989 16.8515 2.31736L19.6795 5.14736C19.867 5.33489 19.9723 5.5892 19.9723 5.85436C19.9723 6.11953 19.867 6.37383 19.6795 6.56136L17.5585 8.68136L13.3155 4.43936L15.4375 2.31736ZM3.53051 0.319362C3.56806 0.225117 3.63301 0.144302 3.71698 0.0873682C3.80095 0.0304345 3.90006 0 4.00151 0C4.10296 0 4.20208 0.0304345 4.28604 0.0873682C4.37001 0.144302 4.43496 0.225117 4.47251 0.319362L4.72551 0.931362C5.15021 1.96606 5.95548 2.79853 6.97551 3.25736L7.69351 3.57736C7.78531 3.61984 7.86304 3.6877 7.91751 3.77294C7.97199 3.85817 8.00094 3.95721 8.00094 4.05836C8.00094 4.15952 7.97199 4.25856 7.91751 4.34379C7.86304 4.42902 7.78531 4.49688 7.69351 4.53936L6.93351 4.87736C5.93888 5.32369 5.14755 6.12644 4.71551 7.12736L4.46851 7.69336C4.43006 7.78553 4.36521 7.86426 4.28211 7.91963C4.199 7.97501 4.10137 8.00456 4.00151 8.00456C3.90165 8.00456 3.80402 7.97501 3.72091 7.91963C3.63781 7.86426 3.57296 7.78553 3.53451 7.69336L3.28751 7.12836C2.85544 6.12689 2.0637 5.32373 1.06851 4.87736L0.30851 4.53936C0.216429 4.497 0.138424 4.42913 0.0837436 4.34379C0.029063 4.25845 0 4.15922 0 4.05786C0 3.95651 0.029063 3.85728 0.0837436 3.77193C0.138424 3.68659 0.216429 3.61872 0.30851 3.57636L1.02651 3.25636C2.04673 2.79798 2.85236 1.96587 3.27751 0.931362L3.53051 0.319362Z"
            fill="currentColor"
          />
        </svg>
      );

    /* library — 라이브러리/기록 (solar:library-bold-duotone) */
    case 'library':
      return (
        <svg {...base} fill="none">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8.67184 7.54297H15.3278C18.7018 7.54297 20.3898 7.54297 21.3378 8.52997C22.2858 9.51697 22.0618 11.041 21.6158 14.09L21.1938 16.982C20.8438 19.373 20.6688 20.569 19.7718 21.285C18.8748 22.001 17.5518 22.001 14.9048 22.001H9.09484C6.44884 22.001 5.12484 22.001 4.22784 21.285C3.33084 20.569 3.15584 19.373 2.80584 16.982L2.38384 14.09C1.93684 11.041 1.71384 9.51697 2.66184 8.52997C3.60984 7.54297 5.29784 7.54297 8.67184 7.54297ZM7.99984 18.001C7.99984 17.587 8.37284 17.251 8.83284 17.251H15.1668C15.6268 17.251 15.9998 17.587 15.9998 18.001C15.9998 18.415 15.6268 18.751 15.1668 18.751H8.83284C8.37284 18.751 7.99984 18.415 7.99984 18.001Z"
            fill="currentColor"
          />
          <path
            opacity="0.4"
            d="M8.50995 2H15.4899C15.7229 2 15.8999 2 16.0569 2.015C17.1649 2.124 18.0709 2.79 18.4559 3.687H5.54395C5.92895 2.79 6.83594 2.124 7.94394 2.015C8.09894 2 8.27795 2 8.50995 2Z"
            fill="currentColor"
          />
          <path
            opacity="0.7"
            d="M6.30998 4.72266C4.91998 4.72266 3.77998 5.56266 3.39998 6.67566L3.37598 6.74566C3.77937 6.62912 4.19131 6.54453 4.60798 6.49266C5.68798 6.35466 7.05398 6.35466 8.63998 6.35466H15.532C17.118 6.35466 18.484 6.35466 19.564 6.49266C19.984 6.54666 20.398 6.62566 20.796 6.74566L20.773 6.67566C20.393 5.56166 19.253 4.72266 17.862 4.72266H6.30998Z"
            fill="currentColor"
          />
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
    /* check-circle-bg — 채워진 원 배경 + 흰색 체크마크 (Figma: icon/success) */
    case 'check-circle-bg':
      return (
        <svg {...base} fill="none">
          <circle cx="12" cy="12" r="11" fill="currentColor" />
          <path
            d="m7.5 12 3.5 3.5 5.5-6.5"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    /* log-out — 로그아웃 화살표 */
    case 'log-out':
      return (
        <svg {...base} fill="none">
          <path
            d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M16 17L21 12L16 7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M21 12H9"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      );

    /* arrow-left — 왼쪽 화살표 */
    case 'arrow-left':
      return (
        <svg {...base} fill="none">
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    /* arrow-right — 오른쪽 화살표 */
    case 'arrow-right':
      return (
        <svg {...base} fill="none">
          <path
            d="M5 12h14M12 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    /* copy — 복사 */
    case 'copy':
      return (
        <svg {...base} fill="none">
          <rect
            x="9"
            y="9"
            width="13"
            height="13"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    /* x — 닫기/삭제 */
    case 'x':
      return (
        <svg {...base} fill="none">
          <path
            d="M18 6 6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    /* chevron-right — 오른쪽 꺾쇠 */
    case 'chevron-right':
      return (
        <svg {...base} fill="none">
          <path
            d="m9 18 6-6-6-6"
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
