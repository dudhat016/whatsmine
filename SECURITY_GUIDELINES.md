# Application Security Guidelines & Checklist

This document outlines the security architecture, coding standards, and compliance checklist for the application across Frontend, Backend, and Operational layers.

---

## 📋 Security Checklist

### 1. Frontend Security
- [ ] **Use HTTPS Everywhere**: Prevent eavesdropping and MITM attacks via TLS/HTTPS and HSTS.
- [ ] **Input Validation & Sanitization**: Sanitize user input and prevent XSS (Cross-Site Scripting).
- [ ] **No Sensitive Data in Browser Storage**: Do not store tokens, credentials, or secrets in `localStorage`/`sessionStorage`.
- [ ] **CSRF Protection**: Ensure all state-changing HTTP requests include valid Anti-CSRF tokens.
- [ ] **Never Expose API Keys in Client Code**: Third-party credentials must remain strictly on the backend.

### 2. Backend Security
- [ ] **Authentication Fundamentals**: Secure session management, strong password hashing (Bcrypt/Argon2id), 2FA support.
- [ ] **Authorization & Scope Verification**: Verify user permissions, roles, and tenant/workspace boundaries on every action.
- [ ] **API Endpoint Protection**: Protect all API endpoints with Sanctum tokens, session guards, and ability checks.
- [ ] **SQL Injection Prevention**: Use Eloquent ORM and parameterized query bindings; avoid raw SQL string concatenation.
- [ ] **Security Headers & CSP**: Configure `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Content-Security-Policy`.
- [ ] **DDoS & Abuse Protection**: Employ rate limiting, burst throttling, and cloud WAF/CDN mitigations.

### 3. Practical Security Habits
- [ ] **Keep Dependencies Updated**: Regularly audit and update NPM and Composer packages.
- [ ] **Proper Error Handling**: Silence verbose stack traces and database schemas in production (`APP_DEBUG=false`).
- [ ] **Secure Cookies**: Enforce `HttpOnly`, `Secure`, and `SameSite` flags on all session cookies.
- [ ] **File Upload Security**: Validate MIME types, sanitize file names, enforce file size limits, and isolate storage.
- [ ] **Rate Limiting**: Protect login, registration, password resets, and high-cost API endpoints from brute force.

---

## 🛡️ Detailed Standards & Implementation

### 1. Frontend Security

#### 1.1 HTTPS & Traffic Encryption
- All web traffic is redirected to HTTPS in production.
- HSTS (`Strict-Transport-Security`) headers prevent protocol downgrade attacks.

#### 1.2 Input Validation & XSS Prevention
- **React Escaping**: React automatically escapes strings embedded in JSX, mitigating most XSS risks.
- **Dangerous HTML**: Avoid `dangerouslySetInnerHTML`. If HTML rendering is mandatory (e.g. email templates or blog content), sanitize the content with DOMPurify first:
  ```jsx
  import DOMPurify from 'dompurify';
  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
  ```

#### 1.3 Client Storage Rules
- **Allowed in `localStorage` / `sessionStorage`**: Non-sensitive UI states (e.g. active tab, theme mode, cart draft IDs, collapsed sidebar state).
- **Forbidden in Browser Storage**: Passwords, API secrets, private encryption keys, access tokens, and sensitive PII.

#### 1.4 CSRF Protection
- Handled automatically by Laravel and Inertia.js.
- For custom fetch/Axios calls, always include the CSRF token from the meta tag:
  ```javascript
  headers: {
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
      'Accept': 'application/json',
  }
  ```

#### 1.5 API Key Safety
- Never prefix third-party private secrets with `VITE_` in `.env`.
- Any external service (e.g. OpenAI, Anthropic, Gemini, Stripe, WhatsApp Cloud API, Twilio) must be accessed via backend controller proxies.

---

### 2. Backend Security

#### 2.1 Authentication & Passwords
- Passwords are automatically hashed with Bcrypt or Argon2id via Laravel's `Hash` facade:
  ```php
  'password' => Hash::make($request->password);
  ```
- Two-factor authentication (2FA) and email verification options are available for accounts.

#### 2.2 Multi-Tenant Authorization & Tenant Scoping
- Always scope queries to the authenticated user's active workspace:
  ```php
  // Correct: Scoped to workspace
  $funnel = $request->user()->currentWorkspace->funnels()->findOrFail($id);

  // Avoid: Unscoped global lookup
  $funnel = Funnel::findOrFail($id);
  ```
- Use route middleware for role enforcement:
  - `EnsureAdminRole`
  - `EnsureClientScope`
  - `RequirePermission`
  - `EnsureSuperAdmin`

#### 2.3 SQL Injection Prevention
- Always use Eloquent or query builder parameter bindings:
  ```php
  // Safe: Parameterized
  User::where('email', $email)->first();
  DB::select('SELECT * FROM users WHERE email = ?', [$email]);

  // Unsafe: Never concatenate raw input
  DB::select("SELECT * FROM users WHERE email = '$email'");
  ```

#### 2.4 HTTP Security Headers
- Managed globally in `App\Http\Middleware\SecureHeaders`:
  - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy`: Dynamically allows trusted script, style, font, and frame sources.
  - `Cache-Control: no-store`: Applied on authenticated responses to prevent browser back-button session caching.

---

### 3. Practical Security Habits

#### 3.1 Dependency Audits
- Run dependency checks regularly during development and CI pipelines:
  ```bash
  composer audit
  npm audit
  ```

#### 3.2 Secure Cookies (`config/session.php`)
- Ensure session configurations maintain secure flags:
  ```php
  'secure' => env('SESSION_SECURE_COOKIE', true),
  'http_only' => true,
  'same_site' => 'lax',
  ```

#### 3.3 File Upload Restrictions
- When handling uploaded files:
  1. Validate file extension and MIME type via FormRequest:
     ```php
     $request->validate([
         'avatar' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'], // Max 5MB
     ]);
     ```
  2. Generate randomized file names on the server (never trust original file name).
  3. Store uploads on dedicated disks or S3 buckets with non-executable permissions.

#### 3.4 Rate Limiting & Throttling
- Apply rate limits on sensitive endpoints in routes (`routes/web.php` & `routes/api.php`):
  ```php
  Route::middleware(['throttle:login'])->post('/login', [LoginController::class, 'store']);
  Route::middleware(['throttle:60,1'])->group(function () {
      // General API routes
  });
  ```

---

## 🚀 Pre-Deployment Security Verification Checklist

Before deploying changes to production, verify:
- [ ] `APP_DEBUG` is set to `false` in production `.env`.
- [ ] `APP_ENV` is set to `production`.
- [ ] `SESSION_SECURE_COOKIE` is set to `true`.
- [ ] All database migrations use parameterized indexes and foreign key constraints.
- [ ] `npm run build` succeeds without warnings or bundle-leakage of environment secrets.
