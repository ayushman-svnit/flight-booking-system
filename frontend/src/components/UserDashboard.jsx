import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UserDashboard = () => {
  const { user, logout, API_BASE } = useAuth();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [cities, setCities] = useState({ sources: [], destinations: [] });
  const [searchParams, setSearchParams] = useState({
    source: "",
    destination: "",
    date: "",
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedTravelDate, setSelectedTravelDate] = useState("");
  const [deletingBookingId, setDeletingBookingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchCities();
    fetchBookings();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await axios.get(`${API_BASE}/cities`);
      setCities(response.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await axios.get(`${API_BASE}/bookings`);
      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const searchFlights = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.source) params.append("source", searchParams.source);
      if (searchParams.destination)
        params.append("destination", searchParams.destination);
      if (searchParams.date) params.append("date", searchParams.date);

      const response = await axios.get(`${API_BASE}/flights?${params}`);
      setFlights(response.data);
    } catch (error) {
      console.error("Error searching flights:", error);
    }
    setLoading(false);
  };

  const bookFlight = async (flightId, passengers, travelDate = null) => {
    try {
      const bookingData = {
        flight_id: flightId,
        passengers_count: passengers,
        payment_method: "credit_card",
      };
      
      if (travelDate) {
        bookingData.travel_date = travelDate;
      }
      
      await axios.post(`${API_BASE}/bookings`, bookingData);
      alert("Booking successful!");
      fetchBookings();
      searchFlights();
      setShowDateSelector(false);
      setSelectedFlight(null);
      setSelectedTravelDate("");
    } catch (error) {
      alert(
        "Booking failed: " + (error.response?.data?.detail || "Unknown error")
      );
    }
  };

  const handleBookingClick = (flight) => {
    const passengers = prompt("Enter number of passengers:");
    if (passengers && !isNaN(passengers)) {
      if (flight.is_daily) {
        setSelectedFlight({ ...flight, passengers: parseInt(passengers) });
        setShowDateSelector(true);
      } else {
        bookFlight(flight.flight_id, parseInt(passengers));
      }
    }
  };

  const confirmDailyFlightBooking = () => {
    if (selectedTravelDate && selectedFlight) {
      bookFlight(
        selectedFlight.flight_id, 
        selectedFlight.passengers, 
        selectedTravelDate
      );
    } else {
      alert("Please select a travel date");
    }
  };

  const handleDeleteBooking = (booking) => {
    setBookingToDelete(booking);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;
    
    setDeletingBookingId(bookingToDelete.booking_id);
    
    try {
      const response = await axios.delete(
        `${API_BASE}/bookings/${bookingToDelete.booking_id}`
      );
      
      // Show success notification
      setNotification({
        type: 'success',
        message: `Booking cancelled successfully! Refund of ₹${response.data.refund_amount} will be processed.`
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
      
      // Refresh bookings and flights
      await fetchBookings();
      if (activeTab === "search") {
        await searchFlights();
      }
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to cancel booking";
      setNotification({
        type: 'error',
        message: `Error: ${errorMessage}`
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setDeletingBookingId(null);
      setShowDeleteConfirm(false);
      setBookingToDelete(null);
    }
  };

  const canCancelBooking = (booking) => {
    // Check if booking is already cancelled
    if (booking.booking_status === "cancelled") {
      return false;
    }
    
    // Check if travel date is in the future
    if (booking.travel_date) {
      const travelDate = new Date(booking.travel_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return travelDate > today;
    }
    
    return true; // For non-daily flights, allow cancellation (backend will validate)
  };

  const handleLogout = () => {
    logout();
    navigate("/login"); // Redirect after logout
  };

  return (
    <div className="dashboard">
      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="notification-message">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="notification-close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <header className="dashboard-header">
        <div className="header-content">
          <h1>Flight Booking System</h1>
          <div className="user-info">
            <span>Welcome, {user?.username}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <div className="nav-content">
          <button
            onClick={() => setActiveTab("search")}
            className={`nav-button ${activeTab === "search" ? "active" : ""}`}
          >
            Search Flights
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`nav-button ${activeTab === "bookings" ? "active" : ""}`}
          >
            My Bookings
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        {activeTab === "search" && (
          <div className="tab-content">
            <div className="card">
              <h2>Search Flights</h2>

              <div className="search-form">
                <div className="form-group">
                  <label>From</label>
                  <select
                    value={searchParams.source}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        source: e.target.value,
                      })
                    }
                    className="form-input"
                  >
                    <option value="">Select Source</option>
                    {cities.sources.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>To</label>
                  <select
                    value={searchParams.destination}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        destination: e.target.value,
                      })
                    }
                    className="form-input"
                  >
                    <option value="">Select Destination</option>
                    {cities.destinations.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={searchParams.date}
                    onChange={(e) =>
                      setSearchParams({ ...searchParams, date: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <button
                    onClick={searchFlights}
                    disabled={loading}
                    className="search-button"
                  >
                    {loading ? "Searching..." : "Search Flights"}
                  </button>
                </div>
              </div>

              <div className="flights-list">
                {flights.map((flight) => (
                  <div key={flight.flight_id} className="flight-card">
                    <div className="flight-info">
                      <div className="flight-header">
                        <h3>{flight.flight_number}</h3>
                        {flight.is_daily && (
                          <span className="daily-badge">
                            🔄 Daily Flight
                          </span>
                        )}
                      </div>
                      <p className="route">
                        {flight.source_city} → {flight.destination_city}
                      </p>
                      {flight.is_daily ? (
                        <>
                          <p className="flight-time">
                            Departure: {flight.departure_time_only || 
                              new Date(flight.departure_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} (Daily)
                          </p>
                          <p className="flight-time">
                            Arrival: {flight.arrival_time_only || 
                              new Date(flight.arrival_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} (Daily)
                          </p>
                          <p className="flight-duration">
                            Duration: {flight.duration_minutes ? 
                              `${Math.floor(flight.duration_minutes / 60)}h ${flight.duration_minutes % 60}m` :
                              'N/A'
                            }
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="flight-time">
                            Departure:{" "}
                            {new Date(flight.departure_time).toLocaleString()}
                          </p>
                          <p className="flight-time">
                            Arrival:{" "}
                            {new Date(flight.arrival_time).toLocaleString()}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flight-actions">
                      <p className="flight-price">₹{flight.price.toLocaleString()}</p>
                      <p className="flight-seats">
                        {flight.is_daily ? (
                          `${flight.total_seats} seats available daily`
                        ) : (
                          `${flight.available_seats} seats available`
                        )}
                      </p>
                      <button
                        onClick={() => handleBookingClick(flight)}
                        className="book-button"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}

                {flights.length === 0 && !loading && (
                  <p className="no-results">
                    No flights found. Try different search criteria.
                  </p>
                )}
              </div>

              {/* Daily Flight Date Selector Modal */}
              {showDateSelector && selectedFlight && (
                <div className="modal-overlay">
                  <div className="date-selector-modal">
                    <h3>Select Travel Date</h3>
                    <p className="modal-flight-info">
                      Flight: {selectedFlight.flight_number}<br />
                      Route: {selectedFlight.source_city} → {selectedFlight.destination_city}<br />
                      Passengers: {selectedFlight.passengers}<br />
                      Daily Departure: {selectedFlight.departure_time_only || 
                        new Date(selectedFlight.departure_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                    </p>
                    <div className="modal-form">
                      <label>Travel Date:</label>
                      <input
                        type="date"
                        value={selectedTravelDate}
                        onChange={(e) => setSelectedTravelDate(e.target.value)}
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                        className="form-input"
                        required
                      />
                      <div className="modal-actions">
                        <button 
                          onClick={confirmDailyFlightBooking}
                          className="submit-button"
                          disabled={!selectedTravelDate}
                        >
                          Confirm Booking
                        </button>
                        <button 
                          onClick={() => {
                            setShowDateSelector(false);
                            setSelectedFlight(null);
                            setSelectedTravelDate("");
                          }}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="tab-content">
            <div className="card">
              <h2>My Bookings</h2>

              <div className="bookings-list">
                {loadingBookings ? (
                  <div className="loading-bookings">
                    <div className="loading-spinner large"></div>
                    <p>Loading your bookings...</p>
                  </div>
                ) : (
                  <>
                    {bookings.map((booking) => (
                  <div 
                    key={booking.booking_id} 
                    className={`booking-card ${booking.booking_status === 'cancelled' ? 'cancelled' : ''}`}
                  >
                    <div className="booking-info">
                      <h3>PNR: {booking.pnr_number}</h3>
                      <p className="booking-detail">
                        {booking.passengers_count} passenger(s)
                      </p>
                      <p className="booking-time">
                        Booked on:{" "}
                        {new Date(booking.booking_date).toLocaleString()}
                      </p>
                      {booking.travel_date && (
                        <p className="travel-date">
                          Travel Date:{" "}
                          {new Date(booking.travel_date).toLocaleDateString()}
                        </p>
                      )}
                      <p className="booking-status">
                        Status:{" "}
                        <span className={`status-${booking.booking_status}`}>
                          {booking.booking_status}
                        </span>
                      </p>
                    </div>

                    <div className="booking-actions">
                      <p className="booking-amount">₹{booking.total_amount}</p>
                      <p className="payment-status">
                        Payment: {booking.payment_status}
                      </p>
                      {canCancelBooking(booking) && (
                        <button
                          onClick={() => handleDeleteBooking(booking)}
                          disabled={deletingBookingId === booking.booking_id}
                          className={`delete-booking-button ${
                            deletingBookingId === booking.booking_id ? "deleting" : ""
                          }`}
                        >
                          {deletingBookingId === booking.booking_id ? (
                            <>
                              <span className="loading-spinner"></span>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <span className="delete-icon">🗑️</span>
                              Cancel Booking
                            </>
                          )}
                        </button>
                      )}
                      {booking.booking_status === "cancelled" && (
                        <p className="cancelled-info">
                          <span className="cancelled-icon">❌</span>
                          Booking Cancelled
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {bookings.length === 0 && !loadingBookings && (
                  <p className="no-results">No bookings found.</p>
                )}
                </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && bookingToDelete && (
        <div className="modal-overlay">
          <div className="delete-confirm-modal">
            <div className="modal-header">
              <h3>
                <span className="warning-icon">⚠️</span>
                Cancel Booking
              </h3>
            </div>
            <div className="modal-content">
              <p className="confirm-message">
                Are you sure you want to cancel this booking?
              </p>
              <div className="booking-details">
                <p><strong>PNR:</strong> {bookingToDelete.pnr_number}</p>
                <p><strong>Passengers:</strong> {bookingToDelete.passengers_count}</p>
                <p><strong>Amount:</strong> ₹{bookingToDelete.total_amount}</p>
                {bookingToDelete.travel_date && (
                  <p><strong>Travel Date:</strong> {new Date(bookingToDelete.travel_date).toLocaleDateString()}</p>
                )}
              </div>
              <div className="refund-info">
                <p className="refund-notice">
                  💰 Full refund of ₹{bookingToDelete.total_amount} will be processed
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={confirmDeleteBooking}
                disabled={deletingBookingId === bookingToDelete.booking_id}
                className="confirm-delete-button"
              >
                {deletingBookingId === bookingToDelete.booking_id ? (
                  <>
                    <span className="loading-spinner"></span>
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Booking"
                )}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setBookingToDelete(null);
                }}
                disabled={deletingBookingId === bookingToDelete.booking_id}
                className="cancel-button"
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
