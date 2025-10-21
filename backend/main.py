from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import secrets

from database import SessionLocal, create_tables, init_data, User, Flight, Booking, Payment, Airline
import models
import auth

app = FastAPI(title="Flight Booking System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables and initialize data on startup
@app.on_event("startup")
def startup_event():
    create_tables()
    init_data()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth endpoints
@app.post("/register", response_model=models.UserResponse)
def register(user: models.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(
        (User.username == user.username) | 
        (User.email == user.email)
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    # Create new user
    hashed_password = auth.get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        user_type=user.user_type
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login")
def login(user_data: models.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not auth.verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = auth.create_access_token(
        data={
            "sub": user.username, 
            "user_type": user.user_type, 
            "user_id": user.user_id
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": user.user_type,
        "user_id": user.user_id
    }

# Flight endpoints
@app.get("/flights", response_model=List[models.FlightResponse])
def get_flights(
    source: str = None,
    destination: str = None,
    date: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Flight).filter(Flight.available_seats > 0)
    
    if source:
        query = query.filter(Flight.source_city == source)
    if destination:
        query = query.filter(Flight.destination_city == destination)
    if date:
        query = query.filter(Flight.departure_time >= date)
    
    return query.all()

@app.post("/flights", response_model=models.FlightResponse)
def create_flight(
    flight: models.FlightCreate,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate duration and time-only fields for daily flights
    duration_minutes = None
    departure_time_only = None
    arrival_time_only = None
    
    if flight.is_daily:
        # Calculate duration in minutes
        duration = flight.arrival_time - flight.departure_time
        duration_minutes = int(duration.total_seconds() / 60)
        
        # Extract time components for daily flights
        departure_time_only = flight.departure_time.strftime("%H:%M:%S")
        arrival_time_only = flight.arrival_time.strftime("%H:%M:%S")
    
    db_flight = Flight(
        flight_number=flight.flight_number,
        airline_id=flight.airline_id,
        source_city=flight.source_city,
        destination_city=flight.destination_city,
        departure_time=flight.departure_time,
        arrival_time=flight.arrival_time,
        total_seats=flight.total_seats,
        price=flight.price,
        is_daily=flight.is_daily or False,
        departure_time_only=departure_time_only,
        arrival_time_only=arrival_time_only,
        duration_minutes=duration_minutes,
        available_seats=flight.total_seats,
        created_by=current_user.user_id
    )
    
    db.add(db_flight)
    db.commit()
    db.refresh(db_flight)
    return db_flight

# Booking endpoints
@app.post("/bookings", response_model=models.BookingResponse)
def create_booking(
    booking: models.BookingCreate,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Get flight
    flight = db.query(Flight).filter(Flight.flight_id == booking.flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # For daily flights, validate travel_date is provided
    if flight.is_daily and not booking.travel_date:
        raise HTTPException(status_code=400, detail="Travel date is required for daily flights")
    
    # For daily flights, check if travel_date is in the future
    if flight.is_daily and booking.travel_date:
        from datetime import date
        if booking.travel_date.date() <= date.today():
            raise HTTPException(status_code=400, detail="Travel date must be in the future")
    
    if flight.available_seats < booking.passengers_count:
        raise HTTPException(status_code=400, detail="Not enough seats available")
    
    # Calculate total amount
    total_amount = flight.price * booking.passengers_count
    
    # Generate PNR
    pnr_number = secrets.token_hex(5).upper()
    
    # Create booking
    db_booking = Booking(
        user_id=current_user.user_id,
        flight_id=booking.flight_id,
        travel_date=booking.travel_date if flight.is_daily else None,
        passengers_count=booking.passengers_count,
        total_amount=total_amount,
        pnr_number=pnr_number
    )
    
    # For regular flights, update available seats
    # For daily flights, we don't reduce available seats as they operate daily
    if not flight.is_daily:
        flight.available_seats -= booking.passengers_count
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    # Create payment record
    db_payment = Payment(
        booking_id=db_booking.booking_id,
        payment_amount=total_amount,
        payment_method=booking.payment_method,
        transaction_id=f"TXN{secrets.token_hex(8)}".upper(),
        payment_status="completed"
    )
    
    db.add(db_payment)
    db.commit()
    
    # Update booking payment status
    db_booking.payment_status = "completed"
    db.commit()
    db.refresh(db_booking)
    
    return db_booking

@app.get("/bookings", response_model=List[models.BookingResponse])
def get_user_bookings(
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Booking).filter(Booking.user_id == current_user.user_id).all()

@app.delete("/bookings/{booking_id}")
def delete_user_booking(
    booking_id: int,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Get the booking
    booking = db.query(Booking).filter(
        Booking.booking_id == booking_id,
        Booking.user_id == current_user.user_id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not authorized")
    
    # Check if booking can be cancelled (e.g., not for past travel dates)
    if booking.travel_date:
        from datetime import date
        if booking.travel_date.date() <= date.today():
            raise HTTPException(
                status_code=400, 
                detail="Cannot cancel booking for past or current travel date"
            )
    else:
        # For non-daily flights, check departure time
        flight = db.query(Flight).filter(Flight.flight_id == booking.flight_id).first()
        if flight and flight.departure_time.date() <= datetime.now().date():
            raise HTTPException(
                status_code=400, 
                detail="Cannot cancel booking for past or current flight"
            )
    
    # Check if booking is already cancelled
    if booking.booking_status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")
    
    # Get the flight to restore seats (for non-daily flights)
    flight = db.query(Flight).filter(Flight.flight_id == booking.flight_id).first()
    
    # Cancel the booking
    booking.booking_status = "cancelled"
    
    # For non-daily flights, restore the seats
    if flight and not flight.is_daily:
        flight.available_seats += booking.passengers_count
    
    # Update payment status
    booking.payment_status = "refunded"
    
    db.commit()
    
    return {
        "message": "Booking cancelled successfully",
        "booking_id": booking_id,
        "refund_amount": booking.total_amount
    }

# Admin endpoints
@app.get("/admin/flights", response_model=List[models.FlightResponse])
def get_all_flights(
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return db.query(Flight).all()

@app.delete("/admin/flights/{flight_id}")
def delete_flight(
    flight_id: int,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if flight exists
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Check if there are any bookings for this flight
    existing_bookings = db.query(Booking).filter(
        Booking.flight_id == flight_id,
        Booking.booking_status.in_(["confirmed", "pending"])
    ).count()
    
    if existing_bookings > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete flight. {existing_bookings} active booking(s) exist for this flight."
        )
    
    # Delete the flight
    db.delete(flight)
    db.commit()
    
    return {"message": "Flight deleted successfully", "flight_id": flight_id}

@app.get("/admin/bookings", response_model=List[models.BookingResponse])
def get_all_bookings(
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return db.query(Booking).all()

# Utility endpoints
@app.get("/cities")
def get_cities(db: Session = Depends(get_db)):
    sources = db.query(Flight.source_city).distinct().all()
    destinations = db.query(Flight.destination_city).distinct().all()
    
    return {
        "sources": [s[0] for s in sources],
        "destinations": [d[0] for d in destinations]
    }

@app.get("/airlines")
def get_airlines(db: Session = Depends(get_db)):
    airlines = db.query(Airline).all()
    return [{"airline_id": a.airline_id, "airline_name": a.airline_name} for a in airlines]

# Health check
@app.get("/")
def read_root():
    return {"message": "Flight Booking System API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)