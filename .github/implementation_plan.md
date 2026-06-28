# Implementation Plan: Viáney's Bakery

---

## Directory Structure

```
vianeysBakery/
├── app/
│   ├── globals.css
│   ├── layout.tsx              ← Server Component — auth check, MUI + AdminProvider wrappers
│   ├── page.tsx                ← Server Component — fetches config, renders <PageSections>
│   ├── admin/
│   │   ├── page.tsx            ← Admin dashboard (protected)
│   │   └── login/
│   │       └── page.tsx        ← MUI login form
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts
│       ├── upload/
│       │   └── route.ts        ← POST multipart/form-data → storage adapter
│       ├── config/
│       │   └── route.ts        ← GET (public) / PUT (admin-only) site config
│       └── images/
│           ├── route.ts        ← GET image list
│           └── delete/
│               └── route.ts    ← DELETE single image
├── components/
│   ├── NextLink.tsx            ← 'use client' next/link re-export (Next.js v16 MUI fix)
│   ├── PageSections.tsx        ← 'use client' — owns edit-mode config switching
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── FeaturedGallery.tsx
│   │   ├── GallerySection.tsx  ← MUI Tabs + Tailwind image grid
│   │   ├── PricingSection.tsx
│   │   ├── HowToOrderSection.tsx
│   │   ├── AboutSection.tsx
│   │   └── ContactSection.tsx
│   └── admin/
│       ├── EditModeBar.tsx     ← MUI Fab + Snackbar
│       ├── EditableText.tsx    ← MUI TextField (edit) / plain span (view)
│       ├── EditableImage.tsx   ← image + hover overlay + opens ImagePicker
│       └── ImagePicker.tsx     ← MUI Dialog — existing images + upload new
├── lib/
│   ├── admin-context.tsx       ← 'use client' AdminProvider + useAdmin hook
│   ├── config/
│   │   ├── types.ts            ← SiteConfig TypeScript interfaces
│   │   ├── defaults.ts         ← defaultConfig constant
│   │   ├── reader.ts           ← getConfig()
│   │   └── writer.ts           ← saveConfig()
│   └── storage/
│       ├── types.ts            ← StorageAdapter interface
│       ├── local.ts            ← LocalStorageAdapter (fs/promises)
│       ├── blob.ts             ← BlobStorageAdapter (@vercel/blob)
│       └── index.ts            ← getStorageAdapter() factory
├── data/
│   └── config.json             ← gitignored; local dev seed data
├── public/
│   └── uploads/                ← gitignored; local dev images
├── auth.ts                     ← NextAuth v5 config
├── theme.ts                    ← 'use client' MUI createTheme()
├── middleware.ts               ← NextAuth route protection
├── next.config.ts
└── .env.local.example
```

---

## Phase 1: Project Foundation

**Install command:**
```bash
npm install @vercel/blob next-auth@beta bcryptjs @mui/material @mui/material-nextjs @emotion/react @emotion/styled @emotion/cache @mui/icons-material yet-another-react-lightbox
npm install -D @types/bcryptjs
```

**`.env.local.example`** — document all vars with descriptions:
```
STORAGE_PROVIDER=local
NEXTAUTH_SECRET=          # generate: openssl rand -base64 32
ADMIN_USERNAME=           # e.g. vianeysadmin
ADMIN_PASSWORD_HASH=      # generate: node -e "const b=require('bcryptjs'); b.hash('yourpassword',12).then(console.log)"
# Production only (leave blank for local dev):
BLOB_READ_WRITE_TOKEN=
BLOB_STORE_ID=
```

**`.gitignore` additions:**
```
public/uploads/
data/config.json
```

**`theme.ts`** shape:
```ts
'use client';
import { createTheme } from '@mui/material/styles';
export default createTheme({
  cssVariables: true,                    // prevents SSR color-scheme flicker
  typography: { fontFamily: 'var(--font-geist-sans)' },
  palette: {
    primary:   { main: '#b5804e' },      // warm bakery brown
    secondary: { main: '#f5e6d3' },      // soft cream
  },
});
```

