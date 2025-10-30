"""
Script to View and Verify Database Features (Triggers, Views, Indexes)
Use this to demonstrate your database advanced features during evaluation
"""

import sqlite3
from pathlib import Path

# Database path - should match database.py
DB_PATH = Path(__file__).parent / "flight_booking.db"

def simple_table(data, headers):
    """Simple table formatter without external dependencies"""
    if not data:
        return "No data"
    
    # Calculate column widths
    col_widths = [len(str(h)) for h in headers]
    for row in data:
        for i, cell in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(cell)))
    
    # Create format string
    row_format = " | ".join([f"{{:<{w}}}" for w in col_widths])
    
    # Build table
    lines = []
    lines.append(row_format.format(*headers))
    lines.append("-" * (sum(col_widths) + 3 * (len(headers) - 1)))
    for row in data:
        lines.append(row_format.format(*[str(cell) for cell in row]))
    
    return "\n".join(lines)

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def view_all_tables():
    """Show all tables in the database"""
    print_section("📋 ALL TABLES IN DATABASE")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = cursor.fetchall()
    
    if tables:
        print("\nTables found:")
        for i, (table,) in enumerate(tables, 1):
            print(f"  {i}. {table}")
    else:
        print("  ❌ No tables found!")
    
    conn.close()

def view_all_triggers():
    """Show all triggers with their SQL definitions"""
    print_section("🔔 ALL TRIGGERS IN DATABASE")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='trigger' ORDER BY name;")
    triggers = cursor.fetchall()
    
    if triggers:
        print(f"\n✓ Found {len(triggers)} trigger(s):\n")
        for i, (name, table, sql) in enumerate(triggers, 1):
            print(f"{'─'*70}")
            print(f"Trigger #{i}: {name}")
            print(f"Table: {table}")
            print(f"Definition:")
            print(sql)
            print()
    else:
        print("\n❌ No triggers found in database!")
        print("\n💡 To add triggers, run: python setup_advanced_features.py")
    
    conn.close()

def view_all_views():
    """Show all views with their SQL definitions"""
    print_section("👁️ ALL VIEWS IN DATABASE")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='view' ORDER BY name;")
    views = cursor.fetchall()
    
    if views:
        print(f"\n✓ Found {len(views)} view(s):\n")
        for i, (name, sql) in enumerate(views, 1):
            print(f"{'─'*70}")
            print(f"View #{i}: {name}")
            print(f"Definition:")
            print(sql)
            print()
    else:
        print("\n❌ No views found in database!")
    
    conn.close()

def view_all_indexes():
    """Show all indexes"""
    print_section("📑 ALL INDEXES IN DATABASE")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name;")
    indexes = cursor.fetchall()
    
    if indexes:
        print(f"\n✓ Found {len(indexes)} index(es):\n")
        for i, (name, table, sql) in enumerate(indexes, 1):
            print(f"  {i}. {name} → on table '{table}'")
            if sql:
                print(f"     SQL: {sql}")
    else:
        print("\n❌ No custom indexes found!")
    
    conn.close()

