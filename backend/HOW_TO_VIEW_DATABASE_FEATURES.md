# How to View Database Triggers and Features

## Quick Start Guide

This guide shows you how to view and demonstrate all database triggers, views, and other features for your DBMS project evaluation.

---

## Step 1: Setup Database Features (One-Time)

Run this command once to install all triggers, views, and indexes:

```powershell
cd c:\flight-booking-system\backend
.\venv\Scripts\Activate.ps1
python setup_advanced_features.py
```

**Expected Output:**
```
✓ Trigger 1 created successfully
✓ Trigger 2 created successfully
✓ Trigger 3 created successfully
✓ View 1 created successfully
...
✓ 7 Triggers installed
✓ 6 Views installed
✓ 7 Indexes installed
```

---

## Step 2: View Database Features (Anytime)

Run the interactive viewer:

```powershell
cd c:\flight-booking-system\backend
.\venv\Scripts\Activate.ps1
python view_database_features.py
```

---

## Interactive Menu Options

### 📋 Database Structure

**1. View all tables**
- Shows all 5 tables: users, airlines, flights, bookings, payments
- Lists existing tables in the database

**2. View table schema**
- Enter table name (e.g., `flights`, `bookings`)
- Shows all columns with data types, constraints
- Useful for demonstrating database design

### 🔧 Advanced Features

**3. View all triggers** ⭐ **MOST IMPORTANT FOR VIVA**
- Shows all 7 triggers with SQL definitions
- Includes:
  - `update_available_seats_on_booking` - Reduces seats when booking confirmed
  - `restore_seats_after_cancellation` - Restores seats when booking cancelled
  - `prevent_overbooking` - Prevents booking if insufficient seats
  - `validate_flight_capacity` - Validates seat availability before insert
  - `audit_booking_changes` - Logs status changes to audit table
  - And 2 more...

**4. View all views**
- Shows 6 database views with SQL definitions:
  - `booking_details` - Complete booking information with joins
  - `flight_occupancy` - Seat occupancy calculations
  - `revenue_report` - Revenue analytics
  - `user_booking_history` - User's booking history
  - `flight_revenue_summary` - Flight-wise revenue
  - `daily_flight_schedule` - Daily flight schedules

**5. View all indexes**
- Shows 7 performance indexes
- Demonstrates query optimization

### 🧪 Testing

**6. Test trigger functionality**
- Actually executes a booking to demonstrate trigger
- Shows seats decreasing in real-time
- Proves triggers are working

### 📊 Sample Queries

**7. Show sample queries**
- Displays 4 pre-written analytical queries
- Good for understanding query complexity

**8-11. Execute sample queries**
- Query #1: Confirmed bookings with joins
- Query #2: Total revenue calculations
- Query #3: High occupancy flights (>50%)
- Query #4: User booking statistics

### 📄 Reports

**12. Generate complete database report**
- Comprehensive report with all features
- Shows tables, triggers, views, indexes
- Perfect for documentation

---

## Common Usage Scenarios

### During DBMS Viva

**Examiner: "Show me your triggers"**
```
Choose option: 3
```
All 7 triggers will be displayed with SQL code.

**Examiner: "How do triggers work?"**
```
Choose option: 6
```
Live demonstration of trigger in action.

**Examiner: "Show your views"**
```
Choose option: 4
```
All 6 views displayed with definitions.

**Examiner: "Demonstrate a complex query"**
```
Choose options: 8, 9, 10, or 11
```
Executes analytical queries with formatted results.

### For Project Documentation

**Generate full report:**
```
Choose option: 12
```
Complete report saved for documentation.

---

## Key Features for Evaluation

### ✅ 7 Triggers Implemented
1. **Seat Management** - Auto-updates available seats
2. **Overbooking Prevention** - Validates capacity
3. **Audit Trail** - Logs all booking changes
4. **Data Integrity** - Enforces business rules

### ✅ 6 Views Created
1. **booking_details** - Multi-table joins
2. **flight_occupancy** - Calculated fields
3. **revenue_report** - Aggregations
4. **user_booking_history** - User-specific data

### ✅ 7 Indexes for Performance
- Optimizes queries on frequently accessed columns
- Demonstrates understanding of query performance

---

## Database Files

- **Main Database:** `flight_booking.db`
- **Triggers SQL:** `triggers_and_procedures.sql`
- **Setup Script:** `setup_advanced_features.py`
- **Viewer Tool:** `view_database_features.py`

---

## Troubleshooting

### "No triggers found"
Run setup script first:
```powershell
python setup_advanced_features.py
```

### "Database not found"
Make sure backend is running at least once to create database:
```powershell
python -m uvicorn main:app --reload
```
Then press Ctrl+C after it starts.

### "No such table"
Database not initialized. Start backend server to create tables.

---

## Tips for Evaluation

1. **Practice beforehand** - Run through all menu options
2. **Option 3 is crucial** - Examiners always ask about triggers
3. **Option 6 is impressive** - Live trigger demonstration
4. **Option 12** - Keep full report ready for submission
5. **Know your SQL** - Be ready to explain trigger logic

---

## Quick Command Reference

```powershell
# Activate environment
cd c:\flight-booking-system\backend
.\venv\Scripts\Activate.ps1

# Install triggers (one-time)
python setup_advanced_features.py

# View features (anytime)
python view_database_features.py

# Start backend (if needed)
python -m uvicorn main:app --reload
```

---

## Summary

✅ **7 triggers** for automatic database operations  
✅ **6 views** for complex queries  
✅ **7 indexes** for performance optimization  
✅ **Interactive viewer** for demonstrations  
✅ **Report generator** for documentation  

**You're all set for your DBMS project evaluation!** 🎓
