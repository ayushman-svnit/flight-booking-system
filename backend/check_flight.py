import sqlite3

conn = sqlite3.connect('flight_booking.db')
cursor = conn.cursor()

# Check AI261 flight
print("=== AI261 Flight Details ===")
cursor.execute("""
    SELECT flight_number, source_city, destination_city, 
           total_seats, available_seats, weekdays, is_daily
    FROM flights 
    WHERE flight_number = ?
""", ('AI261',))
row = cursor.fetchone()
if row:
    print(f"Flight: {row[0]}")
    print(f"Route: {row[1]} -> {row[2]}")
    print(f"Total Seats: {row[3]}")
    print(f"Available Seats: {row[4]}")
    print(f"Weekdays: {row[5]}")
    print(f"Is Daily: {row[6]}")
else:
    print("Flight AI261 not found!")

print("\n=== All Delhi -> Boston Flights ===")
cursor.execute("""
    SELECT flight_number, total_seats, available_seats, weekdays
    FROM flights 
    WHERE source_city = ? AND destination_city = ?
""", ('Delhi', 'Boston'))
rows = cursor.fetchall()
if rows:
    for row in rows:
        print(f"{row[0]}: Total={row[1]}, Available={row[2]}, Weekdays={row[3]}")
else:
    print("No flights found!")

conn.close()
