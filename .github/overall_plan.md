# Plan: Viáney's Bakery Marketing Website

## TL;DR
Build a Next.js 16 + React 19 + Tailwind v4 marketing site for a bakery. Customer-facing pages are read-only (no ordering). An admin can log in (NextAuth.js credentials) and edit the site inline — clicking text edits it in place, clicking images opens a file picker. Content config is stored as `config.json` in Vercel Blob (prod) or a local JSON file (dev). Images go in Vercel Blob (prod) or `public/uploads/` (dev). A `STORAGE_PROVIDER` env flag switches between storage backends.

---

## Decisions
- **Auth**: NextAuth.js v5 with credentials (username + hashed password in env vars)
- **Config storage**: `config.json` in Vercel Blob (prod) / `data/config.json` locally (dev) — NOT Edge Config (requires REST API writes, not SDK)
- **Image storage**: Vercel Blob public store (prod) / `public/uploads/` (dev)
- **Storage flag**: `STORAGE_PROVIDER=local` in `.env.local`; unset defaults to `blob`
- **Admin UX**: Inline WYSIWYG — floating "Edit Mode" button while admin is logged in; click text = contenteditable; click image = file picker overlay; floating "Save / Discard" toolbar
- **Gallery**: Categorized tabs (Wedding, Birthday, etc.) + featured section on homepage
- **Sections**: Hero, Featured Gallery, Full Gallery (tabbed), Menu/Pricing, How to Order, About, Contact
- **Styling**: Dual system — **MUI** for admin UI components (Dialog, Tabs, TextField, Snackbar, Card, Button); **Tailwind v4** for all customer-facing section layouts and aesthetics. Coexistence enabled via `enableCssLayer: true` on `AppRouterCacheProvider`.

---

## Phase 1: Project Foundation

