# 부자해커스쿨 ERP

## 설치 및 실행

### 1. 환경변수 설정
`.env.local` 파일에 본인 값 입력:
```
NEXT_PUBLIC_SUPABASE_URL=https://yxxrtsgqqwflvvehklbm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_key_입력
SUPABASE_SERVICE_KEY=여기에_service_key_입력
JWT_SECRET=랜덤_문자열_입력
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. Vercel 배포
- GitHub에 push → Vercel에서 자동 배포
- Vercel 환경변수에 위 값들 동일하게 입력

## 기본 계정
- 관리자: admin / 첫 로그인 시 비밀번호 설정
- 직원: staff / 첫 로그인 시 비밀번호 설정
