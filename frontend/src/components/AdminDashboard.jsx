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
  });
  const [activeTab, setActiveTab] = useState("flights");

  useEffect(() => {
    fetchFlights();
    fetchBookings();
  }, []);

  const fetchFlights = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/flights`);
      setFlights(response.data);
    } catch (error) {
      console.error("Error fetching flights:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/bookings`);
      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const addFlight = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/flights`, newFlight);
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
                    <input
                      type="datetime-local"
                      placeholder="Departure Time"
                      value={newFlight.departure_time}
                      onChange={(e) =>
                        setNewFlight({
                          ...newFlight,
                          departure_time: e.target.value,
                        })
                      }
                      className="form-input"
                      required
                    />
                    <input
                      type="datetime-local"
                      placeholder="Arrival Time"
                      value={newFlight.arrival_time}
                      onChange={(e) =>
                        setNewFlight({
                          ...newFlight,
                          arrival_time: e.target.value,
                        })
                      }
                      className="form-input"
                      required
                    />
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
                      value={newFlight.price}
                      onChange={(e) =>
                        setNewFlight({
                          ...newFlight,
                          price: parseFloat(e.target.value),
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
                      <p className="flight-seats">
                        Available Seats: {flight.available_seats} /{" "}
                        {flight.total_seats}
                      </p>
                    </div>

                    <div className="flight-actions">
                      <p className="flight-price">₹{flight.price}</p>
                      <p
                        className={`flight-status status-${flight.flight_status}`}
                      >
                        {flight.flight_status}
                      </p>
                    </div>
                  </div>
                ))}
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
