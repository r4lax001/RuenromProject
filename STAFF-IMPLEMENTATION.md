# Staff Back Office — implementation notes

## Delivered
- Shared Dashboard shell for all staff sections; Inter, Prompt and Kanit typography.
- Live dashboard metrics and 7/30-day cash-receipt CSV; empty-state-safe charts.
- Room cards with status counts, search, type filters, grouped editor, local PNG/JPEG upload and confirmation before status changes.
- Dark theme surfaces, form controls, table cells, status labels and dialogs.
- Staff booking creation/contact editing; unpaid reservations can change dates/room (reprices without previous packages/promotions).
- Explicit cash/transfer receipt entry with request UUID deduplication; extra charges; verified check-in; paid-in-full checkout; automatic cleaning task.
- Customer notes and booking history; employee records and shifts/attendance; housekeeping/maintenance tasks; inventory movements/history/low-stock indicators.
- Room types and hotel settings; booking payment summary printable through browser PDF.

## Validation
- `npm test`: 15 unit tests pass.
- `npm run build`: passes.
- `docker compose exec -T app node server/scripts/smoke-operations.mjs`: passes all module reads, booking/receipt/check-in/checkout/housekeeping flow, duplicate receipt protection, stock underflow prevention and anonymous access rejection. The script removes only the records it creates.
- Browser: verified room search, editor opening/closing and readable booking tables/room cards in dark mode.

## Current boundaries
- Staff authorization uses existing Admin, Receptionist and Accounting roles. Employees are personnel records, not additional login roles.
- Cash/transfer entry records money already received; no new payment gateway or automated refunds.
- Room availability is checked atomically when submitting a reservation; date changes are restricted to unpaid Pending reservations.
- Reports cover 7/30 days; ADR/RevPAR use current active-room inventory and booked stay dates, not a historical inventory ledger.
- Hotel settings are descriptive/document data, not automatic changes to pricing, deposit percentage or cancellation enforcement.
- Printable summary is not a certified tax invoice.
- Mobile layouts use responsive cards and horizontally scrollable operational tables; device-by-device testing is still needed before production.

## Storage
New tables are additive and initialized in `server/src/operations-db.js`. Existing bookings/payments remain the source of truth. Uploaded room images persist in the Docker `uploads` volume mounted at `/app/server/uploads`.
