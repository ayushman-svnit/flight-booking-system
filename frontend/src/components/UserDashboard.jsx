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
    try {
      const response = await axios.get(`${API_BASE}/bookings`);
      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
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

  const bookFlight = async (flightId, passengers) => {
    try {
      await axios.post(`${API_BASE}/bookings`, {
        flight_id: flightId,
        passengers_count: passengers,
        payment_method: "credit_card",
      });
      alert("Booking successful!");
      fetchBookings();
      searchFlights();
    } catch (error) {
      alert(
        "Booking failed: " + (error.response?.data?.detail || "Unknown error")
      );
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login"); // Redirect after logout
  };

  return (
    <div className="dashboard">
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
                      <h3>{flight.flight_number}</h3>
                      <p className="route">
                        {flight.source_city} → {flight.destination_city}
                      </p>
                      <p className="flight-time">
                        Departure:{" "}
                        {new Date(flight.departure_time).toLocaleString()}
                      </p>
                      <p className="flight-time">
                        Arrival:{" "}
                        {new Date(flight.arrival_time).toLocaleString()}
                      </p>
                    </div>

                    <div className="flight-actions">
                      <p className="flight-price">₹{flight.price}</p>
                      <p className="flight-seats">
                        {flight.available_seats} seats available
                      </p>
                      <button
                        onClick={() => {
                          const passengers = prompt(
                            "Enter number of passengers:"
                          );
                          if (passengers && !isNaN(passengers)) {
                            bookFlight(flight.flight_id, parseInt(passengers));
                          }
                        }}
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
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="tab-content">
            <div className="card">
              <h2>My Bookings</h2>

              <div className="bookings-list">
                {bookings.map((booking) => (
                  <div key={booking.booking_id} className="booking-card">
                    <div className="booking-info">
                      <h3>PNR: {booking.pnr_number}</h3>
                      <p className="booking-detail">
                        {booking.passengers_count} passenger(s)
                      </p>
                      <p className="booking-time">
                        Booked on:{" "}
                        {new Date(booking.booking_date).toLocaleString()}
                      </p>
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
                    </div>
                  </div>
                ))}

                {bookings.length === 0 && (
                  <p className="no-results">No bookings found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
