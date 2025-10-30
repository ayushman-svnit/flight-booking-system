-- ============================================
-- FLIGHT BOOKING SYSTEM - DATABASE TRIGGERS AND PROCEDURES
-- ============================================

-- ============================================
-- TRIGGERS (3 Required)
-- ============================================

-- TRIGGER 1: Update Seat Availability After Booking
-- Purpose: Automatically reduce available seats when a new booking is confirmed
CREATE TRIGGER IF NOT EXISTS update_seats_after_booking
AFTER INSERT ON bookings
FOR EACH ROW
WHEN NEW.booking_status = 'confirmed'
BEGIN
    UPDATE flights
    SET available_seats = available_seats - NEW.number_of_passengers
    WHERE flight_id = NEW.flight_id
    AND is_daily = 0;  -- Only for one-time flights
END;

-- TRIGGER 2: Restore Seats on Booking Cancellation
-- Purpose: Add back seats when booking is cancelled
CREATE TRIGGER IF NOT EXISTS restore_seats_after_cancellation
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled'
BEGIN
    UPDATE flights
    SET available_seats = available_seats + NEW.number_of_passengers
    WHERE flight_id = NEW.flight_id
    AND is_daily = 0;
END;

-- TRIGGER 3: Validate Payment Amount
-- Purpose: Ensure payment amount matches booking total
CREATE TRIGGER IF NOT EXISTS validate_payment_amount
BEFORE INSERT ON payments
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.amount != (SELECT total_amount FROM bookings WHERE booking_id = NEW.booking_id)
        THEN RAISE(ABORT, 'Payment amount does not match booking amount')
    END;
END;

-- TRIGGER 4: Auto-generate Booking Reference
-- Purpose: Automatically create unique booking reference
CREATE TRIGGER IF NOT EXISTS generate_booking_reference
AFTER INSERT ON bookings
FOR EACH ROW
WHEN NEW.booking_reference IS NULL
BEGIN
    UPDATE bookings
    SET booking_reference = 'BK' || printf('%06d', NEW.booking_id)
    WHERE booking_id = NEW.booking_id;
END;

-- TRIGGER 5: Prevent Overbooking
-- Purpose: Check seat availability before confirming booking
CREATE TRIGGER IF NOT EXISTS prevent_overbooking
BEFORE INSERT ON bookings
FOR EACH ROW
WHEN NEW.booking_status = 'confirmed'
BEGIN
    SELECT CASE
        WHEN (SELECT available_seats FROM flights WHERE flight_id = NEW.flight_id AND is_daily = 0) < NEW.number_of_passengers
        THEN RAISE(ABORT, 'Insufficient seats available')
    END;
END;

-- ============================================
-- VIEWS (Useful for complex queries)
-- ============================================

-- VIEW 1: Booking Details with User and Flight Info
CREATE VIEW IF NOT EXISTS booking_details AS
SELECT 
    b.booking_id,
    b.booking_reference,
    b.booking_date,
    b.travel_date,
    b.number_of_passengers,
    b.total_amount,
    b.booking_status,
    u.user_id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.phone_number,
    f.flight_id,
    f.flight_number,
    f.source_city,
    f.destination_city,
    f.departure_time,
    f.arrival_time,
    f.price,
    a.airline_name,
    p.payment_id,
    p.payment_method,
    p.payment_status,
    p.transaction_id
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN flights f ON b.flight_id = f.flight_id
JOIN airlines a ON f.airline_id = a.airline_id
LEFT JOIN payments p ON b.booking_id = p.booking_id;

-- VIEW 2: Flight Occupancy Report
CREATE VIEW IF NOT EXISTS flight_occupancy AS
SELECT 
    f.flight_id,
    f.flight_number,
    f.source_city,
    f.destination_city,
    f.departure_time,
    f.total_seats,
    f.available_seats,
    (f.total_seats - f.available_seats) AS booked_seats,
    ROUND(((f.total_seats - f.available_seats) * 100.0 / f.total_seats), 2) AS occupancy_percentage,
    f.flight_status,
    a.airline_name
FROM flights f
JOIN airlines a ON f.airline_id = a.airline_id
WHERE f.is_daily = 0;