**`app/layout.tsx`** wrapping order (innermost first):
```
children
  → <AdminProvider isAdmin={isAdmin}>    ← 'use client', holds edit state
  → <ThemeProvider theme={theme}>        ← 'use client', MUI
  → <AppRouterCacheProvider options={{ enableCssLayer: true }}>   ← MUI SSR cache
  → <body>
```
The layout calls `await auth()` (Server Component) to get the session and passes `isAdmin={!!session}` to `AdminProvider`.

> **Why `enableCssLayer: true`?** This puts all MUI styles inside `@layer mui`. Since Tailwind
> v4 uses anonymous (unlayered) styles, Tailwind utilities will always win specificity
> conflicts with MUI — exactly what we want for custom bakery styling.

**`components/NextLink.tsx`:**
```ts
'use client';
export { default } from 'next/link';
// Usage: <Button component={NextLink} href="/path">
// Required in Next.js v16 — passing next/link directly to MUI component prop throws an error
```

---

## Phase 2: Storage Abstraction

**`lib/storage/types.ts`** — exact interface:
```ts
export interface UploadResult { url: string; pathname: string; }
export interface ListItem    { url: string; pathname: string; size?: number; uploadedAt?: Date; }

export interface StorageAdapter {
  upload(pathname: string, body: Buffer | Blob | File, contentType?: string): Promise<UploadResult>;
  delete(urlOrPathname: string): Promise<void>;
  list(prefix?: string): Promise<ListItem[]>;
}
```

**`lib/storage/local.ts`** implementation notes:
- `upload`: sanitize pathname (`replace(/[^a-zA-Z0-9._-]/g, '_')`), write to `public/uploads/<pathname>` via `fs/promises`, return `{ url: '/uploads/<pathname>', pathname }`
- `delete`: extract filename from URL path, call `fs.unlink`; silently ignore `ENOENT`
- `list`: `fs.readdir('public/uploads')`, `fs.stat` each file, map to `{ url: '/uploads/<name>', pathname: name, size, uploadedAt }`

**`lib/storage/blob.ts`** implementation notes:
- `upload`: `put(pathname, body, { access: 'public', contentType, addRandomSuffix: false })`
- `delete`: `del(urlOrPathname)`
- `list`: `list({ prefix })` — `@vercel/blob` returns `{ blobs: [{url, pathname, size, uploadedAt}] }`

**`lib/storage/index.ts`** — singleton factory (cached after first call):
```ts
let _adapter: StorageAdapter | null = null;
export function getStorageAdapter(): StorageAdapter {
  if (!_adapter) {
    _adapter = process.env.STORAGE_PROVIDER === 'local'
      ? new LocalStorageAdapter()
      : new BlobStorageAdapter();
  }
  return _adapter;
}
```

---

## Phase 3: Config Management

**`lib/config/types.ts`** — full data model:
```ts
export interface GalleryImage    { id: string; url: string; alt: string; featured: boolean; }
export interface GalleryCategory { id: string; name: string; images: GalleryImage[]; }

export interface PricingItem  { id: string; name: string; description: string; priceRange: string; }
export interface OrderStep    { id: string; stepNumber: number; title: string; description: string; }

export interface HeroContent    { headline: string; subtext: string; ctaText: string; imageUrl: string; }
export interface AboutContent   { headline: string; body: string; imageUrl: string; }
export interface ContactContent { phone: string; email: string; instagram: string; facebook: string; hours: string; location: string; }

export interface SiteConfig {
  siteName: string;
  hero: HeroContent;
  featuredImageUrls: string[];            // subset shown on homepage above full gallery
  gallery: { categories: GalleryCategory[] };
  pricing: { headline: string; items: PricingItem[] };
  howToOrder: { headline: string; steps: OrderStep[] };
  about: AboutContent;
  contact: ContactContent;
  lastUpdated: string;                    // ISO timestamp — set on every saveConfig()
}
```

