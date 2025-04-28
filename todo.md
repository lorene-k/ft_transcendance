# ft_transcendance - Project Roadmap & Startup Guide

---

## 💪 What you must **know** before starting

### Backend (Fastify + Node.js)
- **Server**: A program listening for and answering requests.
- **Routes**: Different URL endpoints (example: `/login`, `/profile`).
- **JSON APIs**: Send and receive data in JSON format.
- **Typescript**: Strong typing to describe data structure.
- **Server lifecycle**: Start server → handle requests → send responses → stop server.

### Frontend (Typescript + TailwindCSS)
- **Frontend role**: Build everything the user sees (pages, forms, buttons).
- **Components**: Break your page into reusable pieces ("Navbar", "LoginForm", etc.).
- **Frontend-to-backend communication**: Using `fetch()`.
- **TailwindCSS**: Utility-first CSS (example: `bg-blue-500`, `text-center`).
- **State management**: How to store and update data on the page (example: login status).

---

## 🛠️ Steps to **prepare** before coding

1. **Set clear milestones**
   - Backend starts and answers `/ping`
   - Frontend displays a basic welcome page
   - Frontend can call backend and display data

2. **First simple feature**
   - Example: Display "Welcome to ft_transcendance!" on the homepage.

3. **Define communication method**
   - Use basic REST API (recommended).

4. **Basic project structure**
   ```
   ft_transcendance/
   ├── backend/
   └── frontend/
   ```
   - backend = Fastify server
   - frontend = React (Vite + Tailwind)

5. **Toolchain requirements**
   - Node.js installed
   - npm/yarn package manager
   - Typescript compiler configured
   - Vite installed and working

6. **Understand development flow**
   - Backend runs on `localhost:3000`
   - Frontend runs on `localhost:5173`
   - Frontend calls backend APIs correctly

---

## 📚 Essential reading

- Fastify basic server and route example
- Setting up Typescript for Node.js
- Creating a Vite app (React + TS)
- TailwindCSS utility class usage
- Using `fetch()` in the browser

---

## 🚀 First week goal

- Backend:
  - Reply to `/api/ping` with `{ message: "pong" }`

- Frontend:
  - Call `/api/ping`
  - Display "pong" on the page

---

## 📊 TODO List to get started

### Backend Setup
- [ ] Install Node.js
- [ ] Create a folder `backend/`
- [ ] Initialize Node.js project (`npm init -y`)
- [ ] Install Fastify (`npm install fastify`)
- [ ] Install Typescript and set it up (`npm install typescript ts-node @types/node`)
- [ ] Create a simple Fastify server with one `/api/ping` route

### Frontend Setup
- [ ] Install Vite (`npm create vite@latest frontend/`)
- [ ] Choose React + Typescript template
- [ ] Install TailwindCSS in `frontend/`
- [ ] Create a page that calls `/api/ping`
- [ ] Display the result
