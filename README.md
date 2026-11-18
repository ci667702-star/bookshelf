# 📚 북모먼트 (BookMoment)

> 오늘 읽은 한 페이지가 나만의 책장이 됩니다.

나만의 온라인 책장을 만들고, 읽은 책을 기록하고, 친구들과 독서 생활을 나누는 감성 독서 SNS입니다.
React + Node.js(Express) + PostgreSQL(Prisma)로 만든 **실제로 동작하는** 풀스택 웹 애플리케이션입니다.

---

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| 회원가입 · 로그인 | 이메일/비밀번호, 프로필 이미지(선택), 로그인 상태 유지(30일), 로그아웃, 비밀번호 변경, 회원 탈퇴 |
| 나의 책장 | 여러 책장 생성 · 수정 · 삭제, 공개/비공개, 대표 이미지, 테마. 책은 **진짜 책장처럼** 칸마다 책등이 꽂혀 보임 |
| 책 등록 | 제목 · 저자 · 출판사 · 표지(업로드/URL) · 페이지 · 상태(읽고 싶은 책/읽는 중/완독/중단) · 별점 · 한 줄 감상 · 날짜 |
| 독서 마라톤 | `누적 높이(cm) = 누적 페이지 × 0.01`. 완독=전체 페이지, 읽는 중/중단=읽은 페이지. 같은 책 중복 집계 없음. 줄자로 재는 책탑 시각화 |
| 독서 달력 | 월별 달력, 읽은 날엔 표지 폴라로이드, 완독한 날엔 빨간 핀(실로 연결), 날짜별 기록 · 월간 통계 · 목표 달성률 |
| 독후감 | 작성 · 수정 · 삭제, 공개/비공개, 좋아요, 댓글, 블로그형 상세 화면 |
| 공유 책장 | 초대 코드(8자리 무작위) 참여, 참여자 목록 · 참여자별 통계, 공동 통계, 공유 독후감, 나가기, 소유자의 참여자 관리 |
| 책장 꾸미기 | 테마 6종, 배경색/배경 이미지, 선반 디자인 4종, 책 배치 3종(책등/표지/폴라로이드), 스티커 8종 · 장식 5종 드래그 배치, 실시간 미리보기, DB 저장 |
| 홈(대시보드) | 오늘의 인사, 통계 카드, 지금 읽는 책, 요약 위젯(마라톤 · 달력 · 책장 · 공유 책장 · 최근 독후감 · 둘러보기), 최근 등록한 책 |
| 둘러보기 | 다른 사람들의 공개 책장 · 인기 독후감 · 최근 공유된 책 (`/explore`) |
| 검색 | 책 제목 · 작가 · 닉네임 · 공개 책장 · 공개 독후감을 종류별로 |
| 알림 | 내 독후감의 좋아요 · 댓글, 공유 책장 참여 알림 |

## 디자인