1. Install dependencies: `@vercel/blob`, `next-auth@beta`, `bcryptjs`, `@types/bcryptjs`, `@mui/material`, `@mui/material-nextjs`, `@emotion/react`, `@emotion/styled`, `@emotion/cache`
2. Configure `next.config.ts`: add `remotePatterns` for Vercel Blob public domain + local `/uploads/`
3. Create `.env.local` template with: `STORAGE_PROVIDER=local`, `NEXTAUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `BLOB_READ_WRITE_TOKEN` (prod), `BLOB_STORE_ID` (prod)
4. Add `public/uploads/` and `data/` to `.gitignore`
5. Create `data/config.json` with default site config structure (seed data)
6. Create `theme.ts` (`'use client'`) — `createTheme()` with bakery palette + Geist font variable (`typography.fontFamily: 'var(--font-geist-sans)'`) to keep existing font
7. Update `app/layout.tsx` — wrap body with `<AppRouterCacheProvider options={{ enableCssLayer: true }}>` then `<ThemeProvider theme={theme}>` (*`enableCssLayer` is required so MUI styles go into `@layer mui`, allowing Tailwind utilities to win conflicts*)
8. Create `components/NextLink.tsx` (`'use client'` wrapper re-exporting `next/link`) — required for Next.js v16 when passing Link to MUI `component` prop

## Phase 2: Storage Abstraction Layer

6. Create `lib/storage/types.ts` — define `StorageAdapter` interface: `upload(pathname, file) → {url, pathname}`, `delete(url)`, `list(prefix?) → [{url, pathname}]`
7. Create `lib/storage/local.ts` — `LocalStorageAdapter`: `upload` writes to `public/uploads/`, returns `/uploads/<pathname>`; `delete` calls `fs.unlink`; `list` reads directory
8. Create `lib/storage/blob.ts` — `BlobStorageAdapter`: wraps `@vercel/blob` `put()`, `del()`, `list()` with `access: 'public'`
9. Create `lib/storage/index.ts` — factory: `getStorageAdapter()` reads `process.env.STORAGE_PROVIDER`; returns `LocalStorageAdapter` if `'local'`, else `BlobStorageAdapter`

## Phase 3: Config Management

10. Create `lib/config/types.ts` — TypeScript types for `SiteConfig`: sections array, hero content, gallery categories + images, pricing items, how-to-order steps, about content, contact info
11. Create `lib/config/reader.ts` — `getConfig()`: if `STORAGE_PROVIDER=local` reads `data/config.json` with `fs.readFile`; else fetches from Vercel Blob via `get()` or a known blob URL
12. Create `lib/config/writer.ts` — `saveConfig(config)`: if local writes `data/config.json`; else `put('config.json', JSON.stringify(config), { access: 'public', allowOverwrite: true })`
13. Create `data/config.json` with default/seed content for all sections

## Phase 4: Authentication

14. Install and configure NextAuth.js v5 (`auth.ts` at project root) with `CredentialsProvider` — compare submitted password against `ADMIN_PASSWORD_HASH` using `bcryptjs.compare()`
15. Create `app/api/auth/[...nextauth]/route.ts` — export `{ GET, POST }` from auth config
16. Create `app/admin/login/page.tsx` — MUI `Card` + `TextField` (email) + `TextField` (password, `type="password"`) + MUI `Button`; calls `signIn('credentials', ...)`
17. Create `middleware.ts` — protect `/admin/*` routes (redirect to `/admin/login` if unauthenticated); allow `/admin/login` through

## Phase 5: API Routes

18. Create `app/api/upload/route.ts` — `POST`: auth check, receive `multipart/form-data`, call `getStorageAdapter().upload(pathname, file)`, return `{ url }`
19. Create `app/api/config/route.ts` — `GET`: call `getConfig()`, return JSON; `PUT`: auth check, parse body, call `saveConfig(config)`, return `{ ok: true }`
20. Create `app/api/images/route.ts` — `GET`: call `getStorageAdapter().list(prefix?)`, return array of image URLs (used in admin image picker)
21. Create `app/api/images/delete/route.ts` — `DELETE`: auth check, call `getStorageAdapter().delete(url)`

## Phase 6: Customer-Facing Pages

22. Create `app/page.tsx` — homepage: server component that calls `getConfig()`, renders section components in order
23. Create `components/sections/HeroSection.tsx` — full-width image + headline + subtext + CTA (pure Tailwind layout)
24. Create `components/sections/FeaturedGallery.tsx` — curated grid of "featured" images from config (Tailwind grid)
25. Create `components/sections/GallerySection.tsx` — MUI `Tabs`/`Tab` for category switching (complex enough to warrant MUI) + Tailwind image grid + lightbox on click
26. Create `components/sections/PricingSection.tsx` — pricing cards (Tailwind layout; MUI `Card` optional for consistent elevation)
27. Create `components/sections/HowToOrderSection.tsx` — numbered steps from config (Tailwind)
28. Create `components/sections/AboutSection.tsx` — text + photo (Tailwind)
29. Create `components/sections/ContactSection.tsx` — phone, email, social links, hours (Tailwind)
30. Create `app/globals.css` — bakery brand styles, color tokens via Tailwind v4 `@theme` CSS variables

## Phase 7: Admin Inline Editing (WYSIWYG)

31. Create `lib/admin-context.tsx` — context with `{ isAdmin, editMode, setEditMode, pendingChanges, setPendingChanges }`
32. Wrap `app/layout.tsx` with `AdminContextProvider` (server-checks session, passes `isAdmin` down)
33. Create `components/admin/EditModeBar.tsx` — MUI `Fab` (floating action button, bottom-right) visible when `isAdmin`; in view mode: "Edit" label; in edit mode: MUI `SpeedDial` or two `Button`s "Save" + "Discard" + MUI `Snackbar`+`Alert` for save confirmation/error feedback
34. Create `components/admin/EditableText.tsx` — view mode: plain text; edit mode: MUI `TextField` (inline, `variant="standard"`) fires `setPendingChanges` on change
35. Create `components/admin/EditableImage.tsx` — edit mode: hover overlay with MUI `IconButton` + `PhotoCamera` icon → opens `ImagePicker` dialog
36. Create `components/admin/ImagePicker.tsx` — MUI `Dialog` + `DialogTitle` + `DialogContent`; Tailwind image grid of existing images from `/api/images`; MUI `Button` "Upload New" → hidden `<input type="file">` → `POST /api/upload` → MUI `LinearProgress` during upload → updates pending changes with returned URL
37. Update all section components to swap static text/images for `<EditableText>` / `<EditableImage>` (no-ops outside edit mode)
38. Create `app/admin/page.tsx` — MUI `Card`s dashboard: "Open Site Editor" link, image count, last updated; MUI `Button` "Sign Out"

## Phase 8: Polish & Deployment Prep

39. Add `next/image` `<Image>` component throughout with proper `width`/`height` for Blob images
40. Update `next.config.ts` with `remotePatterns` for `*.public.blob.vercel-storage.com`
41. Create a `.env.local.example` file documenting all required env vars
42. Test full round-trip locally: upload image → appears in gallery, edit text → save → reload shows updated text
43. Verify edit mode is completely hidden / inaccessible to unauthenticated users

---

## Relevant Files
- `package.json` — add `@vercel/blob`, `next-auth@beta`, `bcryptjs`, `@mui/material`, `@mui/material-nextjs`, `@emotion/react`, `@emotion/styled`, `@emotion/cache`
- `next.config.ts` — `remotePatterns` for Blob + local
- `theme.ts` — MUI `createTheme()` client component (bakery palette, Geist font)
- `middleware.ts` — NextAuth route protection
- `auth.ts` — NextAuth configuration
- `app/layout.tsx` — `AppRouterCacheProvider` (enableCssLayer) + `ThemeProvider`
- `components/NextLink.tsx` — `'use client'` Next.js Link wrapper (Next.js v16 MUI requirement)
- `lib/storage/` — storage abstraction (types, local, blob, factory)
- `lib/config/` — config reader/writer
- `lib/admin-context.tsx` — edit mode context
- `app/page.tsx` — homepage
- `app/admin/` — admin pages
- `app/api/` — upload, config, images endpoints
- `components/sections/` — all 7 page sections (Tailwind)
- `components/admin/` — EditableText (MUI TextField), EditableImage, ImagePicker (MUI Dialog), EditModeBar (MUI Fab + Snackbar)
- `data/config.json` — local dev seed config
- `.gitignore` — add `public/uploads/`, `data/config.json`
- `app/admin/` — admin pages
- `app/api/` — upload, config, images endpoints
- `components/sections/` — all page sections
- `components/admin/` — editing primitives
- `data/config.json` — local dev seed config
- `.gitignore` — add `public/uploads/`, `data/config.json`

---

## Verification
1. `npm run dev` — site loads with seed content, no errors
2. Visit `/admin` → redirects to `/admin/login`
3. Log in → admin bar appears on public homepage
4. Enable edit mode → click a text element → type new content → Save → reload → change persists in `data/config.json`
5. Enable edit mode → click an image → upload a file → Save → image appears in gallery
6. Log out → no edit UI visible anywhere
7. `STORAGE_PROVIDER` unset → blob paths used in upload/config logic (verify in code, deploy to Vercel to fully test)

---

## Further Considerations
1. **NextAuth v5 with Next.js 16**: Next-auth beta should be compatible; double-check the session strategy — use JWT (no DB needed) vs database sessions (would require Vercel Postgres). JWT recommended to avoid adding a database dependency.
2. **Lightbox for gallery**: Consider `yet-another-react-lightbox` (lightweight, no major deps) for clicking images in the gallery. Can be added in Phase 6 if desired.
3. **Image upload in local dev via `fs`**: The local adapter uses `fs.writeFile` — this runs in Next.js API routes (Node.js runtime), not Edge runtime. Confirm all upload/config API routes use `export const runtime = 'nodejs'` if needed.
