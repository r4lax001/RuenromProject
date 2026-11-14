# Frontend structure

React + Vite + Lucide. Color variables are defined in `components/home.css`.

- `main.jsx`: application entry point only.
- `components/Home.jsx`: Home page composition; loads featured room prices from `/api/rooms`.
- `components/home/`: HomeHeader, Dialog, SearchBar, FeaturedRoomCard.
- `data/home.js`: editorial copy and placeholder photography. Live room data overrides featured room information.
- `customer/CustomerApp.jsx`: URL navigation, authentication boundary, customer page composition.
- `customer/pages/`: RoomsPage (search/favorites), RoomDetailPage, CheckoutPage, AuthPage, BookingsPage, BookingDetailPage (payment/confirmation/detail), InfoPage (profile/about/policies).
- `customer/components/`: reusable search, cards, amenities, loading/error/empty feedback, footer.
- `customer/hooks/`: resource fetching with cancellation, URL navigation, local favorites.
- `customer/lib/`: API transport and date/currency helpers.
- `customer/shared.jsx`: public re-exports; no business logic.
- `customer/customer.css`: customer layouts, responsive rules, print styling.
- `staff/`: existing back-office screens split into Staff, Bookings, Management, Payments.

## URLs

`/`, `/rooms`, `/room/:id`, `/checkout?roomId=...&checkIn=...&checkOut=...&guests=...`, `/payment/:id`, `/confirmation/:id`, `/bookings`, `/booking/:id`, `/favorites`, `/login`, `/register`, `/forgot-password`, `/profile`, `/about`, `/policies`, `/staff`.

Dates and room selection survive refresh and the login journey through URL parameters. Browser back/forward uses history/popstate. Favorites are saved by room type in localStorage, consistent with Home, and are device-local.

## API and boundaries

Room availability, quotes, registration/login, booking creation, booking history, demo deposit and cancellation use the existing API. Quotes refresh when packages/promotions change and stale responses are aborted. Never display a payment success until the server returns success; confirmation reads saved booking state.

The existing backend requires login for booking. Guest checkout, real payments, email delivery, password reset, profile edits, reviews, multiple gallery images and verified hotel coordinates/contact details are not implemented by the current API. Their UI communicates this instead of pretending success or inventing data. The location link searches Bangkok and is not a hotel coordinate. Download is a plain-text booking summary; PDF uses browser printing, not a tax invoice.

Development proxy preserves Host (`changeOrigin: false`) to work with the backend Origin check. No production origin validation was relaxed.

## Checks performed

- Production Vite build passes.
- Existing five pricing tests pass.
- Browser: search -> room detail -> login -> checkout retains room/date/guest selection.
- Browser: adding breakfast changes quote from THB 2,400 to THB 3,100 and deposit from THB 480 to THB 620 for two guests / one night.
- No real payment was processed. New booking/deposit/cancellation mutations have not been exercised end-to-end in this frontend pass.
