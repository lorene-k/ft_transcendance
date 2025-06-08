## TODO
?? Play without logging in ? 
OK - restructure front : appeler une fonction qui prend view en param et faire le truc en fonction de la view
- implement back & forward buttons (pop/push history)
> - back/forth : history.pushState({}, '', '/about');
> - update url :
```bash
> window.addEventListener('popstate', () => {
>   // Update your view based on location.pathname
> });
```

- learn sql
- learn typescript for fastify + setup backend in .ts
- setup sqlite db
- setup fastify api
- setup plugins : fastify-jwt & fastify-auth
- connect frontend to backend

### 0. FRONTEND (global)
- Figma : Play, Stats, Account
- Html + CSS
- .ts
- Connect to back
- Think about chat layout

### 1. CSS
- Change font (curr == nunito)
- error styling w/ CSS ?
> Check [Styling based on sibling state](https://tailwindcss.com/docs/hover-focus-and-other-states?email=ccc%40aaa.com&password=Boscoxx)
- add [Floating labels](https://www.youtube.com/watch?v=nJzKi6oIvBA)
- @layer
- @keyframes (animations)
- transitions
- (Check Dark mode)
- (Check responsive design)
- clean @layers ?

### 2. TS
- creuser js
- reorganize files

### 3. BACKEND
- creuser node.js
- creuser fastify
- check SQL

# SEARCH
- plugins
- Rest API
- ESM & CJS

# LINKS
- [The Net Ninja (YouTube)](https://www.youtube.com/@NetNinja)
- [freeCodeCamp](https://www.freecodecamp.org/)
- [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [TypeScript in 5 Minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- [Tailwind CSS Utility Classes](https://tailwindcss.com/docs/styling-with-utility-classes)


# BASICS
### 1. Frontend (Typescript + TailwindCSS)
- **Frontend role**: Build everything the user sees (pages, forms, buttons).
- **Components**: Break your page into reusable pieces ("Navbar", "LoginForm", etc.).
- **Frontend-to-backend communication**: Using `fetch()`.
- **TailwindCSS**: Utility-first CSS (example: `bg-blue-500`, `text-center`).
- **State management**: How to store and update data on the page (example: login status).

### 2. Frontend Setup
- [ ] Install Vite (`npm create vite@latest frontend/`)
- [ ] Choose Typescript template
- [ ] Install TailwindCSS in `frontend/`
- [ ] Create a page that calls `/api/ping`
- [ ] Display the result

### 3. Development flow
   - Backend runs on `localhost:3000`
   - Frontend runs on `localhost:5173`
   - Frontend calls backend APIs correctly