- 레트로 PC 감성의 **앱형 화면**: 상단 앱 바(검색 · 알림 · 프로필) + 화면마다 하나의 창 + 하단 탭 바(시작 메뉴 · 홈 · 책장 · 등록 · 달력 · 독후감 · 시계)
- 배경은 메인 배경색(#FFF9F2) 단색, 창 제목줄은 팔레트 파스텔 색
- 책장은 **평면 2D 일러스트**(단색 + 잉크 외곽선), 독서 달력은 크라프트지 위 핀으로 꽂은 폴라로이드
- 한 화면에 몰아넣지 않도록 홈은 요약 위젯만, 독서 마라톤 · 둘러보기는 별도 화면, 상세 화면은 탭으로 분리

## 기술 스택

- **Frontend**: React 19, Vite, React Router, Tailwind CSS 4, TanStack Query, Axios, lucide-react, Pretendard · Galmuri(픽셀) · 나눔손글씨 펜
- **Backend**: Node.js, Express 5, Prisma 6, PostgreSQL 16, bcrypt, jsonwebtoken, Zod, Helmet, express-rate-limit, multer
- **Infra(로컬)**: Docker Compose (PostgreSQL)

## 프로젝트 구조

```
.
├─ docker-compose.yml          # PostgreSQL 16 (호스트 포트 5433)
├─ package.json                # npm workspaces + 공통 스크립트
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma         # 데이터 모델
│  │  ├─ migrations/           # 마이그레이션
│  │  └─ seed.js               # 개발용 테스트 데이터
│  ├─ scripts/smoke-test.js    # API 통합 스모크 테스트 (67개 검증)
│  ├─ src/
│  │  ├─ controllers/          # 요청 처리
│  │  ├─ routes/               # REST 라우트
│  │  ├─ middlewares/          # 인증 · CSRF · 검증 · 업로드 · 에러 · rate limit
│  │  ├─ services/             # 독서 집계 · 접근 권한 · 알림 · 꾸미기
│  │  ├─ utils/                # env · JWT · 날짜 · 초대 코드 · 직렬화 · Zod 조각
│  │  ├─ app.js
│  │  └─ server.js
│  └─ .env.example
└─ frontend/
   └─ src/
      ├─ components/           # ui · book(책장, 책탑, 표지) · calendar · review · shelf
      ├─ pages/                # 14개 + 검색 · 프로필 · 404
      ├─ layouts/              # 사이드바/하단 탭 레이아웃, 인증 레이아웃
      ├─ hooks/  contexts/  services/  utils/  styles/
      ├─ App.jsx
      └─ main.jsx
```

## 설치 및 실행

필요한 것: **Node.js 20.19 이상**, **Docker** (PostgreSQL 용)

```bash
# 1) 의존성 설치 (frontend + backend 한 번에)
npm install

# 2) PostgreSQL 실행
npm run db:up

# 3) 환경변수 파일 만들기 — JWT_SECRET 은 꼭 긴 무작위 문자열로 바꿔 주세요
cp backend/.env.example backend/.env

# 4) 마이그레이션 적용
npm run db:migrate

# 5) (선택) 데모 데이터 넣기
npm run db:seed

# 6) 개발 서버 실행 — API :4000, 웹 :5173
npm run dev
```

브라우저에서 <http://localhost:5173> 을 열면 됩니다. (프론트엔드 개발 서버가 `/api`, `/uploads` 를 백엔드로 프록시하므로 쿠키 인증이 같은 출처에서 동작합니다.)

JWT_SECRET 생성 예시:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 데모 계정 (seed 실행 시)

| 이메일 | 비밀번호 | 비고 |
| --- | --- | --- |
| demo@bookmoment.dev | bookmoment123 | 책장 2개, 책 10권, 독후감, 공유 책장 소유자 |
| mina@bookmoment.dev | bookmoment123 | 공유 책장 참여자 |
| juno@bookmoment.dev | bookmoment123 | 공유 책장 참여자 |

공유 책장 초대 코드: `BOOKCLUB` (비공개 · 토요 독서 모임), `KNOVEL26` (공개 · 한국 소설 같이 읽기)

> seed 는 데모 계정 3개만 지우고 다시 만듭니다. 직접 가입한 계정의 데이터는 건드리지 않습니다.

### 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | API + 웹 개발 서버 동시 실행 |
| `npm run db:up` / `db:down` | PostgreSQL 컨테이너 시작 / 중지 |
| `npm run db:migrate` | 마이그레이션 생성 · 적용 (개발) |
| `npm run db:deploy` | 마이그레이션 적용 (배포) |
| `npm run db:seed` | 데모 데이터 |
| `npm run db:reset` | DB 초기화 후 마이그레이션 + seed |
| `npm run test:smoke` | 실행 중인 API 에 67개 통합 검증 실행 (테스트 계정을 만들고 스스로 삭제) |
| `npm run build` | 프론트엔드 빌드 (`frontend/dist`) |
| `npm start` | 백엔드 실행 — `frontend/dist` 가 있으면 같은 서버에서 웹도 제공 |

### 배포(단일 서버) 예시

```bash
npm run build
npm run db:deploy
NODE_ENV=production COOKIE_SECURE=true npm start
```

## REST API

모든 요청은 `/api` 아래, 상태를 바꾸는 요청은 `X-Requested-With: XMLHttpRequest` 헤더가 필요합니다.

| 그룹 | 엔드포인트 |
| --- | --- |
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` |
| Users | `GET /users/:id` · `PUT /users/me` · `PUT /users/me/password` · `DELETE /users/me` |
| Bookshelf | `GET/POST /bookshelves` · `GET/PUT/DELETE /bookshelves/:id` |
| Decoration | `GET/PUT /bookshelves/:id/decoration` |
| Books | `GET/POST /books` · `GET/PUT/DELETE /books/:id` |
| Reading | `GET/POST /reading` · `PUT/DELETE /reading/:id` · `GET/POST /reading/:id/logs` · `DELETE /reading/logs/:logId` · `GET /reading/calendar` · `GET /reading/marathon` |
| Reviews | `GET/POST /reviews` · `GET/PUT/DELETE /reviews/:id` · `POST /reviews/:id/like` · `GET/POST /reviews/:id/comments` · `DELETE /reviews/:id/comments/:commentId` |
| Shared | `GET/POST /shared-bookshelves` · `POST /shared-bookshelves/join` · `GET/PUT/DELETE /shared-bookshelves/:id` · `DELETE /:id/leave` · `POST /:id/invite-code` · `DELETE /:id/members/:userId` · `POST /:id/items` · `DELETE /:id/items/:itemId` |
| 기타 | `GET /dashboard` · `GET /search?q=` · `GET /notifications` · `POST /notifications/read` · `POST /uploads` |

오류 응답 형식: `{ "error": { "message": "...", "fields": { "필드": "메시지" } } }` + 적절한 HTTP 상태 코드(400/401/403/404/409/413/429/500).

## 데이터 모델

`User`, `Bookshelf`, `Book`, `ReadingRecord`, `ReadingLog`, `Review`, `SharedBookshelf`, `SharedBookshelfMember`, `Like`, `Comment`, `BookshelfDecoration` 에 더해
`SharedBookshelfItem`(공유 책장에 꽂힌 책 = 참여자의 독서 기록 참조), `Notification`(알림)을 추가했습니다. 모든 관계에 외래 키 · 인덱스 · 유니크 제약이 있습니다. 자세한 내용은 [backend/prisma/schema.prisma](backend/prisma/schema.prisma).

### 독서 마라톤 집계 규칙

- 기록은 `(사용자, 책)` 당 하나(`@@unique([userId, bookId])`), 같은 제목+저자의 책은 사용자당 한 번만 등록 가능 → **중복 집계 불가**
- 기록이 기여하는 페이지: 완독 = 전체 페이지, 읽는 중/중단 = 현재 페이지, 읽고 싶은 책 = 0
- 날짜별 `ReadingLog` 합계가 항상 위 값과 같도록 서비스 레이어에서 동기화 → 달력 · 이번 달 독서량 · 마라톤 수치가 서로 어긋나지 않음
- 공유 책장은 참여자의 독서 기록을 **참조**만 하므로 공유해도 페이지가 두 번 세지지 않음

## 보안

- 비밀번호 bcrypt(12 rounds) 해싱, 평문 저장 없음 · 로그인 실패 시 이메일 존재 여부를 노출하지 않음(타이밍 보호 포함)
- JWT 를 **httpOnly · SameSite=Lax** 쿠키에 저장(JS 로 읽을 수 없음), 비밀번호 변경 시 `tokenVersion` 으로 기존 토큰 무효화
- 상태 변경 요청에 커스텀 헤더 요구(CSRF 방어) + CORS 허용 출처 제한
- 모든 입력 Zod 검증, Prisma 파라미터 바인딩(SQL Injection 방지), React 출력 이스케이프 + Helmet CSP(XSS 방지)
- 이미지 주소는 `/uploads/...` 또는 http(s) 만 허용(`javascript:` 차단)
- 업로드: jpg/png/webp/gif 만, 5MB 제한, **파일 시그니처(매직 바이트) 검사**, SVG 차단, `nosniff` 헤더
- 비공개 책장 · 비공개 독후감 · 비공개 공유 책장은 서버에서 404 로 차단(존재 여부도 숨김)
- 다른 사용자의 데이터 수정 · 삭제는 서버에서 403
- 초대 코드: `crypto.randomBytes` 기반 8자리(헷갈리는 문자 제외), 중복 검사, 참여 시도 rate limit
- 로그인 · 가입 rate limit, 비밀 값은 모두 환경변수

## 참고

- `npm audit` 의 high 경고 7건은 개발 도구(Prisma CLI 의 설정 병합 라이브러리, Vite 의 glob 매칭)에서 나오며 런타임 서버 코드에는 포함되지 않습니다.
- 표지 이미지가 없는 책은 제목으로 만든 표지와 책등이 자동으로 그려집니다.
