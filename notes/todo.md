# SEARCH
- plugins
- Rest API
- ESM & CJS

---
# TODO
OK - create docker (dockerfile + docker-compose)
OK - learn tailwind css
OK - learn js
OK - create basic SPA website
OK - learn typescript
- check backend
- Use basic REST API : check
- try : Backend starts and answers `/ping` ; Frontend displays a basic welcome page ; Frontend can call backend and display data
- TEST : Backend: Reply to `/api/ping` with `{ message: "pong" }` // Frontend: Call `/api/ping` ; Display "pong" on the page

## TODO ADVANCED
- local single/multi  game : Handles the paddle movement based on user input and renders the ball movement = render game, handle player input, create ai algo
- ensure browser compatibillity (firefox & chrome)
- handle back/forward buttons (frontend): Detect URL changes, Load/render appropriate content for that route, Use the History API (pushState, popstate) to manage navigation
    1. Change the URL (with pushState) when the user navigates inside the app.
    2. Listen to changes (with popstate) when the user clicks Back or Forward.
    3. Update the view based on the current URL.
- handle errors & warnings
- handle all modules
- responsiveness (use @media queries, handle touch gestures, check hover + active states, hambburger menu)
- in docker-compose : remove volumes in production


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

