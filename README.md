# 📚 북모먼트 (BookMoment)

> 오늘 읽은 한 페이지가 나만의 책장이 됩니다.

나만의 온라인 책장을 만들고, 읽은 책을 기록하고, 친구들과 독서 생활을 나누는 귀여운 독서 SNS예요.
React · Node.js(Express) · PostgreSQL(Prisma)로 만든 **실제로 동작하는** 풀스택 웹 앱이에요.

**목차**

- [주요 기능](#주요-기능)
- [화면 디자인](#화면-디자인)
- [기술 스택과 폴더 구조](#기술-스택과-폴더-구조)
- [내 컴퓨터에서 실행하기](#내-컴퓨터에서-실행하기)
- [배포하기 (서버에 올리기)](#배포하기-서버에-올리기)
- [API 목록](#api-목록)
- [데이터 구조와 집계 규칙](#데이터-구조와-집계-규칙)
- [보안](#보안)
- [테스트](#테스트)

---

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| 회원가입 · 로그인 | 이메일 · 비밀번호 가입, 프로필 사진(선택), 로그인 상태 유지(30일), 로그아웃, 비밀번호 변경, 회원 탈퇴 |
| 나의 책장 | 책장 여러 개 만들기 · 수정 · 삭제, 공개 / 비공개, 대표 이미지, 테마. 책등이 칸마다 꽂힌 2D 책장 그림 |
| 책 등록 | 책 검색 · 바코드로 표지 · 제목 · 저자 · 출판사 자동 채우기, 또는 직접 입력. 페이지, 독서 상태(읽고 싶은 책 / 읽는 중 / 완독 / 중단), 별점, 한 줄 감상, 날짜 |
| 바코드로 책 등록 | 휴대폰 카메라로 책 뒤 ISBN 바코드를 찍으면 바로 검색. 카메라가 없으면 바코드 사진 올리기 · ISBN 직접 입력 |
| 독서 마라톤 | `누적 높이(cm) = 누적 페이지 × 0.01`. 완독은 전체 페이지, 읽는 중 · 중단은 읽은 페이지만 쌓여요. 같은 책은 두 번 세지 않아요. 줄자로 재는 책탑 그림 |
| 독서 타이머 | 시작하면 화면 아래에 시계가 떠 있어요(새로고침해도 유지). 멈출 때 읽은 쪽수를 넣으면 달력에 시간과 함께 기록 |
| 독서 달력 | 월별 달력. 읽은 날엔 작은 표지, 다 읽은 날엔 빨간 핀으로 꽂은 폴라로이드와 손글씨 날짜. 날짜별 기록 · 월간 통계 · 목표 달성률 |
| 독후감 | 쓰기 · 수정 · 삭제, 공개 / 비공개, 좋아요, 댓글 |
| 문장 수집 | 책에서 마음에 남은 구절을 쪽수 · 메모와 함께 저장. 포스트잇 모양으로 붙고 공개 / 비공개 선택 |
| 공유 책장 | 8자리 초대 코드로 친구와 같은 책장 쓰기. 참여자 목록, 참여자별 통계, 공동 통계, 공유 독후감, 나가기, 소유자의 참여자 관리 |
| 친구 팔로우 | 다른 독자 팔로우, 팔로워 · 팔로잉 목록, 친구 소식(완독 · 새 책 · 독후감 · 문장) |
| 배지 & 스티커 | 첫 완독 · 10cm 돌파 · 7일 연속 독서 등 9개 배지. 배지를 얻으면 꾸미기 스티커(딸기 · 편지 · 네잎클로버 · 무지개 · 달 · 왕관)가 열려요 |
| 책장 꾸미기 | 테마 6종, 배경색 · 배경 이미지, 선반 4종, 책 배치 3종(책등 · 표지 · 폴라로이드), 스티커 · 장식 드래그, 실시간 미리보기, 저장 |
| 이미지로 저장 | 내 책장 · 이달의 독서 결산을 그림 한 장(가로 1080px)으로 저장 · 공유 |
| 홈 · 둘러보기 · 검색 | 홈 요약 위젯, 다른 사람의 공개 책장 · 인기 독후감 · 최근 공유된 책, 책 · 작가 · 닉네임 · 책장 · 독후감 검색 |
| 알림 | 내 독후감의 좋아요 · 댓글, 공유 책장 참여, 새 팔로워 |
| 앱으로 설치 | 휴대폰 홈 화면에 아이콘을 추가해 앱처럼 전체 화면으로 실행 (PWA) |

## 화면 디자인

- 레트로 PC 느낌의 **앱형 화면**: 위쪽 앱 바(검색 · 알림 · 프로필), 화면마다 창 하나, 아래쪽 탭 바(시작 메뉴 · 홈 · 책장 · 등록 · 달력 · 독후감 · 시계)
- 넓은 화면(1280px 이상)에서는 양옆에 작은 창이 붙어요. 왼쪽은 내 정보 · 내 책장 · 이번 달 달력 · 책탑, 오른쪽은 지금 읽는 책 · 독서 목표 · 오늘의 문장 · 친구 소식
- 색: 배경 `#FFF9F2`, 카드 `#FFFFFF`, 핑크 `#F5D8D8`, 브라운 `#A47762`, 베이지 `#F2E8DC`, 글자 `#51443D`, 그린 `#DDE8D7`
- 글꼴: 본문 Pretendard, 제목 · 숫자 Galmuri(픽셀), 폴라로이드 날짜 나눔손글씨 펜
- 책장은 단색 + 잉크 외곽선의 평면 2D 그림, 달력은 크라프트지 위에 핀으로 꽂은 폴라로이드

## 기술 스택과 폴더 구조

- **프론트엔드**: React 19, Vite, React Router, Tailwind CSS 4, TanStack Query, Axios, lucide-react, html-to-image, ZXing(바코드)
- **백엔드**: Node.js, Express 5, Prisma 6, PostgreSQL 16, bcrypt, jsonwebtoken, Zod, Helmet, express-rate-limit, multer
- **실행 환경**: Docker Compose (개발용 DB, 배포용 앱 + DB)

```
.
├─ docker-compose.yml          # 개발용 PostgreSQL (내 컴퓨터 포트 5433)
├─ docker-compose.prod.yml     # 배포용: 앱 + PostgreSQL 한 번에
├─ Dockerfile                  # 배포용 앱 이미지 (API 서버가 웹 화면까지 제공)
├─ .env.production.example     # 배포용 설정값 예시
├─ package.json                # npm workspaces + 공통 명령어
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma         # 데이터 구조
│  │  ├─ migrations/           # DB 변경 이력
│  │  └─ seed.js               # 데모 데이터
│  ├─ scripts/smoke-test.js    # API 통합 테스트 (86개 검사)
│  ├─ src/
│  │  ├─ controllers/          # 요청 처리
│  │  ├─ routes/               # API 주소
│  │  ├─ middlewares/          # 로그인 확인 · CSRF · 입력 검사 · 업로드 · 오류 · 요청 횟수 제한
│  │  ├─ services/             # 독서 집계 · 접근 권한 · 알림 · 꾸미기 · 배지 · 책 검색
│  │  ├─ utils/                # 환경변수 · JWT · 날짜 · 초대 코드 등
│  │  ├─ app.js
│  │  └─ server.js
│  └─ .env.example             # 개발용 설정값 예시
└─ frontend/
   ├─ public/                  # 파비콘 · 앱 아이콘 · manifest · 서비스 워커
   ├─ scripts/generate-icons.mjs  # 앱 아이콘 PNG 만들기
   └─ src/
      ├─ components/           # ui · book(책장 · 책탑 · 표지 · 타이머 · 바코드) · calendar · review · shelf · social · share
      ├─ pages/                # 화면들
      ├─ layouts/              # 앱 바 · 탭 바 · 양옆 창, 로그인 화면 틀
      ├─ hooks/  contexts/  services/  utils/  styles/
      ├─ App.jsx
      └─ main.jsx
```

---

## 내 컴퓨터에서 실행하기

필요한 것: **Node.js 20.19 이상**, **Docker Desktop** (PostgreSQL 실행용)

```bash
# 1) 패키지 설치 (프론트엔드 + 백엔드 한 번에)
npm install

# 2) PostgreSQL 실행 (Docker Desktop 이 켜져 있어야 해요)
npm run db:up

# 3) 설정 파일 만들기 — 안의 JWT_SECRET 은 꼭 긴 무작위 값으로 바꿔 주세요
cp backend/.env.example backend/.env

# 4) DB 표 만들기
npm run db:migrate

# 5) (선택) 데모 데이터 넣기
npm run db:seed

# 6) 개발 서버 실행 — API :4000, 웹 :5173
npm run dev
```

브라우저에서 <http://localhost:5173> 을 열면 돼요.

JWT_SECRET 만들기:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 데모 계정 (5번을 실행했을 때)

| 이메일 | 비밀번호 | 내용 |
| --- | --- | --- |
| demo@bookmoment.dev | bookmoment123 | 책장 2개, 책 10권, 독후감, 공유 책장 주인 |
| mina@bookmoment.dev | bookmoment123 | 공유 책장 참여자 |
| juno@bookmoment.dev | bookmoment123 | 공유 책장 참여자 |

공유 책장 초대 코드: `BOOKCLUB` (비공개 · 토요 독서 모임), `KNOVEL26` (공개 · 한국 소설 같이 읽기)

> 데모 데이터 명령은 데모 계정 3개만 지우고 다시 만들어요. 직접 가입한 계정은 건드리지 않아요.

### 책 검색 API 키 (선택 · 무료)

교보문고는 공개 API 가 없어서 아래 서비스를 써요. `backend/.env` 에 키를 넣으면 **카카오 → 네이버 → Google Books → Open Library** 순서로 검색해요.
키가 없어도 검색은 되지만(Open Library) **한국 책은 거의 안 나오니 카카오나 네이버 키를 추천**해요. 둘 다 무료이고 카드 등록이 필요 없어요.

| 서비스 | 발급 방법 | 넣을 곳 |
| --- | --- | --- |
| 카카오 책 검색 | [developers.kakao.com](https://developers.kakao.com) → 내 애플리케이션 → 앱 추가 → 앱 키의 *REST API 키* | `KAKAO_REST_API_KEY` |
| 네이버 책 검색 | [developers.naver.com](https://developers.naver.com) → Application → 애플리케이션 등록 → 사용 API *검색*, 환경 *WEB* (서비스 URL 은 내 주소) | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` |
| Google Books | Google Cloud 콘솔의 Books API 키 (선택, 요청 제한 완화) | `GOOGLE_BOOKS_API_KEY` |

키는 서버에만 있고 브라우저로는 넘어가지 않아요. 키를 바꾼 뒤에는 백엔드를 다시 켜 주세요.

### 자주 쓰는 명령어

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | API + 웹 개발 서버 같이 실행 |
| `npm run db:up` / `npm run db:down` | 개발용 PostgreSQL 켜기 / 끄기 |
| `npm run db:migrate` | DB 구조 변경 만들기 · 적용 (개발) |
| `npm run db:seed` | 데모 데이터 넣기 |
| `npm run db:reset` | DB 비우고 처음부터 다시 (데모 데이터 포함) |
| `npm run test:smoke` | 켜져 있는 API 에 86개 통합 검사 실행 |
| `npm run build` | 웹 화면 빌드 (`frontend/dist`) |
| `npm start` | 배포 모드로 서버 실행 (빌드된 웹 화면까지 제공) |
| `npm run prod:up` / `prod:down` / `prod:logs` / `prod:seed` | 배포용 Docker 실행 / 중지 / 로그 / 데모 데이터 |

---

## 배포하기 (서버에 올리기)

### 어떻게 돌아가나요?

```
사용자 브라우저 ──https──▶ Caddy (또는 Nginx)        ← 인증서 자동 발급 · https 처리
                            │ 127.0.0.1:4000
                            ▼
                    app 컨테이너 (Node.js)           ← API + 빌드된 웹 화면을 같이 제공
                     │            │                     시작할 때 DB 변경(마이그레이션) 자동 적용
                     ▼            ▼
             db 컨테이너     uploads 볼륨             ← 사용자가 올린 사진 보관
            (PostgreSQL)
```

- 앱 하나가 API 와 웹 화면을 같이 제공해서, 주소 하나로 모두 동작해요.
- **https 가 꼭 필요해요.** 로그인 쿠키 보안(`COOKIE_SECURE=true`), 바코드 카메라, 앱 설치(PWA)는 모두 https 에서만 동작해요.
- DB 와 업로드 사진은 Docker 볼륨에 저장돼서, 앱을 다시 빌드 · 재시작해도 사라지지 않아요.

### 준비물

| 항목 | 설명 |
| --- | --- |
| 리눅스 서버 1대 | Ubuntu 22.04 / 24.04 권장. 메모리 **2GB 이상** 권장(빌드할 때 메모리를 꽤 써요), 디스크 10GB 이상. AWS Lightsail, 네이버 클라우드, Oracle Cloud 무료 서버 등 어디든 OK |
| 도메인 | 예: `bookmoment.example.com`. 도메인 관리 화면에서 **A 레코드**를 서버 공인 IP 로 연결 |
| 열어 둘 포트 | **22**(SSH), **80**(http · 인증서 발급), **443**(https). 클라우드 방화벽(보안 그룹)에서 열어 주세요. 4000번은 열지 않아도 돼요 |

### 방법 1. Docker 로 배포하기 (추천)

#### 1단계 — 서버에 Docker 설치

```bash
# 서버에 SSH 로 접속한 뒤
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # sudo 없이 docker 쓰기
exit                            # 한 번 나갔다가 다시 접속하면 적용돼요
```

다시 접속한 뒤 `docker compose version` 이 나오면 준비 완료예요.

#### 2단계 — 코드 받기

```bash
git clone https://github.com/ci667702-star/bookshelf.git bookmoment
cd bookmoment
```

> 비공개 저장소라면 GitHub 의 *Settings → Developer settings → Personal access tokens* 에서 토큰을 만들어 비밀번호 대신 쓰거나, 서버에 SSH 키를 등록해 주세요.

#### 3단계 — 설정 파일(.env.production) 만들기

```bash
cp .env.production.example .env.production

# 무작위 값 두 개 만들기 → 아래 nano 에서 붙여 넣기
openssl rand -hex 24   # POSTGRES_PASSWORD 용
openssl rand -hex 48   # JWT_SECRET 용

nano .env.production   # 값 채우고 Ctrl+O, Enter, Ctrl+X 로 저장
```

| 설정 | 넣을 값 | 설명 |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | `openssl rand -hex 24` 결과 | DB 비밀번호. **영문 · 숫자만** 써 주세요(특수문자는 DB 주소를 깨뜨려요) |
| `JWT_SECRET` | `openssl rand -hex 48` 결과 | 로그인 토큰 서명 키. 바꾸면 모든 사용자가 다시 로그인해야 해요 |
| `CLIENT_ORIGIN` | `https://bookmoment.example.com` | 내 서비스 주소(https 포함, 끝에 `/` 없이). 다른 주소에서 이 API 를 부를 때 허용할 목록이에요. 여러 개면 쉼표로 구분 |
| `COOKIE_SECURE` | `true` | https 로 서비스하면 꼭 `true` |
| `APP_TIMEZONE` | `Asia/Seoul` | "오늘", "이번 달" 계산 기준 |
| `MAX_UPLOAD_MB` | `5` | 사진 업로드 최대 용량 |
| `KAKAO_REST_API_KEY` 등 | (선택) | 책 검색 키. [책 검색 API 키](#책-검색-api-키-선택--무료) 참고. 네이버는 서비스 URL 에 배포 주소도 등록하세요 |
| `APP_BIND` / `APP_PORT` | `127.0.0.1` / `4000` | 앱이 열리는 곳. 그대로 두면 서버 안에서만 열리고 Caddy 가 https 로 연결해요 |
| `RDB_DATABASE` / `RDB_USERNAME` | (비우면 `bookmoment`) | DB 이름 · 사용자 이름. **처음 실행하기 전에만** 정하세요. 이미 만든 DB 에는 나중에 바꿔도 적용되지 않아요 |
| `RDB_URL` | (보통 비워 둠) | 외부 DB(예: AWS RDS)를 쓸 때만 전체 주소. 비워 두면 함께 뜨는 db 컨테이너를 써요 |

> `.env.production` 은 git 에 올라가지 않아요. 비밀번호와 키가 들어 있으니 다른 사람과 공유하지 마세요.

#### 4단계 — 앱 실행

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

처음에는 이미지를 만드느라 몇 분 걸려요. 끝나면 확인해 보세요.

```bash
# 두 컨테이너가 모두 running, app 은 (healthy) 가 나오면 성공
docker compose --env-file .env.production -f docker-compose.prod.yml ps

# 서버 안에서 응답 확인 → {"ok":true}
curl http://127.0.0.1:4000/api/health

# 로그 보기 (Ctrl+C 로 나가기)
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f app
```

> 서버에 Node.js 가 있다면 같은 일을 `npm run prod:up`, `npm run prod:logs` 로 짧게 할 수 있어요.

#### 5단계 — 도메인 연결하고 https 켜기 (Caddy)

Caddy 는 Let's Encrypt 인증서를 **자동으로 발급 · 갱신**해 줘서 가장 간단해요.

```bash
sudo apt update && sudo apt install -y caddy     # Ubuntu 24.04 기준
sudo nano /etc/caddy/Caddyfile
```

Caddyfile 내용을 아래처럼 바꿔요 (도메인은 내 것으로).

```
bookmoment.example.com {
    encode gzip
    request_body {
        max_size 10MB
    }
    reverse_proxy 127.0.0.1:4000
}
```

```bash
sudo systemctl reload caddy
```

1~2분 뒤 `https://bookmoment.example.com` 에 들어가 보세요. 회원가입이 되면 배포 완료예요.

> Ubuntu 22.04 처럼 `apt install caddy` 가 안 되면 [Caddy 공식 설치 안내](https://caddyserver.com/docs/install)의 Debian/Ubuntu 방법을 따라 주세요.

<details>
<summary>Caddy 대신 Nginx + certbot 을 쓰고 싶다면</summary>

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/bookmoment
```

```nginx
server {
    server_name bookmoment.example.com;
    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bookmoment /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d bookmoment.example.com   # https 인증서 발급 + 자동 갱신
```

</details>

#### 6단계 — (선택) 데모 데이터

체험용 계정이 필요하면 넣을 수 있어요. **실제 서비스에서는 넣지 않는 걸 추천해요.**

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec app npx prisma db seed
```

### 업데이트하기

코드를 고친 뒤 GitHub 에 올렸다면, 서버에서:

```bash
cd ~/bookmoment
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

DB 구조가 바뀌었으면 앱이 켜질 때 자동으로 적용돼요(`prisma migrate deploy`). 데이터와 업로드 사진은 그대로 남아요.

### 백업과 복원

```bash
# DB 백업 → 오늘 날짜 파일로 저장
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  pg_dump -U bookmoment bookmoment > backup-$(date +%F).sql

# 업로드 사진 백업
docker run --rm -v bookmoment_uploads:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .

# DB 복원 (주의: 지금 데이터 위에 덮어써요)
cat backup-2026-11-19.sql | docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  psql -U bookmoment bookmoment
```

> 볼륨 이름(`bookmoment_uploads`)은 폴더 이름을 따라가요. `docker volume ls` 로 확인할 수 있어요.
> `RDB_USERNAME` / `RDB_DATABASE` 를 바꿨다면 위 명령의 `-U bookmoment bookmoment` 를 `-U 사용자이름 DB이름` 으로 바꿔 주세요.
> 매일 자동 백업을 원하면 `crontab -e` 에 위 백업 명령을 등록해 두세요.

### 자주 쓰는 운영 명령

| 하고 싶은 일 | 명령 (`dc` = `docker compose --env-file .env.production -f docker-compose.prod.yml`) |
| --- | --- |
| 상태 보기 | `dc ps` |
| 로그 보기 | `dc logs -f app` |
| 다시 시작 | `dc restart app` |
| 끄기 (데이터는 유지) | `dc down` |
| DB 에 직접 접속 | `dc exec db psql -U bookmoment bookmoment` |

> ⚠️ `dc down -v` 는 **DB 와 업로드 사진까지 모두 지워요.** 백업 없이 쓰지 마세요.

### 배포 버전을 내 컴퓨터에서 미리 보기

https 없이 확인만 해 보려면 `.env.production` 에서 아래처럼 바꾸고 4단계 명령을 실행하세요.

```
CLIENT_ORIGIN=http://localhost:18080
COOKIE_SECURE=false
APP_PORT=18080
```

그다음 <http://localhost:18080> 을 열면 돼요. (Windows 는 일부 포트가 예약돼 있어서, 포트가 막히면 다른 번호를 쓰세요.)

### 방법 2. Docker 없이 배포하기 (Node + PostgreSQL 직접 설치)

```bash
# 1) Node.js 22 와 PostgreSQL 설치 (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs postgresql

# 2) DB 와 사용자 만들기
sudo -u postgres psql -c "CREATE USER bookmoment WITH PASSWORD '영문숫자비밀번호';"
sudo -u postgres psql -c "CREATE DATABASE bookmoment OWNER bookmoment;"

# 3) 코드 받고 설치 · 빌드
git clone https://github.com/ci667702-star/bookshelf.git bookmoment && cd bookmoment
npm ci
npm run build

# 4) 설정 파일 — backend/.env.example 을 복사해서 채우기
cp backend/.env.example backend/.env
#   NODE_ENV=production
#   DATABASE_URL="postgresql://bookmoment:영문숫자비밀번호@localhost:5432/bookmoment?schema=public"
#   JWT_SECRET=...  CLIENT_ORIGIN=https://내도메인  COOKIE_SECURE=true

# 5) DB 표 만들기 → 서버 실행 (PM2 로 꺼지지 않게)
npm run db:deploy
sudo npm install -g pm2
cd backend && pm2 start src/server.js --name bookmoment && pm2 save && pm2 startup
```

그다음 [5단계](#5단계--도메인-연결하고-https-켜기-caddy)처럼 Caddy 나 Nginx 로 https 를 붙이면 돼요. 업로드 사진은 `backend/uploads` 폴더에 저장되니 백업할 때 같이 챙겨 주세요.

### 배포 후 확인할 것

- [ ] `https://내도메인` 으로 들어가지고 주소창에 자물쇠가 보인다
- [ ] 회원가입 → 로그아웃 → 다시 로그인이 된다 (안 되면 아래 문제 해결 참고)
- [ ] 책 등록, 사진 업로드, 독후감 쓰기가 된다
- [ ] 휴대폰에서 열어 「시작 → 앱으로 설치」가 보인다, 바코드 카메라가 켜진다
- [ ] 백업 명령을 한 번 실행해 파일이 생기는지 확인했다

### 문제 해결

| 증상 | 확인할 것 |
| --- | --- |
| 로그인이 되자마자 풀려요 | `COOKIE_SECURE=true` 인데 http 로 접속했는지 확인하세요. https 로 접속하거나, 테스트라면 `false` 로 바꾸세요 |
| "요청이 너무 많아요" 가 떠요 | 로그인 · 가입은 15분에 30번까지예요. 잠시 뒤 다시 시도하세요 |
| "데이터베이스에 연결할 수 없어요" | `dc ps` 로 db 가 healthy 인지, `POSTGRES_PASSWORD` 에 특수문자가 없는지 확인하세요 |
| 앱이 계속 재시작돼요 | `dc logs app` 로 오류를 보세요. `JWT_SECRET` 이 32자보다 짧으면 켜지지 않아요 |
| 사진 업로드가 413 오류예요 | Caddy 의 `max_size`, Nginx 의 `client_max_body_size` 를 늘려 주세요 |
| 바코드 카메라가 안 켜져요 | https 주소인지, 브라우저에서 카메라 권한을 허용했는지 확인하세요 |
| 한국 책이 검색에 안 나와요 | 카카오 또는 네이버 키를 넣고 `dc up -d` 로 다시 시작하세요 |
| 빌드하다 서버가 멈춰요 | 메모리가 부족해요. 2GB 이상 서버를 쓰거나 스왑을 추가하세요 |
| 빌드 중 `npm ci` 가 `ETIMEDOUT` · 무한 대기로 멈춰요 | 학교 · 회사망처럼 MTU 가 작은 네트워크일 수 있어요. `/etc/docker/daemon.json` 에 `{ "mtu": 1400 }` 을 넣고 `sudo systemctl restart docker` 한 뒤 다시 빌드하세요. (이 Dockerfile 은 `apt-get` 을 쓰지 않아서 http(80) 이 막힌 곳에서도 빌드돼요) |

---

## API 목록

모든 주소는 `/api` 아래에 있어요. 데이터를 바꾸는 요청에는 `X-Requested-With: XMLHttpRequest` 헤더가 필요해요(CSRF 방어).

| 분류 | 주소 |
| --- | --- |
| 로그인 | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` |
| 사용자 | `GET /users/:id` · `PUT /users/me` · `PUT /users/me/password` · `DELETE /users/me` · `POST /users/:id/follow` · `GET /users/:id/follows?type=` |
| 책장 | `GET/POST /bookshelves` · `GET/PUT/DELETE /bookshelves/:id` · `GET/PUT /bookshelves/:id/decoration` |
| 책 | `GET/POST /books` · `GET/PUT/DELETE /books/:id` |
| 독서 기록 | `GET/POST /reading` · `PUT/DELETE /reading/:id` · `GET/POST /reading/:id/logs` · `DELETE /reading/logs/:logId` · `GET /reading/calendar` · `GET /reading/marathon` |
| 타이머 | `GET /reading/timer` · `POST /reading/:id/timer` · `POST /reading/timer/stop` · `DELETE /reading/timer` |
| 독후감 | `GET/POST /reviews` · `GET/PUT/DELETE /reviews/:id` · `POST /reviews/:id/like` · `GET/POST /reviews/:id/comments` · `DELETE /reviews/:id/comments/:commentId` |
| 문장 | `GET/POST /quotes` · `PUT/DELETE /quotes/:id` |
| 공유 책장 | `GET/POST /shared-bookshelves` · `POST /shared-bookshelves/join` · `GET/PUT/DELETE /shared-bookshelves/:id` · `DELETE /:id/leave` · `POST /:id/invite-code` · `DELETE /:id/members/:userId` · `POST /:id/items` · `DELETE /:id/items/:itemId` |
| 친구 · 배지 | `GET /feed` · `GET /badges` · `POST /badges/seen` |
| 기타 | `GET /dashboard` · `GET /search?q=` · `GET /book-search?q=` · `GET /book-search/pages?isbn=` · `GET /notifications` · `POST /notifications/read` · `POST /uploads` · `GET /image-proxy?url=` · `GET /health` |

오류 응답 모양: `{ "error": { "message": "...", "fields": { "항목": "메시지" } } }` 와 알맞은 상태 코드(400 / 401 / 403 / 404 / 409 / 413 / 429 / 500 / 503).

## 데이터 구조와 집계 규칙

`User`, `Bookshelf`, `Book`, `ReadingRecord`, `ReadingLog`, `Review`, `SharedBookshelf`, `SharedBookshelfMember`, `Like`, `Comment`, `BookshelfDecoration` 에 더해
`SharedBookshelfItem`(공유 책장에 꽂힌 책), `Notification`(알림), `Quote`(문장), `Follow`(팔로우), `UserBadge`(배지), `ReadingSession`(진행 중인 타이머)이 있어요.
모든 관계에 외래 키 · 인덱스 · 중복 방지 제약이 걸려 있어요. 자세한 건 [backend/prisma/schema.prisma](backend/prisma/schema.prisma) 를 보세요.

**독서 마라톤 집계 규칙**

- 독서 기록은 `(사용자, 책)` 마다 하나뿐이고, 같은 제목 + 저자의 책은 한 번만 등록돼요 → 같은 책이 두 번 세지지 않아요.
- 쌓이는 페이지: 완독 = 전체 페이지, 읽는 중 · 중단 = 지금까지 읽은 페이지, 읽고 싶은 책 = 0
- 날짜별 기록(`ReadingLog`)의 합계가 항상 위 값과 같도록 맞춰서, 달력 · 이번 달 독서량 · 마라톤 숫자가 서로 어긋나지 않아요.
- 공유 책장은 각자의 독서 기록을 가리키기만 해서, 공유해도 페이지가 두 번 세지지 않아요.

## 보안

- 비밀번호는 bcrypt(12회)로 암호화해서 저장. 로그인 실패 시 이메일이 있는지 없는지 알려 주지 않아요.
- 로그인 토큰(JWT)은 **httpOnly · SameSite=Lax 쿠키**에 저장(자바스크립트로 읽을 수 없음). 비밀번호를 바꾸면 다른 기기의 로그인은 끊겨요.
- 데이터를 바꾸는 요청엔 전용 헤더 필요(CSRF 방어), 허용한 주소에서만 요청 가능(CORS).
- 모든 입력은 Zod 로 검사, Prisma 로 SQL 인젝션 방지, React 출력 이스케이프 + Helmet 보안 헤더(CSP)로 XSS 방지.
- 업로드: jpg · png · webp · gif 만, 5MB 제한, **파일 내용(시그니처)까지 검사**, SVG 차단.
- 비공개 책장 · 독후감 · 공유 책장 · 문장은 서버에서 막고, 존재 여부도 숨겨요(404). 남의 데이터 수정 · 삭제는 403.
- 초대 코드는 암호학적 무작위 8자리, 로그인 · 가입 · 초대 코드 · 책 검색에 요청 횟수 제한.
- 표지 이미지 프록시는 도서 표지 사이트만 허용해서 내부망 접근(SSRF)을 막아요.
- 잠긴 꾸미기 스티커는 화면뿐 아니라 서버에서도 막아요.
- 비밀번호 · 키는 모두 환경변수로 관리하고 git 에 올리지 않아요.

## 테스트

```bash
# 개발 서버(npm run dev)가 켜진 상태에서
npm run test:smoke

# 배포 버전에 돌리려면 주소를 지정
API_URL=http://localhost:18080 node backend/scripts/smoke-test.js
```

테스트 계정 2개를 만들어 회원가입 · 권한 · 마라톤 계산 · 초대 코드 · 업로드 검사 · 문장 · 팔로우 · 배지 · 타이머 등 **86개 항목**을 확인하고, 끝나면 계정을 스스로 지워요.
짧은 시간에 여러 번 돌리면 로그인 요청 제한(15분에 30번)에 걸려 마지막 탈퇴 단계가 실패할 수 있어요. 15분 뒤 다시 돌리면 돼요.

## 참고

- `npm audit` 의 경고는 개발 도구(Prisma CLI 설정 라이브러리, Vite 파일 검색)에서 나오며, 실제 서비스 화면 코드에는 들어가지 않아요.
- 표지 이미지가 없는 책은 제목으로 만든 표지와 책등이 자동으로 그려져요.
- 앱 아이콘을 바꾸려면 `frontend/scripts/generate-icons.mjs` 의 색 · 모양을 고친 뒤 `node frontend/scripts/generate-icons.mjs` 를 실행하세요.