def view_table_schema(table_name):
    """Show detailed schema of a specific table"""
    print_section(f"🏗️ SCHEMA FOR TABLE: {table_name}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        
        if columns:
            headers = ["Column ID", "Name", "Type", "Not Null", "Default", "Primary Key"]
            print("\n" + simple_table(columns, headers))
        else:
            print(f"\n❌ Table '{table_name}' not found!")
    except sqlite3.Error as e:
        print(f"\n❌ Error: {e}")
    
    conn.close()

def test_trigger_seat_update():
    """Demonstrate trigger in action"""
    print_section("🧪 TESTING TRIGGER: Seat Update on Booking")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Find a flight with available seats
        cursor.execute("""
            SELECT flight_id, flight_number, available_seats, total_seats 
            FROM flights 
            WHERE is_daily = 0 AND available_seats > 0 
            LIMIT 1
        """)
        
        result = cursor.fetchone()
        if result:
            flight_id, flight_number, available_seats, total_seats = result
            print(f"\n📊 BEFORE Booking:")
            print(f"   Flight: {flight_number}")
            print(f"   Available Seats: {available_seats}/{total_seats}")
            print(f"\n💡 If trigger exists, booking a flight will automatically")
            print(f"   reduce available_seats without manual UPDATE statement")
            print(f"\n✓ This is what your trigger does automatically!")
        else:
            print("\n❌ No flights with available seats found for testing")
    
    except sqlite3.Error as e:
        print(f"\n❌ Error: {e}")
    
    conn.close()

def show_sample_queries():
    """Show sample queries to demonstrate database"""
    print_section("📝 SAMPLE QUERIES FOR DEMONSTRATION")
    
    queries = [
        ("1. View all confirmed bookings", """
SELECT b.booking_reference, u.username, f.flight_number, 
       f.source_city || ' → ' || f.destination_city AS route,
       b.total_amount
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN flights f ON b.flight_id = f.flight_id
WHERE b.booking_status = 'confirmed'
LIMIT 5;
"""),
        
        ("2. Calculate total revenue", """
SELECT 
    COUNT(*) AS total_payments,
    SUM(amount) AS total_revenue,
    AVG(amount) AS avg_payment
FROM payments
WHERE payment_status = 'completed';
"""),
        
        ("3. Find flights with high occupancy", """
SELECT 
    flight_number,
    source_city,
    destination_city,
    total_seats,
    available_seats,
    ROUND((total_seats - available_seats)*100.0/total_seats, 2) AS occupancy_pct
FROM flights
WHERE is_daily = 0
  AND (total_seats - available_seats)*100.0/total_seats > 50
ORDER BY occupancy_pct DESC;
"""),
        
        ("4. User booking statistics", """
SELECT 
    u.username,
    u.email,
    COUNT(b.booking_id) AS total_bookings,
    SUM(b.total_amount) AS total_spent
FROM users u
LEFT JOIN bookings b ON u.user_id = b.user_id
WHERE b.booking_status = 'confirmed'
GROUP BY u.user_id
ORDER BY total_spent DESC;
"""),
    ]
    
    for title, query in queries:
        print(f"\n{title}:")
        print("─" * 70)
        print(query.strip())

def execute_sample_query(query_num):
    """Execute one of the sample queries"""
    queries = [
        """SELECT b.booking_reference, u.username, f.flight_number, 
           f.source_city || ' → ' || f.destination_city AS route, b.total_amount
           FROM bookings b
           JOIN users u ON b.user_id = u.user_id
           JOIN flights f ON b.flight_id = f.flight_id
           WHERE b.booking_status = 'confirmed' LIMIT 5;""",
        
        """SELECT COUNT(*) AS total_payments, SUM(amount) AS total_revenue, 
           AVG(amount) AS avg_payment FROM payments WHERE payment_status = 'completed';""",
        
        """SELECT flight_number, source_city, destination_city, total_seats, available_seats,
           ROUND((total_seats - available_seats)*100.0/total_seats, 2) AS occupancy_pct
           FROM flights WHERE is_daily = 0 
           AND (total_seats - available_seats)*100.0/total_seats > 0
           ORDER BY occupancy_pct DESC LIMIT 5;""",
        
        """SELECT u.username, u.email, COUNT(b.booking_id) AS total_bookings,
           SUM(b.total_amount) AS total_spent FROM users u
           LEFT JOIN bookings b ON u.user_id = b.user_id
           WHERE b.booking_status = 'confirmed' GROUP BY u.user_id
           ORDER BY total_spent DESC LIMIT 5;""",
    ]
    
    if 1 <= query_num <= len(queries):
        print_section(f"🔍 EXECUTING QUERY #{query_num}")
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        try:
            cursor.execute(queries[query_num - 1])
            results = cursor.fetchall()
            
            if results:
                print("\nResults:")
                # Get column names
                col_names = [description[0] for description in cursor.description]
                print(simple_table(results, col_names))
            else:
                print("\n📭 No results found")
        except sqlite3.Error as e:
            print(f"\n❌ Error: {e}")
        
        conn.close()

def interactive_menu():
    """Interactive menu to explore database"""
    while True:
        print("\n" + "="*70)
        print("  🗄️  DATABASE FEATURES VIEWER - Interactive Menu")
        print("="*70)
        print("\n📋 Database Structure:")
        print("  1. View all tables")
        print("  2. View table schema (e.g., users, flights, bookings)")
        print("\n🔧 Advanced Features:")
        print("  3. View all triggers")
        print("  4. View all views")
        print("  5. View all indexes")
        print("\n🧪 Testing:")
        print("  6. Test trigger functionality")
        print("\n📊 Sample Queries:")
        print("  7. Show sample queries")
        print("  8. Execute sample query #1 (Confirmed bookings)")
        print("  9. Execute sample query #2 (Revenue)")
        print("  10. Execute sample query #3 (High occupancy)")
        print("  11. Execute sample query #4 (User statistics)")
        print("\n📄 Reports:")
        print("  12. Generate complete database report")
        print("\n  0. Exit")
        print("="*70)
        
        try:
            choice = input("\n👉 Enter your choice (0-12): ").strip()
            
            if choice == "0":
                print("\n✅ Thank you! Good luck with your evaluation! 🎓\n")
                break
            elif choice == "1":
                view_all_tables()
            elif choice == "2":
                table = input("Enter table name (e.g., users, flights, bookings): ").strip()
                if table:
                    view_table_schema(table)
            elif choice == "3":
                view_all_triggers()
            elif choice == "4":
                view_all_views()
            elif choice == "5":
                view_all_indexes()
            elif choice == "6":
                test_trigger_seat_update()
            elif choice == "7":
                show_sample_queries()
            elif choice in ["8", "9", "10", "11"]:
                execute_sample_query(int(choice) - 7)
            elif choice == "12":
                generate_full_report()
            else:
                print("\n❌ Invalid choice! Please enter 0-12")
            
            input("\n⏸️  Press Enter to continue...")
        
        except KeyboardInterrupt:
            print("\n\n✅ Exiting... Good luck! 🎓\n")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")

def generate_full_report():
    """Generate complete database report"""
    print_section("📄 COMPLETE DATABASE REPORT")
    
    print("\n🔍 Generating comprehensive report...\n")
    
    view_all_tables()
    view_all_triggers()
    view_all_views()
    view_all_indexes()
    
    print_section("✅ REPORT GENERATION COMPLETE")
    print("\n💡 TIP: You can screenshot this output for your documentation!")

if __name__ == "__main__":
    print("\n" + "="*70)
    print("  🗄️  FLIGHT BOOKING SYSTEM - DATABASE FEATURES VIEWER")
    print("  For DBMS Project Evaluation & Demonstration")
    print("="*70)
    
    # Check if database exists
    if not DB_PATH.exists():
        print("\n❌ ERROR: Database file 'booking.db' not found!")
        print("📁 Expected location:", DB_PATH)
        print("\n💡 Make sure your backend is initialized:")
        print("   python -m uvicorn main:app --reload")
        exit(1)
    
    print(f"\n✓ Database found: {DB_PATH}")
    print("\nStarting interactive viewer...\n")
    
    try:
        interactive_menu()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("Please ensure the database is not corrupted.")
