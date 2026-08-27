# 📋 Changelog

Semua perubahan penting pada project ini didokumentasikan di file ini.

Format: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`

---

## [0.1.0] — 2026-06-18

### 🎉 Initial Release

- Nuxt Boilerplate — Starter template admin dashboard
- Nuxt 4, NuxtUI v4, Tailwind CSS v4, TypeScript, Zod, Axios
- Authentication (email/password, Google OAuth, forgot/reset password)
- User management CRUD
- Contact CRUD
- Profile configuration
- Dashboard layout dengan collapsible sidebar
- Auth layout dengan split-screen design
- Custom design system (green primary, Geist font)
- Dokumentasi lengkap di `docs/`

## [0.2.1] — 2026-08-27

### Changed

- Updated `/phone-number` page layout from card grid to structured sectioned `<UTable>` matching the Meta/WhatsApp Business Account list design.

### Fixed

- Resolved TypeScript `TimeValue` compatibility error in `CallHoursForm.vue`.

---

## [0.2.0] — 2026-08-24

### Changed

- **Rebuilt as the NusaCall product frontend.** The boilerplate's sample features (user
  CRUD, contact CRUD, Google OAuth) are gone — they were pattern references only, per the
  original project instruction. Auth now does a two-hop login through NusaCall's own
  backend (never calls nusawa directly from the browser).

### Added

- `/agent` — roster with presence, `canReceiveCalls` toggle.
- `/contact` — read-only proxy over nusawa's contact list.
- Softphone: `useSoftphone`/`useSignaling`/`useWebRTC`/`useCallAudio` composables,
  `CallWidget`/`IncomingCallModal`/`ActiveCallPanel`/`PresenceToggle`/`CallTimer` — mounted
  globally in the dashboard layout, connects over WebSocket, rings on `incoming_call`.
- `/call` — history with DataTable filters (status, direction) and a `DetailModal`.
- `/phone-number` — per-number cards, `UpdateModal` with `CallHoursForm` (one operating-hour
  range per day — a deliberate v1 simplification, not the two-range spec) and the two
  mandatory Meta warnings (7-day propagation, icon visibility doesn't block calling).
- Dashboard: Calls Today / Answer Rate (red below 85%, Meta's low-pickup-rate threshold) /
  Missed Today cards, alongside the existing agent counts.
- 157 i18n keys across `en`/`id`, kept in sync on every addition.

### Fixed

- `useTableQuery`'s fetch watcher never fired on first load — every DataTable page
  (`/agent`, `/contact`, `/call`) rendered empty until something changed page/sort/filter.
  Fixed with an `onMounted` inside the composable itself.
- `CallHoursForm`'s enable-toggle wrote to its `defineModel()` twice in one handler; the
  second write spread the pre-update value (`defineModel` doesn't reflect synchronously
  like a plain ref) and silently dropped `weekly_operating_hours`, crashing the form on
  the very next render. Fixed to a single assignment.

## Template untuk Entry Baru

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- Fitur baru yang ditambahkan

### Changed
- Perubahan pada fitur yang sudah ada

### Fixed
- Bug yang diperbaiki

### Removed
- Fitur yang dihapus

### Security
- Perubahan terkait keamanan
```
