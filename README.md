![CI](https://github.com/zzagg777/tonefit/actions/workflows/ci.yml/badge.svg)

# ToneFit
사무직 사회초년생을 위한, 수신자 & 목적 기반 한국어 비즈니스 커뮤니케이션 교정 서비스


## 배포 URL
https://tonefit-six.vercel.app


## 기술 스택
언어     : TypeScript
프레임워크 : React 19
번들러    : Vite 8
스타일    : Tailwind CSS v4
상태관리   : Zustand v5
서버상태  : React Query v5 (TanStack Query)
라우팅    : React Router v6
Form : React Hook Form, Zod
코드 품질 : ESLint + Prettier + Husky
CI / CD : GitHub Actions / AWS S3 + CloudFront
HTTP 클라이언트 : Axios


## 폴더 구조
src/
├── App.tsx
├── main.tsx
├── index.css
├── api/            # API 호출 함수 모음
├── assets/         # 이미지, 폰트 등 정적 파일
├── components/     # 공통 컴포넌트 (Button, Modal, Input...)
├── constants/      # 상수값 (API URL, 라우팅 경로, 에러 메시지 등)
├── hooks/          # 커스텀 훅
├── pages/          # 페이지 단위 컴포넌트
├── queries/        # React Query 훅 모음
├── schemas/        # Zod 스키마 정의
├── stores/         # Zustand 전역 상태
├── styles/         # 전역 스타일
├── test/           # 테스트 파일
├── types/          # TypeScript 타입 정의
└── utils/          # 유틸 함수


## 실행 방법
npm install # 의존성 설치
npm run dev # 개발 서버
npm run build # 프로덕션 빌드
npm run test # 테스트 실행


## 브랜치 전략
- `main` : 배포용
- `develop` : 개발 통합
- `feature/CFHO-00-작업내용` : 기능 개발


## 커밋 컨벤션
feat: 새로운 기능 추가 
fix: 버그 수정 
chore: 설정, 패키지 등 기타 작업 
refactor: 코드 구조 개선 
style: 코드 포맷 변경 
docs: 문서 수정 
test: 테스트 코드 
remove: 파일 또는 코드 삭제 


## 배포 방법 (AWS S3 + CloudFront)

### 배포 흐름
`package.json`의 `version`이 변경된 커밋이 `main`에 push되면 자동 배포됩니다.

```
push to main (package.json 변경 감지)
  └─ CI (lint → test → build 검증)
  └─ version 변경 여부 확인
       └─ 변경됨 → build → S3 sync → CloudFront 캐시 무효화
       └─ 변경 없음 → 배포 생략
```

### 수동 배포
GitHub Actions 탭 → `Deploy to AWS` → `Run workflow`

### 필요한 GitHub Secrets
| Secret | 설명 |
|--------|------|
| `AWS_ROLE_ARN` | OIDC로 assume할 IAM Role ARN |
| `AWS_REGION` | 배포 리전 (예: `ap-northeast-2`) |
| `S3_BUCKET_NAME` | 정적 파일을 업로드할 S3 버킷 이름 |
| `CLOUDFRONT_DISTRIBUTION_ID` | 캐시 무효화 대상 CloudFront 배포 ID |

### IAM Role 신뢰 관계 설정
GitHub OIDC 공급자(`token.actions.githubusercontent.com`)를 통한 인증을 사용합니다.
IAM Role의 신뢰 정책에 아래 조건을 추가하세요.

```json
{
  "StringLike": {
    "token.actions.githubusercontent.com:sub": "repo:ToneFit-Project/ToneFit_FE:*"
  }
}
```

### 캐싱 전략
- `index.html` : `no-cache` (항상 최신 버전 제공)
- 해시가 붙은 정적 파일 (`*.js`, `*.css` 등) : `max-age=31536000, immutable` (1년 캐시)


## 환경 변수
VITE_API_URL=http://123.123.123.123:8080