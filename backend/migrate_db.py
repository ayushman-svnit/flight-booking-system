"""
Database migration script to add daily flight functionality
"""
import sqlite3
from datetime import datetime

def migrate_database():
    conn = sqlite3.connect('flight_booking.db')
    cursor = conn.cursor()
    
    try:
        # Add new columns to flights table
        cursor.execute('ALTER TABLE flights ADD COLUMN is_daily BOOLEAN DEFAULT 0')
        print("Added is_daily column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("is_daily column already exists")
        else:
            print(f"Error adding is_daily: {e}")
    
    try:
        cursor.execute('ALTER TABLE flights ADD COLUMN departure_time_only VARCHAR(8)')
        print("Added departure_time_only column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("departure_time_only column already exists")
        else:
            print(f"Error adding departure_time_only: {e}")
    
    try:
        cursor.execute('ALTER TABLE flights ADD COLUMN arrival_time_only VARCHAR(8)')
        print("Added arrival_time_only column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("arrival_time_only column already exists")
        else:
            print(f"Error adding arrival_time_only: {e}")
    
    try:
        cursor.execute('ALTER TABLE flights ADD COLUMN duration_minutes INTEGER')
        print("Added duration_minutes column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("duration_minutes column already exists")
        else:
            print(f"Error adding duration_minutes: {e}")
    
    try:
        cursor.execute('ALTER TABLE bookings ADD COLUMN travel_date DATETIME')
        print("Added travel_date column to bookings")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("travel_date column already exists")
        else:
            print(f"Error adding travel_date: {e}")
    
    # Add some sample daily flights
    try:
        # Check if we have any daily flights
        cursor.execute('SELECT COUNT(*) FROM flights WHERE is_daily = 1')
        daily_count = cursor.fetchone()[0]
        
        if daily_count == 0:
            print("Adding sample daily flights...")
            
            # Add a daily flight from Delhi to Mumbai
            cursor.execute('''
                INSERT INTO flights (
                    flight_number, airline_id, source_city, destination_city,
                    departure_time, arrival_time, total_seats, available_seats,
                    price, flight_status, is_daily, departure_time_only,
                    arrival_time_only, duration_minutes, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                'AI500', 1, 'Delhi', 'Mumbai',
                datetime(2025, 10, 22, 6, 0, 0),  # Tomorrow 6 AM
                datetime(2025, 10, 22, 8, 30, 0),  # Tomorrow 8:30 AM
                180, 180, 5500.00, 'scheduled', 1,
                '06:00:00', '08:30:00', 150, 1,
                datetime.now()
            ))
            
            # Add a daily flight from Mumbai to Bangalore
            cursor.execute('''
                INSERT INTO flights (
                    flight_number, airline_id, source_city, destination_city,
                    departure_time, arrival_time, total_seats, available_seats,
                    price, flight_status, is_daily, departure_time_only,
                    arrival_time_only, duration_minutes, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                '6E100', 2, 'Mumbai', 'Bangalore',
                datetime(2025, 10, 22, 14, 30, 0),  # Tomorrow 2:30 PM
                datetime(2025, 10, 22, 16, 0, 0),   # Tomorrow 4:00 PM
                162, 162, 3800.00, 'scheduled', 1,
                '14:30:00', '16:00:00', 90, 1,
                datetime.now()
            ))
            
            print("Added sample daily flights")
    
    except Exception as e:
        print(f"Error adding sample flights: {e}")
    
    conn.commit()
    conn.close()
    print("Database migration completed successfully!")

if __name__ == "__main__":
    migrate_database()