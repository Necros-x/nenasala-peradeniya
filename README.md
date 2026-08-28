## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Motion / Framer Motion
- Lucide React
- Vercel-ready

## Route groups

### Public

- `/`
- `/courses`
- `/courses/[slug]`
- `/intakes`
- `/instructors`
- `/about`
- `/contact`
- `/faq`
- `/login` — student login only

### Student

- `/student/dashboard`
- `/student/courses`
- `/student/courses/[id]`
- `/student/courses/[courseId]/lesson/[lessonId]`
- `/student/assignments`
- `/student/quizzes`
- `/student/certificates`
- `/student/schedule`
- `/student/announcements`
- `/student/profile`

### Admin

Admin does **not**have a public `/admin` route and there is no admin link on the public website.

The route is server-gated:

```text
/internal/<ADMIN_PORTAL_KEY>/login
/internal/<ADMIN_PORTAL_KEY>/dashboard
```

A wrong access key returns the normal 404 page instead of exposing an “invalid admin key” message.

## Security baseline

The current architecture has separate layers rather than relying on a hidden URL:

1. **Server-only admin URL key** (`ADMIN_PORTAL_KEY`)
2. **Supabase session verification** with `auth.getUser()`
3. **Server-side role guards** for Student and Admin layouts
4. **Admin role comes only from `app_metadata` in this baseline**, never user-editable `user_metadata`
5. **Supabase service-role key is server-only**
6. `src/proxy.ts` refreshes/verifies Supabase auth cookies
7. Database RLS policies are still required and will be designed with the final schema

The hidden admin URL is a secondary barrier, not the authorization mechanism.

## Environment

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PORTAL_KEY=
LOCAL_UI_BYPASS=false
```

Generate a long admin URL key, for example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not prefix `ADMIN_PORTAL_KEY` or `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`.

### Local UI preview before Supabase is connected

For local development only, you can temporarily set:

```env
LOCAL_UI_BYPASS=true
```

The code explicitly refuses this bypass in production (`NODE_ENV === "production"`). The admin URL key is still validated even in local UI preview mode.

## Brand system

The three generated projects now share one palette in `src/app/globals.css`.

Primary brand anchor:

```text
#FF6405 — Nenasala logo orange
```

Supporting colors include warm ivory/off-white surfaces and deep slate typography. The UI intentionally uses orange as an action/highlight color rather than painting every surface orange.

The supplied Nenasala logo is located at:

```text
/public/brand/nenasala-logo.png
```

### Corner geometry

Continue following:

```text
outer radius = inner radius + padding
```

Shared radius tokens are already defined globally.

## What has been migrated

- Public website pages and landing components
- Student dashboard and LMS pages
- Student sidebar/topbar
- Admin dashboard
- Admin student list/registration
- Admin course list
- Shared Nenasala palette
- Supplied logo
- Next.js route structure
- Hidden admin URL gate
- Supabase client/server/admin scaffolding
- Server role guards
- Error and 404 pages

Admin modules that did not exist in the supplied base UI have routes and placeholders ready for implementation:

- Instructors
- Intakes
- Enrollments
- Assignments
- Quizzes
- Announcements
- Messages
- Certificates
- Settings

## Next development phase

Do **not** connect random pages directly to ad-hoc Supabase tables.

The next step should be to define the canonical database model and RLS policies first, then replace mock service functions with Supabase-backed services in this order:

1. Profiles + roles
2. Students / instructors
3. Courses
4. Modules + lessons
5. Intakes
6. Enrollments
7. Lesson progress
8. Assignments + submissions
9. Quizzes + attempts
10. Announcements / notifications
11. Certificates
12. Public website queries

This keeps Public Website, Student LMS, and Admin Portal on one source of truth.