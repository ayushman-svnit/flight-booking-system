"""
Database Features: Triggers, Functions, and Advanced SQL
This script adds required database features for the college project:
- Triggers for automated actions
- Views for complex queries
- Auditing and logging capabilities
"""

import sqlite3
from datetime import datetime

def add_database_features():
    """Add triggers, views, and advanced SQL features to the database"""
    
    db_path = './flight_booking.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Adding advanced database features...\n")
    
    # ==================== AUDIT LOG TABLE ====================
    print("1. Creating audit_log table for tracking changes...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            operation TEXT NOT NULL,
            record_id INTEGER NOT NULL,
            old_value TEXT,
            new_value TEXT,
            changed_by INTEGER,
            changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            description TEXT
        )
    """)
    print("   ✓ Audit log table created\n")
    
    # ==================== TRIGGER 1: Audit Booking Changes ====================
    print("2. Creating Trigger 1: audit_booking_changes...")
    cursor.execute("DROP TRIGGER IF EXISTS audit_booking_changes")
    cursor.execute("""
        CREATE TRIGGER audit_booking_changes
        AFTER UPDATE ON bookings
        FOR EACH ROW
        WHEN OLD.booking_status != NEW.booking_status
        BEGIN
            INSERT INTO audit_log (
                table_name, 
                operation, 
                record_id, 
                old_value, 
                new_value,
                changed_by,
                description
            )
            VALUES (
                'bookings',
                'UPDATE',
                NEW.booking_id,
                OLD.booking_status,
                NEW.booking_status,
                NEW.user_id,
                'Booking status changed from ' || OLD.booking_status || ' to ' || NEW.booking_status
            );
        END;
    """)
    print("   ✓ Trigger created: Tracks booking status changes\n")
    
    # ==================== TRIGGER 2: Update Available Seats ====================
    print("3. Creating Trigger 2: update_available_seats_on_booking...")
    cursor.execute("DROP TRIGGER IF EXISTS update_available_seats_on_booking")
    cursor.execute("""
        CREATE TRIGGER update_available_seats_on_booking
        AFTER INSERT ON bookings
        FOR EACH ROW
        WHEN (SELECT is_daily FROM flights WHERE flight_id = NEW.flight_id) = 0
        BEGIN
            UPDATE flights
            SET available_seats = available_seats - NEW.passengers_count
            WHERE flight_id = NEW.flight_id;
            
            INSERT INTO audit_log (
                table_name,
                operation,
                record_id,
                description
            )
            VALUES (
                'flights',
                'SEAT_UPDATE',
                NEW.flight_id,
                'Reduced ' || NEW.passengers_count || ' seats for booking #' || NEW.booking_id
            );
        END;
    """)
    print("   ✓ Trigger created: Auto-updates available seats on booking\n")
    
    # ==================== TRIGGER 3: Restore Seats on Cancellation ====================
    print("4. Creating Trigger 3: restore_seats_on_cancellation...")
    cursor.execute("DROP TRIGGER IF EXISTS restore_seats_on_cancellation")
    cursor.execute("""
        CREATE TRIGGER restore_seats_on_cancellation
        AFTER UPDATE ON bookings
        FOR EACH ROW
        WHEN OLD.booking_status != 'cancelled' 
         AND NEW.booking_status = 'cancelled'
         AND (SELECT is_daily FROM flights WHERE flight_id = NEW.flight_id) = 0
        BEGIN
            UPDATE flights
            SET available_seats = available_seats + NEW.passengers_count
            WHERE flight_id = NEW.flight_id;
            
            INSERT INTO audit_log (
                table_name,
                operation,
                record_id,
                description
            )
            VALUES (
                'flights',
                'SEAT_RESTORE',
                NEW.flight_id,
                'Restored ' || NEW.passengers_count || ' seats from cancelled booking #' || NEW.booking_id
            );
        END;
    """)
    print("   ✓ Trigger created: Restores seats when booking is cancelled\n")
    
    # ==================== TRIGGER 4: Validate Flight Capacity ====================
    print("5. Creating Trigger 4: validate_flight_capacity...")
    cursor.execute("DROP TRIGGER IF EXISTS validate_flight_capacity")
    cursor.execute("""
        CREATE TRIGGER validate_flight_capacity
        BEFORE INSERT ON bookings
        FOR EACH ROW
        WHEN (SELECT is_daily FROM flights WHERE flight_id = NEW.flight_id) = 0
         AND (SELECT available_seats FROM flights WHERE flight_id = NEW.flight_id) < NEW.passengers_count
        BEGIN
            SELECT RAISE(ABORT, 'Insufficient seats available for this flight');
        END;
    """)
    print("   ✓ Trigger created: Validates seat availability before booking\n")
    
    # ==================== VIEW 1: Flight Revenue Summary ====================
    print("6. Creating View 1: flight_revenue_summary...")
    cursor.execute("DROP VIEW IF EXISTS flight_revenue_summary")
    cursor.execute("""
        CREATE VIEW flight_revenue_summary AS
        SELECT 
            f.flight_id,
            f.flight_number,
            f.source_city,
            f.destination_city,
            a.airline_name,
            COUNT(DISTINCT b.booking_id) as total_bookings,
            SUM(b.passengers_count) as total_passengers,
            SUM(b.total_amount) as total_revenue,
            f.total_seats - f.available_seats as seats_booked,
            ROUND((CAST(f.total_seats - f.available_seats AS FLOAT) / f.total_seats * 100), 2) as occupancy_percentage
        FROM flights f
        LEFT JOIN bookings b ON f.flight_id = b.flight_id AND b.booking_status != 'cancelled'
        LEFT JOIN airlines a ON f.airline_id = a.airline_id
        GROUP BY f.flight_id
    """)
    print("   ✓ View created: Shows flight revenue and occupancy statistics\n")
    
    # ==================== VIEW 2: User Booking History ====================
    print("7. Creating View 2: user_booking_history...")
    cursor.execute("DROP VIEW IF EXISTS user_booking_history")
    cursor.execute("""
        CREATE VIEW user_booking_history AS
        SELECT 
            u.user_id,
            u.username,
            u.email,
            b.booking_id,
            b.pnr_number,
            f.flight_number,
            f.source_city,
            f.destination_city,
            a.airline_name,
            b.booking_date,
            b.travel_date,
            b.passengers_count,
            b.total_amount,
            b.booking_status,
            b.payment_status
        FROM users u
        INNER JOIN bookings b ON u.user_id = b.user_id
        INNER JOIN flights f ON b.flight_id = f.flight_id
        INNER JOIN airlines a ON f.airline_id = a.airline_id
        ORDER BY b.booking_date DESC
    """)
    print("   ✓ View created: Comprehensive user booking history\n")
    
    # ==================== VIEW 3: Daily Flight Schedule ====================
    print("8. Creating View 3: daily_flight_schedule...")
    cursor.execute("DROP VIEW IF EXISTS daily_flight_schedule")
    cursor.execute("""
        CREATE VIEW daily_flight_schedule AS
        SELECT 
            f.flight_id,
            f.flight_number,
            a.airline_name,
            a.airline_code,
            f.source_city,
            f.destination_city,
            f.departure_time_only as departure_time,
            f.arrival_time_only as arrival_time,
            f.duration_minutes,
            PRINTF('%02d:%02d', f.duration_minutes / 60, f.duration_minutes % 60) as duration_formatted,
            f.price,
            f.total_seats,
            f.flight_status
        FROM flights f
        INNER JOIN airlines a ON f.airline_id = a.airline_id
        WHERE f.is_daily = 1
        ORDER BY f.departure_time_only
    """)
    print("   ✓ View created: Shows daily flight schedule with formatted times\n")
    
    # ==================== INDEX for Performance ====================
    print("9. Creating performance indexes...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, booking_status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_route ON flights(source_city, destination_city)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name, operation)")
    print("   ✓ Performance indexes created\n")
    
    # Commit changes
    conn.commit()
    
    # ==================== VERIFICATION ====================
    print("10. Verifying database features...\n")
    
    # Count triggers
    cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='trigger'")
    trigger_count = cursor.fetchone()[0]
    print(f"   ✓ Triggers created: {trigger_count}")
    
    # Count views
    cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='view'")
    view_count = cursor.fetchone()[0]
    print(f"   ✓ Views created: {view_count}")
    
    # List all triggers
    cursor.execute("SELECT name FROM sqlite_master WHERE type='trigger'")
    triggers = cursor.fetchall()
    print(f"\n   Triggers:")
    for trigger in triggers:
        print(f"     • {trigger[0]}")
    
    # List all views
    cursor.execute("SELECT name FROM sqlite_master WHERE type='view'")
    views = cursor.fetchall()
    print(f"\n   Views:")
    for view in views:
        print(f"     • {view[0]}")
    
    conn.close()
    
    print("\n" + "="*60)
    print("✅ DATABASE FEATURES SUCCESSFULLY ADDED!")
    print("="*60)
    print("\nYour database now includes:")
    print("  • 4 Triggers (automated actions)")
    print("  • 3 Views (complex queries)")
    print("  • 1 Audit table (change tracking)")
    print("  • Performance indexes")
    print("\nAll features are production-ready and enhance your application!")
    print("="*60)

if __name__ == "__main__":
    try:
        add_database_features()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
