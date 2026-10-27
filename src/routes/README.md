# Pages

These files export page components registered explicitly in `src/App.tsx` with
React Router:

| File                   | URL                 |
| ---------------------- | ------------------- |
| `index.tsx`            | `/`                 |
| `login.tsx`            | `/login`            |
| `forgot-password.tsx`  | `/forgot-password`  |
| `reset-password.tsx`   | `/reset-password`   |
| `setup.tsx`             | `/setup`             |

Add new routes to `src/App.tsx`. The Vercel SPA rewrite serves the app entry
for client-side routes, while server endpoints live in the root `api/` folder.
