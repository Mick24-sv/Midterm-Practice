# Mini Management System

## Backend

The backend is an Express API located in `backend/`. It requires Node.js 20 or newer.

```sh
cd backend
npm install
```

Copy `.env.example` to `.env` to customize the server port. Start the API with:

```sh
npm run dev
```

The API listens on port `3000` by default. Verify it is running at
`http://localhost:3000/api/health`; the endpoint returns a JSON health status.
Use `npm start` to run the backend without the development watcher.