# Quantity Measurement App

HTML, CSS, and JavaScript dashboard with **JSON Server** for history. Operations: **CONVERT**, **COMPARE**, **ADD**, **SUBTRACT**, **DIVIDE**. Types: **Length**, **Temperature**, **Volume**, **Weight**.

## Run locally

### 1) Install dependencies

```bash
cd featureQM-HTML-CSS-JS
npm install
```

### 2) Start JSON Server (History API)

```bash
npm run server
```

- `GET http://localhost:3000/history`
- `POST http://localhost:3000/history`
- `DELETE http://localhost:3000/history/:id`

### 3) Start the static UI server

```bash
npm run start
```

Open **http://127.0.0.1:5174** (or the URL printed in the terminal).

## Behaviour

- Dashboard works **without login**.
- **History** opens Signup first when not signed in (`?next=history`).
- **Save to History** works without login (requires JSON Server running).

## Files

- `index.html` — main app
- `styles.css` — styles
- `app.js` — measurement logic + History API
- `auth.js` — auth helpers
- `login.html`, `signup.html`, `login.js`, `signup.js`
- `db.json` — JSON Server database
