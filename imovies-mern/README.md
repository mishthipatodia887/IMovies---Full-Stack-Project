# 🎬 IMovies – MERN Cinema Booking

Full-stack cinema ticket booking app.

| Layer | Technology |
|-------|-----------|
| Front end | React.js (Vite) + Bootstrap 5 / React-Bootstrap |
| Back end | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JSON Web Token (JWT) + bcrypt password hashing |
| Async | `async/await`, Promises, `Promise.all` throughout (API calls, DB queries) |

## Features
Movies with search / filters / sort · interactive posters · city & theatre selection · showtimes with availability colours · seat map (free / yours / taken) · snacks · coupons (`IMOVIES10`, `FIRST50`) · demo payment · ticket with QR · My bookings & cancel · saved movies · light/dark theme · admin panel (add/delete movies, stats).

Seat availability, prices and coupons are **validated on the server**, so two users cannot book the same seat.

## Folder structure
```
imovies-mern/
├── server/
│   ├── server.js              # Express app entry
│   ├── config/db.js           # MongoDB connection
│   ├── models/                # User.js, Movie.js, Booking.js
│   ├── middleware/auth.js     # JWT protect + adminOnly
│   ├── routes/                # auth.js, movies.js, bookings.js, meta.js
│   ├── utils/                 # helpers.js (pricing, seats, theatres), seed.js
│   ├── data/                  # movies.json, locations.json, theatres.json
│   ├── .env.example
│   └── package.json
├── client/
│   ├── index.html, vite.config.js, package.json
│   └── src/
│       ├── main.jsx, App.jsx, api.js, utils.js, styles.css
│       ├── context/AuthContext.jsx
│       ├── components/        # Navbar, Poster, MovieCard, Hero, CityModal,
│       │                      # AuthModal, BookingModal, MyBookings, AdminPanel
│       └── pages/             # Movies, Theatres, Offers
└── README.md
```

## Run locally
Requires Node 18+ and MongoDB running locally (or a MongoDB Atlas URI).

```bash
# 1. API
cd server
cp .env.example .env        # edit JWT_SECRET (and MONGO_URI if needed)
npm install
npm run seed                # loads movies + creates admin user (admin / admin123)
npm run dev                 # http://localhost:5000

# 2. Client (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```
Sign in as `admin` / `admin123` to open the Admin panel (change the password in `.env` before seeding).

## API summary
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/auth/me` | signed in |
| GET | `/api/movies` (`q`, `industry`, `language`, `sort`), `/api/movies/:id` | public |
| POST / DELETE | `/api/movies`, `/api/movies/:id` | admin |
| GET | `/api/locations`, `/api/config`, `/api/theatres?city=`, `/api/shows?movie&city&date`, `/api/seats?...` | public |
| POST | `/api/bookings` | signed in |
| GET | `/api/bookings/mine` | signed in |
| DELETE | `/api/bookings/:id` | owner / admin |
| GET | `/api/bookings/stats` | admin |

## Notes
- Payments are simulated. Theatre names are real for some major cities; others are sample data. Showtimes and base availability are generated.
- Saved movies, city and theme are stored in the browser's `localStorage`.
- For production, set `VITE_API_URL` on the client and `CLIENT_URL` on the server.