-- VIEW 3: Revenue Report
CREATE VIEW IF NOT EXISTS revenue_report AS
SELECT 
    DATE(p.payment_date) AS payment_day,
    COUNT(DISTINCT p.payment_id) AS total_transactions,
    SUM(p.amount) AS daily_revenue,
    AVG(p.amount) AS average_transaction,
    COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) AS completed_payments,
    COUNT(CASE WHEN p.payment_status = 'failed' THEN 1 END) AS failed_payments
FROM payments p
GROUP BY DATE(p.payment_date);

-- VIEW 4: User Booking History
CREATE VIEW IF NOT EXISTS user_booking_history AS
SELECT 
    u.user_id,
    u.username,
    u.email,
    COUNT(DISTINCT b.booking_id) AS total_bookings,
    COUNT(CASE WHEN b.booking_status = 'confirmed' THEN 1 END) AS confirmed_bookings,
    COUNT(CASE WHEN b.booking_status = 'cancelled' THEN 1 END) AS cancelled_bookings,
    SUM(b.total_amount) AS total_spent,
    MAX(b.booking_date) AS last_booking_date
FROM users u
LEFT JOIN bookings b ON u.user_id = b.user_id
GROUP BY u.user_id, u.username, u.email;

-- ============================================
-- INDEXES (For Performance Optimization)
-- ============================================

-- Index on frequently searched columns
CREATE INDEX IF NOT EXISTS idx_flights_source_dest ON flights(source_city, destination_city);
CREATE INDEX IF NOT EXISTS idx_flights_departure ON flights(departure_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_flight ON bookings(flight_id);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================

-- Query 1: Get all confirmed bookings with flight details
/*
SELECT * FROM booking_details 
WHERE booking_status = 'confirmed'
ORDER BY booking_date DESC;
*/

-- Query 2: Calculate total revenue for a specific date range
/*
SELECT 
    SUM(amount) as total_revenue,
    COUNT(*) as total_payments,
    AVG(amount) as average_payment
FROM payments
WHERE payment_status = 'completed'
AND DATE(payment_date) BETWEEN '2025-10-01' AND '2025-10-31';
*/

-- Query 3: Find flights with high occupancy (>80%)
/*
SELECT * FROM flight_occupancy
WHERE occupancy_percentage > 80
ORDER BY occupancy_percentage DESC;
*/

-- Query 4: Get user's total spending
/*
SELECT 
    u.username,
    u.email,
    COUNT(b.booking_id) as total_bookings,
    SUM(b.total_amount) as total_spent
FROM users u
JOIN bookings b ON u.user_id = b.user_id
WHERE b.booking_status = 'confirmed'
GROUP BY u.user_id
ORDER BY total_spent DESC;
*/

-- Query 5: Find available flights for a route
/*
SELECT 
    f.flight_number,
    f.departure_time,
    f.arrival_time,
    f.price,
    f.available_seats,
    a.airline_name
FROM flights f
JOIN airlines a ON f.airline_id = a.airline_id
WHERE f.source_city = 'Ahmedabad'
AND f.destination_city = 'Mumbai'
AND f.flight_status = 'scheduled'
AND f.available_seats > 0
ORDER BY f.departure_time;
*/

-- ============================================
-- NOTES FOR IMPLEMENTATION
-- ============================================

/*
STORED PROCEDURES IMPLEMENTATION:
Since SQLite doesn't support stored procedures directly, these are implemented
in the Python backend (main.py) using functions:

1. book_flight(user_id, flight_id, passengers, payment_method)
   - Creates booking record
   - Processes payment
   - Updates seat availability
   - Returns booking confirmation

2. cancel_booking(booking_id, user_id)
   - Validates user ownership
   - Updates booking status
   - Restores seats
   - Processes refund

3. search_flights(source, destination, date, weekday)
   - Filters flights by criteria
   - Checks seat availability
   - Returns matching flights

CURSOR USAGE:
Cursors are used in Python backend for batch operations:
- Generating daily reports
- Updating flight statuses
- Processing refunds
- Bulk data operations

FUNCTIONS:
Custom functions implemented in Python:
- calculate_total_revenue(start_date, end_date)
- get_user_booking_count(user_id)
- calculate_occupancy_rate(flight_id)
- generate_booking_reference()
- validate_seat_availability(flight_id, passengers)

EXCEPTION HANDLING:
All database operations include try-catch blocks:
- IntegrityError (duplicate entries)
- ValueError (invalid data)
- HTTPException (API errors)
- Custom validation errors
*/
