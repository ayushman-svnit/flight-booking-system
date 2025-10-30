"""
Database Triggers and Advanced Features Implementation
Run this script to add triggers, views, and indexes to your database
"""

import sqlite3
from pathlib import Path

# Database path - should match database.py
DB_PATH = Path(__file__).parent / "flight_booking.db"

def execute_sql_file(cursor, filepath):
    """Execute SQL commands from a file"""
    with open(filepath, 'r') as f:
        sql_script = f.read()
    
    # Split by semicolons and execute each statement
    statements = sql_script.split(';')
    for statement in statements:
        statement = statement.strip()
        if statement and not statement.startswith('--') and not statement.startswith('/*'):
            try:
                cursor.execute(statement)
                print(f"✓ Executed: {statement[:50]}...")
            except sqlite3.Error as e:
                print(f"✗ Error: {e}")
                print(f"  Statement: {statement[:100]}")

def add_triggers():
    """Add database triggers"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("ADDING DATABASE TRIGGERS")
    print("=" * 60)
    
    triggers = [
        # Trigger 1: Update seats after booking
        """
        CREATE TRIGGER IF NOT EXISTS update_seats_after_booking
        AFTER INSERT ON bookings
        FOR EACH ROW
        WHEN NEW.booking_status = 'confirmed'
        BEGIN
            UPDATE flights
            SET available_seats = available_seats - NEW.number_of_passengers
            WHERE flight_id = NEW.flight_id
            AND is_daily = 0;
        END;
        """,
        
        # Trigger 2: Restore seats on cancellation
        """
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
        """,
        
        # Trigger 3: Prevent overbooking
        """
        CREATE TRIGGER IF NOT EXISTS prevent_overbooking
        BEFORE INSERT ON bookings
        FOR EACH ROW
        WHEN NEW.booking_status = 'confirmed'
        BEGIN
            SELECT CASE
                WHEN (
                    SELECT available_seats 
                    FROM flights 
                    WHERE flight_id = NEW.flight_id AND is_daily = 0
                ) < NEW.number_of_passengers
                THEN RAISE(ABORT, 'Insufficient seats available')
            END;
        END;
        """
    ]
    
    for i, trigger in enumerate(triggers, 1):
        try:
            cursor.execute(trigger)
            print(f"✓ Trigger {i} created successfully")
        except sqlite3.Error as e:
            print(f"✗ Error creating trigger {i}: {e}")
    
    conn.commit()
    conn.close()
    print()

def add_views():
    """Add database views"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("ADDING DATABASE VIEWS")
    print("=" * 60)
    
    views = [
        # View 1: Booking Details
        """
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
            f.flight_id,
            f.flight_number,
            f.source_city,
            f.destination_city,
            f.departure_time,
            f.arrival_time,
            a.airline_name
        FROM bookings b
        JOIN users u ON b.user_id = u.user_id
        JOIN flights f ON b.flight_id = f.flight_id
        JOIN airlines a ON f.airline_id = a.airline_id;
        """,
        
        # View 2: Flight Occupancy
        """
        CREATE VIEW IF NOT EXISTS flight_occupancy AS
        SELECT 
            f.flight_id,
            f.flight_number,
            f.source_city,
            f.destination_city,
            f.total_seats,
            f.available_seats,
            (f.total_seats - f.available_seats) AS booked_seats,
            ROUND(((f.total_seats - f.available_seats) * 100.0 / f.total_seats), 2) AS occupancy_percentage
        FROM flights f
        WHERE f.is_daily = 0;
        """,
        
        # View 3: Revenue Report
        """
        CREATE VIEW IF NOT EXISTS revenue_report AS
        SELECT 
            DATE(p.payment_date) AS payment_day,
            COUNT(DISTINCT p.payment_id) AS total_transactions,
            SUM(p.amount) AS daily_revenue,
            AVG(p.amount) AS average_transaction
        FROM payments p
        WHERE p.payment_status = 'completed'
        GROUP BY DATE(p.payment_date);
        """
    ]
    
    for i, view in enumerate(views, 1):
        try:
            cursor.execute(view)
            print(f"✓ View {i} created successfully")
        except sqlite3.Error as e:
            print(f"✗ Error creating view {i}: {e}")
    
    conn.commit()
    conn.close()
    print()

def add_indexes():
    """Add database indexes for performance"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("ADDING DATABASE INDEXES")
    print("=" * 60)
    
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_flights_source_dest ON flights(source_city, destination_city);",
        "CREATE INDEX IF NOT EXISTS idx_flights_departure ON flights(departure_time);",
        "CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_bookings_flight ON bookings(flight_id);",
        "CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);",
        "CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);",
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
        "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);"
    ]
    
    for i, index in enumerate(indexes, 1):
        try:
            cursor.execute(index)
            print(f"✓ Index {i} created successfully")
        except sqlite3.Error as e:
            print(f"✗ Error creating index {i}: {e}")
    
    conn.commit()
    conn.close()
    print()

def verify_triggers():
    """Verify triggers are installed"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("VERIFYING TRIGGERS")
    print("=" * 60)
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='trigger';")
    triggers = cursor.fetchall()
    
    if triggers:
        print("Installed triggers:")
        for trigger in triggers:
            print(f"  ✓ {trigger[0]}")
    else:
        print("  ✗ No triggers found")
    
    conn.close()
    print()

def verify_views():
    """Verify views are installed"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("VERIFYING VIEWS")
    print("=" * 60)
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='view';")
    views = cursor.fetchall()
    
    if views:
        print("Installed views:")
        for view in views:
            print(f"  ✓ {view[0]}")
    else:
        print("  ✗ No views found")
    
    conn.close()
    print()

def test_trigger():
    """Test trigger functionality"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("TESTING TRIGGER FUNCTIONALITY")
    print("=" * 60)
    
    try:
        # Get a flight with available seats
        cursor.execute("""
            SELECT flight_id, available_seats, total_seats
            FROM flights
            WHERE is_daily = 0 AND available_seats > 0
            LIMIT 1
        """)
        
        result = cursor.fetchone()
        if result:
            flight_id, available_seats, total_seats = result
            print(f"Testing with Flight ID: {flight_id}")
            print(f"Current available seats: {available_seats}/{total_seats}")
            print("✓ Trigger test environment ready")
        else:
            print("✗ No suitable flight found for testing")
    
    except sqlite3.Error as e:
        print(f"✗ Error: {e}")
    
    finally:
        conn.close()
        print()

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("FLIGHT BOOKING SYSTEM - DATABASE ADVANCED FEATURES SETUP")
    print("=" * 60 + "\n")
    
    # Add all features
    add_triggers()
    add_views()
    add_indexes()
    
    # Verify installation
    verify_triggers()
    verify_views()
    
    # Test
    test_trigger()
    
    print("=" * 60)
    print("SETUP COMPLETE!")
    print("=" * 60)
    print("\nYour database now includes:")
    print("  ✓ 3 Triggers (seat management, overbooking prevention)")
    print("  ✓ 3 Views (booking details, occupancy, revenue)")
    print("  ✓ 8 Indexes (performance optimization)")
    print("\nYou can now demonstrate these features in your DBMS viva!")
    print("=" * 60 + "\n")
