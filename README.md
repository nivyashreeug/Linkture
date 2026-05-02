# Linkture

Linkture is a MERN-based networking platform for Venture Capitalists, Startup Owners, and Student Incubators.

## Structure

- `client/` React + Vite + Tailwind UI
- `server/` Express + MongoDB + JWT API

## Development

1. Install dependencies at the root:

```bash
npm install
```

2. Create environment files from the examples.

3. Run both apps:

```bash
npm run dev
```

## Core roles

- `VC`
- `Startup`
- `Student`

## Auth flow

- Shared landing page at `/`
- Role-specific login portals at `/login/vc`, `/login/startup`, and `/login/student`
- Role-specific registration portals at `/register/vc`, `/register/startup`, and `/register/student`
- JWT-protected dashboards at `/dashboard/vc`, `/dashboard/startup`, and `/dashboard/student`
