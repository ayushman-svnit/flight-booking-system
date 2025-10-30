from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean, Enum, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import enum
from datetime import datetime
import os

# Use SQLite for simplicity
DATABASE_URL = "sqlite:///./flight_booking.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserType(enum.Enum):
    admin = "admin"
    user = "user"

class FlightStatus(enum.Enum):
    scheduled = "scheduled"
    delayed = "delayed"
    cancelled = "cancelled"
    completed = "completed"

class BookingStatus(enum.Enum):
    confirmed = "confirmed"
    pending = "pending"
    cancelled = "cancelled"
    completed = "completed"

class PaymentStatus(enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"

class PaymentMethod(enum.Enum):
    credit_card = "credit_card"
    debit_card = "debit_card"
    upi = "upi"
    net_banking = "net_banking"

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone_number = Column(String(15))
    user_type = Column(String(10), default="user")  # Changed from Enum to String
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    flights_created = relationship("Flight", back_populates="creator")
    bookings = relationship("Booking", back_populates="user")

class Airline(Base):
    __tablename__ = "airlines"
    
    airline_id = Column(Integer, primary_key=True, index=True)
    airline_name = Column(String(100), nullable=False)
    airline_code = Column(String(5), unique=True, nullable=False)
    contact_number = Column(String(15))
    email = Column(String(100))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    flights = relationship("Flight", back_populates="airline")

class Flight(Base):
    __tablename__ = "flights"
    
    flight_id = Column(Integer, primary_key=True, index=True)
    flight_number = Column(String(10), unique=True, nullable=False)
    airline_id = Column(Integer, ForeignKey("airlines.airline_id"))
    source_city = Column(String(50), nullable=False)
    destination_city = Column(String(50), nullable=False)
    departure_time = Column(DateTime, nullable=False)
    arrival_time = Column(DateTime, nullable=False)
    total_seats = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    flight_status = Column(String(20), default="scheduled")  # Changed from Enum
    is_daily = Column(Boolean, default=False)  # New field for daily flights
    departure_time_only = Column(String(8))  # Store time as HH:MM:SS for daily flights
    arrival_time_only = Column(String(8))  # Store time as HH:MM:SS for daily flights
    duration_minutes = Column(Integer)  # Flight duration in minutes
    weekdays = Column(String(50))  # Comma-separated day numbers (0=Mon, 6=Sun), NULL=all days
    created_by = Column(Integer, ForeignKey("users.user_id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    airline = relationship("Airline", back_populates="flights")
    creator = relationship("User", back_populates="flights_created")
    bookings = relationship("Booking", back_populates="flight")

class Booking(Base):
    __tablename__ = "bookings"
    
    booking_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    flight_id = Column(Integer, ForeignKey("flights.flight_id"))
    booking_date = Column(DateTime, default=datetime.utcnow)
    travel_date = Column(DateTime)  # New field for selected travel date (for daily flights)
    passengers_count = Column(Integer, nullable=False)
    total_amount = Column(Float, nullable=False)
    booking_status = Column(String(20), default="confirmed")  # Changed from Enum
    payment_status = Column(String(20), default="pending")  # Changed from Enum
    pnr_number = Column(String(10), unique=True, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="bookings")
    flight = relationship("Flight", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False)

class Payment(Base):
    __tablename__ = "payments"
    
    payment_id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id"))
    payment_amount = Column(Float, nullable=False)
    payment_method = Column(String(20), nullable=False)  # Changed from Enum
    payment_date = Column(DateTime, default=datetime.utcnow)
    transaction_id = Column(String(100), unique=True)
    payment_status = Column(String(20), default="pending")  # Changed from Enum
    
    # Relationships
    booking = relationship("Booking", back_populates="payment")

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Initialize with sample data
def init_data():
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            # Create admin user with password 'admin123'
            from auth import get_password_hash
            admin_user = User(
                username="admin",
                email="admin@flight.com",
                password_hash=get_password_hash("admin123"),
                first_name="System",
                last_name="Admin",
                user_type="admin"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        
        # Check if airlines exist
        if db.query(Airline).count() == 0:
            airlines = [
                Airline(
                    airline_name="Air India",
                    airline_code="AI",
                    contact_number="18001801407",
                    email="contact@airindia.com"
                ),
                Airline(
                    airline_name="IndiGo",
                    airline_code="6E",
                    contact_number="01244637979",
                    email="customercare@goindigo.in"
                ),
                Airline(
                    airline_name="SpiceJet",
                    airline_code="SG",
                    contact_number="9876543210",
                    email="care@spicejet.com"
                )
            ]
            db.add_all(airlines)
            db.commit()
        
        # Check if flights exist
        if db.query(Flight).count() == 0:
            from datetime import datetime, timedelta
            flights = [
                Flight(
                    flight_number="AI101",
                    airline_id=1,
                    source_city="Delhi",
                    destination_city="Mumbai",
                    departure_time=datetime.utcnow() + timedelta(days=1),
                    arrival_time=datetime.utcnow() + timedelta(days=1, hours=2),
                    total_seats=180,
                    available_seats=180,
                    price=4500.00,
                    created_by=admin_user.user_id
                ),
                Flight(
                    flight_number="6E202",
                    airline_id=2,
                    source_city="Mumbai",
                    destination_city="Chennai",
                    departure_time=datetime.utcnow() + timedelta(days=1, hours=4),
                    arrival_time=datetime.utcnow() + timedelta(days=1, hours=6),
                    total_seats=162,
                    available_seats=162,
                    price=3200.00,
                    created_by=admin_user.user_id
                ),
                Flight(
                    flight_number="SG305",
                    airline_id=3,
                    source_city="Bangalore",
                    destination_city="Delhi",
                    departure_time=datetime.utcnow() + timedelta(days=2),
                    arrival_time=datetime.utcnow() + timedelta(days=2, hours=2),
                    total_seats=144,
                    available_seats=144,
                    price=5200.00,
                    created_by=admin_user.user_id
                )
            ]
            db.add_all(flights)
            db.commit()
            
    except Exception as e:
        print(f"Error initializing data: {e}")
    finally:
        db.close()