**`lib/config/defaults.ts`** — export a `defaultConfig: SiteConfig` with placeholder bakery content for all fields (used as fallback when no config exists yet).

**`lib/config/reader.ts`** key logic:
- Local: `JSON.parse(await fs.readFile(path.join(cwd, 'data/config.json'), 'utf-8'))` — catch `ENOENT` and return `defaultConfig`
- Blob: `list({ prefix: 'config.json', limit: 1 })` → if found: `fetch(blobs[0].url, { next: { revalidate: 60 } }).then(r => r.json())` → if not found: return `defaultConfig`

**`lib/config/writer.ts`** key logic:
- Always set `config.lastUpdated = new Date().toISOString()` before writing
- Local: `fs.mkdir('data/', { recursive: true })` then `fs.writeFile`
- Blob: `put('config.json', JSON.stringify(config, null, 2), { access: 'public', contentType: 'application/json', allowOverwrite: true })`
- After blob write: call `revalidatePath('/')` from `next/cache` to bust the homepage cache

---

## Phase 4: Authentication

**`auth.ts`** shape:
```ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Credentials({
    credentials: { username: {}, password: { type: 'password' } },
    async authorize({ username, password }) {
      if (username !== process.env.ADMIN_USERNAME) return null;
      const valid = await bcrypt.compare(password as string, process.env.ADMIN_PASSWORD_HASH!);
      return valid ? { id: '1', name: 'Admin' } : null;
    },
  })],
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
});
```

**`middleware.ts`:**
```ts
import { auth } from './auth';
export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== '/admin/login')
    return Response.redirect(new URL('/admin/login', req.url));
});
export const config = { matcher: ['/admin/:path*'] };
```

**`app/api/auth/[...nextauth]/route.ts`:**
```ts
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```

**`app/admin/login/page.tsx`** — client component with:
- MUI `Card` centered on page, MUI `TextField` for username + password, MUI `Button` type submit
- On submit: `await signIn('credentials', { username, password, redirectTo: '/admin' })`
- Show MUI `Alert` if `searchParams.error` is present (NextAuth appends `?error=CredentialsSignin` on failure)

---

## Phase 5: API Routes

> All routes that touch the filesystem (`/api/upload`, `/api/config`) must declare
> `export const runtime = 'nodejs'` at the top of the file.

**`POST /api/upload`** contract:
- Request: `multipart/form-data` with `file: File` + optional `folder: string` (e.g. `gallery/weddings`)
- Auth check: `const session = await auth(); if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })`
- Validate content-type: must be `image/jpeg | image/png | image/webp | image/gif | image/avif`
- Validate size: max 10 MB (`file.size > 10 * 1024 * 1024`)
- Pathname: `` `${folder ?? 'uploads'}/${Date.now()}-${sanitize(file.name)}` ``
- Response: `{ url: string, pathname: string }`

**`GET /api/config`** — no auth required, returns full `SiteConfig` JSON

**`PUT /api/config`** contract:
- Auth required
- Body: full `SiteConfig` object
- Basic validation before saving (non-empty headline, valid structure)
- Calls `saveConfig(body)` — sets `lastUpdated` and calls `revalidatePath('/')`
- Response: `{ ok: true, lastUpdated: string }`

**`GET /api/images`** contract:
- Optional query: `?prefix=gallery/weddings`
- No auth required (images are publicly accessible)
- Response: `ListItem[]`

**`DELETE /api/images/delete`** contract:
- Auth required
- Body: `{ url: string }`
- Response: `204 No Content`

---

## Phase 6: Customer-Facing Pages

**`app/page.tsx`** (Server Component):
```ts
const [config, session] = await Promise.all([getConfig(), auth()]);
return <PageSections initialConfig={config} isAdmin={!!session} />;
```

