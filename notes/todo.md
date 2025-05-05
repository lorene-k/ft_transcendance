# STEPS
1. **HTML Structure (index.html)**
- Start by creating the basic HTML layout for your app. You'll have a game area, a tournament section, and a user authentication section.

2. **Styling with Tailwind CSS**
- use responsive classes
- ex : class="sm:flex sm:flex-row sm:justify-between"

3. **Pong Game Logic (app.ts)**
- Start with the core of the game, such as setting up the canvas, rendering paddles, and ball movement

4. **User Registration and Authentication**
- To handle the registration and login, you'll need forms where users can input their data (aliases, avatars)
- You’ll then send this data to the backend for processing and session management

5. **Matchmaking and Tournament System**
- Implement the matchmaking and tournament system. This could include:
    - A queue system to match players together
    - Displaying tournament brackets
    - Managing player turns and organizing rounds

6. **Mobile Responsiveness**
With Tailwind CSS, make sure the page is responsive by using Tailwind's grid system, and utility classes for sm:, md:, and lg: breakpoints.

---
# TODO
- create docker (dockerfile + docker-compose)
- learn typescript
- learn tailwind css
- create basic SPA website
- check backend
- Use basic REST API : check
- try : Backend starts and answers `/ping` ; Frontend displays a basic welcome page ; Frontend can call backend and display data
- TEST : Backend: Reply to `/api/ping` with `{ message: "pong" }` // Frontend: Call `/api/ping` ; Display "pong" on the page

## TODO ADVANCED
- setup Docker
- local single/multi  game : Handles the paddle movement based on user input and renders the ball movement = render game, handle player input, create ai algo
- ensure browser compatibillity (firefox & chrome)
- handle back/forward buttons (frontend): Detect URL changes, Load/render appropriate content for that route, Use the History API (pushState, popstate) to manage navigation
    1. Change the URL (with pushState) when the user navigates inside the app.
    2. Listen to changes (with popstate) when the user clicks Back or Forward.
    3. Update the view based on the current URL.
- handle errors & warnings
- handle all modules
- responsiveness (use @media queries, handle touch gestures, check hover + active states, hambburger menu)


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

