import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminDashboard = () => {
  const { user, logout, API_BASE } = useAuth();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showAddFlight, setShowAddFlight] = useState(false);
  const [newFlight, setNewFlight] = useState({
    flight_number: "",
    airline_id: 1,
    source_city: "",
    destination_city: "",
    departure_time: "",
    arrival_time: "",
    total_seats: 180,
    price: 0,
    is_daily: false,
  });
  const [activeTab, setActiveTab] = useState("flights");

  useEffect(() => {
    fetchFlights();
    fetchBookings();
  }, []);

  const fetchFlights = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, redirecting to login");
        navigate("/login");
        return;
      }
      const response = await axios.get(`${API_BASE}/admin/flights`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFlights(response.data);
    } catch (error) {
      console.error("Error fetching flights:", error);
      if (error.response?.status === 401) {
        console.error("Unauthorized access, redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, redirecting to login");
        navigate("/login");
        return;
      }
      const response = await axios.get(`${API_BASE}/admin/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      if (error.response?.status === 401) {
        console.error("Unauthorized access, redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    }
  };

  const deleteFlight = async (flightId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this flight? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/admin/flights/${flightId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchFlights();
      alert("Flight deleted successfully!");
    } catch (error) {
      alert(
        "Error deleting flight: " +
          (error.response?.data?.detail || "Unknown error")
      );
    }
  };

  const addFlight = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      // Prepare flight data for submission
      const flightData = { ...newFlight };

      if (flightData.is_daily) {
        // For daily flights, create proper datetime objects with today's date
        const today = new Date().toISOString().split("T")[0];

        // Create full datetime strings with today's date and selected time
        if (flightData.departure_time.includes("T")) {
          // If it's already a datetime string, use it as is
          flightData.departure_time = flightData.departure_time;
        } else {
          // If it's just time, combine with today's date
          flightData.departure_time = `${today}T${flightData.departure_time}:00`;
        }

        if (flightData.arrival_time.includes("T")) {
          flightData.arrival_time = flightData.arrival_time;
        } else {
          flightData.arrival_time = `${today}T${flightData.arrival_time}:00`;
        }
      }

      await axios.post(`${API_BASE}/flights`, flightData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setShowAddFlight(false);
      setNewFlight({
        flight_number: "",
        airline_id: 1,
        source_city: "",
        destination_city: "",
        departure_time: "",
        arrival_time: "",
        total_seats: 180,
        price: 0,
        is_daily: false,
      });
      fetchFlights();
      alert("Flight added successfully!");
    } catch (error) {
      alert(
        "Error adding flight: " +
          (error.response?.data?.detail || "Unknown error")
      );
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Handle time input changes for daily flights
  const handleTimeChange = (field, value) => {
    setNewFlight((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
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
            onClick={() => setActiveTab("flights")}
            className={`nav-button ${activeTab === "flights" ? "active" : ""}`}
          >
            Manage Flights
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`nav-button ${activeTab === "bookings" ? "active" : ""}`}
          >
            All Bookings
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        {activeTab === "flights" && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h2>Manage Flights</h2>
                <button
                  onClick={() => setShowAddFlight(true)}
                  className="add-button"
                >
                  Add New Flight
                </button>
              </div>

              {showAddFlight && (
                <div className="add-flight-form">
                  <h3>Add New Flight</h3>
                  <form onSubmit={addFlight} className="flight-form">
                    <input
                      type="text"
                      placeholder="Flight Number"
                      value={newFlight.flight_number}
                      onChange={(e) =>
                        setNewFlight({
                          ...newFlight,
                          flight_number: e.target.value,
                        })
                      }
                      className="form-input"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Source City"
                      value={newFlight.source_city}
                      onChange={(e) =>
                        setNewFlight({
                          ...newFlight,
                          source_city: e.target.value,
                        })
                      }
                      className="form-input"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Destination City"
                      value={newFlight.destination_city}
                      onChange={(e) =>
                        setNewFlight({
                          ...newFlight,
                          destination_city: e.target.value,
                        })
                      }
                      className="form-input"
                      required
                    />

                    <div className="daily-flight-option">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newFlight.is_daily}
                          onChange={(e) =>
                            setNewFlight({
                              ...newFlight,
                              is_daily: e.target.checked,
                              // Reset time fields when switching flight type
                              departure_time: "",
                              arrival_time: "",
                            })
                          }
                          className="checkbox-input"
                        />
                        <span className="checkbox-text">Daily Flight</span>
                        <span className="checkbox-help">
                          Check this for flights that operate daily at the same
                          time
                        </span>
                      </label>
                    </div>

                    {newFlight.is_daily ? (
                      <>
                        <label className="form-label">
                          Departure Time (Daily)
                        </label>
                        <input
                          type="time"
                          value={newFlight.departure_time}
                          onChange={(e) =>
                            handleTimeChange("departure_time", e.target.value)
                          }
                          className="form-input"
                          required
                        />
                        <label className="form-label">
                          Arrival Time (Daily)
                        </label>
                        <input
                          type="time"
                          value={newFlight.arrival_time}
                          onChange={(e) =>
                            handleTimeChange("arrival_time", e.target.value)
                          }
                          className="form-input"
                          required
                        />
                      </>
                    ) : (
                      <>
                        <label className="form-label">
                          Departure Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={newFlight.departure_time}
                          onChange={(e) =>
                            handleTimeChange("departure_time", e.target.value)
                          }
                          className="form-input"
                          required
                        />
                        <label className="form-label">
                          Arrival Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={newFlight.arrival_time}
                          onChange={(e) =>
                            handleTimeChange("arrival_time", e.target.value)
                          }
                          className="form-input"
                          required
                        />
                      </>
                    )}
                    <input
                      type="number"
                      placeholder="Total Seats"
                      value={newFlight.total_seats}
                      onChange={(e) =>
                        setNewFlight({
                          ...newFlight,
                          total_seats: parseInt(e.target.value),
                        })
                      }
                      className="form-input"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={newFlight.price || ""}
                      onChange={(e) =>
                        setNewFlight({
                          ...newFlight,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="form-input"
                      required
                    />
                    <div className="form-actions">
                      <button type="submit" className="submit-button">
                        Add Flight
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddFlight(false)}
                        className="cancel-button"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="flights-list">
                {flights.map((flight) => (
                  <div
                    key={flight.flight_id}
                    className="flight-card admin-flight-card"
                  >
                    <div className="flight-info">
                      <div className="flight-header">
                        <h3>{flight.flight_number}</h3>
                        <div className="flight-badges">
                          <span className="flight-id">
                            ID: {flight.flight_id}
                          </span>
                          {flight.is_daily && (
                            <span className="daily-badge">🔄 Daily Flight</span>
                          )}
                        </div>
                      </div>
                      <p className="route">
                        {flight.source_city} → {flight.destination_city}
                      </p>
                      <div className="flight-details">
                        {flight.is_daily ? (
                          <>
                            <p className="flight-time">
                              <span className="time-label">Departure:</span>
                              {flight.departure_time_only ||
                                new Date(
                                  flight.departure_time
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                              (Daily)
                            </p>
                            <p className="flight-time">
                              <span className="time-label">Arrival:</span>
                              {flight.arrival_time_only ||
                                new Date(
                                  flight.arrival_time
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                              (Daily)
                            </p>
                            <p className="flight-duration">
                              <span className="time-label">Duration:</span>
                              {flight.duration_minutes
                                ? `${Math.floor(
                                    flight.duration_minutes / 60
                                  )}h ${flight.duration_minutes % 60}m`
                                : "N/A"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="flight-time">
                              <span className="time-label">Departure:</span>
                              {new Date(flight.departure_time).toLocaleString()}
                            </p>
                            <p className="flight-time">
                              <span className="time-label">Arrival:</span>
                              {new Date(flight.arrival_time).toLocaleString()}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flight-capacity">
                        <p className="flight-seats">
                          {flight.is_daily ? (
                            <>
                              <span className="seats-total">
                                {flight.total_seats}
                              </span>
                              <span className="seats-label">
                                seats available daily
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="seats-available">
                                {flight.available_seats}
                              </span>
                              <span className="seats-divider">/</span>
                              <span className="seats-total">
                                {flight.total_seats}
                              </span>
                              <span className="seats-label">seats</span>
                            </>
                          )}
                        </p>
                        {!flight.is_daily && (
                          <div className="capacity-bar">
                            <div
                              className="capacity-fill"
                              style={{
                                width: `${
                                  ((flight.total_seats -
                                    flight.available_seats) /
                                    flight.total_seats) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flight-actions admin-actions">
                      <div className="flight-price-section">
                        <p className="flight-price">
                          ₹{flight.price.toLocaleString()}
                        </p>
                        <p
                          className={`flight-status status-${flight.flight_status}`}
                        >
                          {flight.flight_status}
                        </p>
                      </div>
                      <div className="admin-buttons">
                        <button
                          onClick={() => deleteFlight(flight.flight_id)}
                          className="delete-button"
                          title="Delete Flight"
                        >
                          <span className="delete-icon">🗑️</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {flights.length === 0 && (
                  <div className="no-results">
                    <p>
                      No flights found. Add your first flight to get started!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="tab-content">
            <div className="card">
              <h2>All Bookings</h2>

              <div className="bookings-list">
                {bookings.map((booking) => (
                  <div key={booking.booking_id} className="booking-card">
                    <div className="booking-info">
                      <h3>PNR: {booking.pnr_number}</h3>
                      <p className="booking-detail">
                        User ID: {booking.user_id} | {booking.passengers_count}{" "}
                        passenger(s)
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
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