**`components/PageSections.tsx`** (`'use client'`):
- Receives `initialConfig: SiteConfig` and `isAdmin: boolean`
- Calls `useAdmin()` to get `{ editMode, workingConfig }`
- Resolves: `const config = (editMode && workingConfig) ? workingConfig : initialConfig`
- Renders all 7 sections passing their slice of `config` as props
- Also renders `<EditModeBar />` (only visible when `isAdmin`)

> **SSR note:** Even though section components are `'use client'`, Next.js still
> server-renders them because they receive props from a Server Component parent
> (`app/page.tsx`). Marking them `'use client'` only enables client-side interactivity
> (context reads, event handlers) — it does not disable SSR.

**Section component prop signatures:**
```ts
HeroSection:        { data: HeroContent }
FeaturedGallery:    { imageUrls: string[] }
GallerySection:     { categories: GalleryCategory[] }
PricingSection:     { headline: string; items: PricingItem[] }
HowToOrderSection:  { headline: string; steps: OrderStep[] }
AboutSection:       { data: AboutContent }
ContactSection:     { data: ContactContent }
```

**`GallerySection`** internal structure:
- MUI `Tabs` + one `Tab` per category — tab value = `category.id`
- `useState` for `activeTab`
- Active category's images in Tailwind responsive grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`)
- Each image wrapped in `<EditableImage>` (no-op in view mode)
- `yet-another-react-lightbox`: opens on image click in view mode only

**`app/globals.css`** — define bakery brand tokens using Tailwind v4 `@theme`:
```css
@theme {
  --color-bakery-brown: #b5804e;
  --color-bakery-cream: #f5e6d3;
  --color-bakery-dark:  #3a2a1a;
}
```

---

## Phase 7: Admin Inline Editing (WYSIWYG)

### State Flow

```
Admin logs in
  → layout.tsx detects session → passes isAdmin=true to AdminProvider
  → EditModeBar Fab appears (bottom-right corner)

Admin clicks "Edit"
  → enterEditMode() fires
  → fetches fresh config from GET /api/config
  → sets workingConfig = fresh config
  → sets editMode = true
  → PageSections now renders from workingConfig
  → all EditableText / EditableImage components become interactive

Admin edits text
  → EditableText onChange → calls section-specific updater (e.g. updateHero({ headline: val }))
  → workingConfig updated in context (immutable spread)
  → UI reflects change immediately (optimistic)

Admin clicks image overlay
  → ImagePicker Dialog opens
  → Loads existing images from GET /api/images
  → Admin selects or uploads → onImageChange(url) fires
  → workingConfig updated with new image URL

Admin clicks "Save"
  → saveChanges() → PUT /api/config with full workingConfig
  → On success: revalidatePath('/') called server-side, Snackbar success shown, exitEditMode()
  → On failure: Snackbar error shown, editMode stays active

Admin clicks "Discard"
  → discardChanges() → workingConfig reset to null, editMode = false
  → PageSections falls back to initialConfig (server-rendered data)
```

### `lib/admin-context.tsx` — full interface

```ts
interface AdminContextValue {
  isAdmin: boolean;
  editMode: boolean;
  workingConfig: SiteConfig | null;
  isSaving: boolean;
  enterEditMode: () => Promise<void>;
  exitEditMode: () => void;
  updateHero: (patch: Partial<HeroContent>) => void;
  updateFeaturedImages: (urls: string[]) => void;
  updateGalleryCategory: (categoryId: string, patch: Partial<GalleryCategory>) => void;
  updatePricing: (patch: Partial<SiteConfig['pricing']>) => void;
  updateHowToOrder: (patch: Partial<SiteConfig['howToOrder']>) => void;
  updateAbout: (patch: Partial<AboutContent>) => void;
  updateContact: (patch: Partial<ContactContent>) => void;
  saveChanges: () => Promise<void>;
  discardChanges: () => void;
}
```

Typed section-specific updaters (vs. a generic dot-notation path setter) keep the context fully type-safe and prevent runtime path errors.

