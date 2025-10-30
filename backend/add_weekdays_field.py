"""
Migration script to add weekdays field to flights table
Allows flights to operate on specific days of the week
"""
import sqlite3
import sys

def add_weekdays_column():
    """Add weekdays column to flights table"""
    try:
        conn = sqlite3.connect('flight_booking.db')
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(flights)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'weekdays' not in columns:
            print("Adding 'weekdays' column to flights table...")
            # Add weekdays column (stores comma-separated day numbers: 0=Monday, 6=Sunday)
            # NULL means all days, otherwise specific days like "0,2,4" for Mon,Wed,Fri
            cursor.execute("""
                ALTER TABLE flights 
                ADD COLUMN weekdays TEXT DEFAULT NULL
            """)
            conn.commit()
            print("✓ Successfully added 'weekdays' column")
        else:
            print("✓ 'weekdays' column already exists")
        
        conn.close()
        print("\n✓ Migration completed successfully!")
        return True
        
    except sqlite3.Error as e:
        print(f"✗ Database error: {e}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Flight Booking System - Add Weekdays Field Migration")
    print("=" * 60)
    print()
    
    success = add_weekdays_column()
    
    if success:
        print("\nMigration completed! You can now:")
        print("1. Set specific weekdays for flights (e.g., only Mon-Fri)")
        print("2. Users can filter flights by their preferred travel day")
        print("3. Admin can create flights that operate on specific weekdays")
        sys.exit(0)
    else:
        print("\nMigration failed!")
        sys.exit(1)
