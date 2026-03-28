# Brief 배포 가이드

## 필요한 계정
- GitHub ✅
- Vercel ✅
- Anthropic ✅
- Supabase (신규 가입 필요) — supabase.com 무료

---

## 1. Supabase 세팅

### 프로젝트 생성
1. supabase.com 접속 → New Project
2. 이름: brief, 비밀번호 설정, 지역: Northeast Asia (Seoul)

### 테이블 생성
Supabase 대시보드 → SQL Editor → 아래 쿼리 실행:

```sql
create table usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  seconds integer default 0,
  unique(user_id, date)
);

alter table usage enable row level security;

create policy "Users can manage own usage"
  on usage for all
  using (auth.uid() = user_id);
```

### Google 로그인 설정
1. Supabase → Authentication → Providers → Google → Enable
2. Google Cloud Console (console.cloud.google.com) 접속
3. 새 프로젝트 생성 → APIs & Services → OAuth consent screen 설정
4. Credentials → OAuth 2.0 Client ID 생성
   - 유형: Web application
   - Authorized redirect URIs: https://[YOUR_SUPABASE_URL]/auth/v1/callback
5. Client ID, Client Secret → Supabase Google Provider에 입력

---

## 2. Vercel 환경변수 설정

Vercel 프로젝트 → Settings → Environment Variables:

| 이름 | 값 |
|------|-----|
| ANTHROPIC_API_KEY | sk-ant-... |
| SUPABASE_URL | https://xxx.supabase.co |
| SUPABASE_ANON_KEY | eyJ... (anon public key) |
| SUPABASE_SERVICE_ROLE_KEY | eyJ... (service_role key) |

Supabase 키는: Project Settings → API 에서 확인

---

## 3. GitHub 업로드

1. github.com → 기존 talk-assist 레포에 파일 교체
   또는 새 레포 brief 생성
2. 파일 구조:
   ```
   public/
     index.html
     manifest.json
     sw.js
   api/
     config.js
     explain.js
     summary.js
     suggest.js
     usage.js
   package.json
   ```

---

## 4. Vercel 재배포

환경변수 설정 후 → Deployments → Redeploy

---

## 완료!

yourapp.vercel.app → Chrome으로 접속 → Google 로그인 → 테스트