### Component Props & Behaviour

**`EditableText`** props:
```ts
{ value: string; onChange: (val: string) => void; multiline?: boolean; className?: string }
```
- View mode: `<span className={className}>{value}</span>`
- Edit mode: MUI `TextField` with `variant="standard"`, subtle dashed outline on hover only, `fullWidth`

**`EditableImage`** props:
```ts
{ src: string; alt: string; onImageChange: (url: string) => void; className?: string; width: number; height: number }
```
- Always renders `next/image`
- Edit mode: `position: relative` wrapper + hover overlay with MUI `IconButton` + `PhotoCameraIcon`; click opens `ImagePicker`

**`ImagePicker`** props:
```ts
{ open: boolean; onClose: () => void; onSelect: (url: string) => void }
```
- MUI `Dialog` (fullWidth, maxWidth="md")
- On open: fetches `GET /api/images`, shows Tailwind 4-col image grid
- Click any image → calls `onSelect(url)` and closes
- "Upload New" MUI `Button` → hidden `<input type="file" accept="image/*">` → `POST /api/upload` → MUI `LinearProgress` while uploading → auto-calls `onSelect` with returned URL

**`EditModeBar`** behaviour:
- View mode: MUI `Fab` fixed bottom-right, color="primary", label "Edit"
- Edit mode: MUI `Box` fixed bottom-right with `Button` "Save" + outlined `Button` "Discard"
- MUI `Snackbar` + `Alert severity="success"` on save; `Alert severity="error"` on failure
- Both buttons disabled while `isSaving = true`; "Save" shows MUI `CircularProgress` inline

**`app/admin/page.tsx`** dashboard:
- MUI `Grid` layout with stat `Card`s: image count, last updated timestamp
- MUI `Button` "Open Site Editor" → links to `/` (edit mode activates there)
- MUI `Button` "Sign Out" → calls `signOut({ redirectTo: '/' })`

---

## Phase 8: Polish & Deployment Prep

**`next.config.ts`** final shape:
```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL('https://*.public.blob.vercel-storage.com/**'),
      // local /uploads/ paths are Next.js static files — no remotePattern needed
    ],
  },
};
```

**Deployment checklist:**
1. Create Vercel Blob store (Public access) in Vercel dashboard → Storage tab
2. Connect store to project — auto-provisions `BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN`
3. Set `NEXTAUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` in Vercel env vars (Production + Preview)
4. Do NOT set `STORAGE_PROVIDER` in production (absence defaults to blob mode)
5. First deploy → `/admin/login` → log in → enable edit mode → save → confirm `config.json` writes to Blob and `revalidatePath` clears cache

---

## Key Cross-Cutting Notes

| Concern | Decision |
|---|---|
| `runtime = 'nodejs'` | Required on `/api/upload` and `/api/config` — these use `fs` which isn't available on Edge runtime |
| `revalidatePath('/')` | Called inside `saveConfig()` after every Blob write to bust the Next.js page cache |
| Config not found in Blob | `getConfig()` returns `defaultConfig` — safe behaviour on fresh deploys before first save |
| Image filename security | Sanitize before write: strip `..`, allow only `[a-zA-Z0-9._-]`; prepend `Date.now()` to prevent collisions |
| NextAuth error redirect | Login page reads `searchParams.error` to conditionally show MUI `Alert` |
| `workingConfig` init | Fetched fresh from `/api/config` on each `enterEditMode()` — never edit stale data |
| Local uploads gitignore | `public/uploads/` is gitignored; in production all images live in Blob |
| MUI + Tailwind specificity | `enableCssLayer: true` puts MUI in `@layer mui`; Tailwind utilities (unlayered) always win conflicts |
| Next.js v16 MUI Link | `components/NextLink.tsx` wrapper required whenever passing `next/link` to MUI `component` prop |
| Gallery lightbox | `yet-another-react-lightbox` — installed in Phase 1, used only in `GallerySection` |
