import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BookingTicket from "./BookingTicket";

const AdminDashboard = () => {
  const { user, logout, API_BASE } = useAuth();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showAddFlight, setShowAddFlight] = useState(false);
  const [showEditFlight, setShowEditFlight] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState(null);
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
    weekdays: [], // Array of selected weekdays [0-6]
  });
  const [activeTab, setActiveTab] = useState("flights");
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

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

      // Check if weekdays were selected before converting
      const hasWeekdays = flightData.weekdays && flightData.weekdays.length > 0;

      // Convert weekdays array to comma-separated string
      if (hasWeekdays) {
        flightData.weekdays = flightData.weekdays.join(",");
      } else {
        flightData.weekdays = null; // No specific weekdays
      }

      // For recurring flights (daily OR weekdays), convert time to datetime
      if (flightData.is_daily || hasWeekdays) {
        // For recurring flights, create proper datetime objects with today's date
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
        weekdays: [],
      });
      fetchFlights();
      alert("Flight added successfully!");
    } catch (error) {
      console.error("Full error:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage = "Unknown error";
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Validation errors from Pydantic
          errorMessage = error.response.data.detail
            .map((err) => `${err.loc.join(".")}: ${err.msg}`)
            .join("\n");
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert("Error adding flight:\n" + errorMessage);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleEditFlight = (flight) => {
    console.log("=== EDIT BUTTON CLICKED ===");
    console.log("Editing flight:", flight);
    console.log("Current showEditFlight state:", showEditFlight);
    console.log("Current showAddFlight state:", showAddFlight);

    // Convert weekdays string back to array
    const weekdaysArray = flight.weekdays
      ? flight.weekdays.split(",").map(Number)
      : [];

    // For recurring flights, extract just the time (HH:MM)
    let departureTime = "";
    let arrivalTime = "";

    if (flight.is_daily || (flight.weekdays && flight.weekdays.trim() !== "")) {
      // Recurring flight - use time only
      departureTime = flight.departure_time_only
        ? flight.departure_time_only.substring(0, 5)
        : flight.departure_time.split("T")[1]?.substring(0, 5) || "";
      arrivalTime = flight.arrival_time_only
        ? flight.arrival_time_only.substring(0, 5)
        : flight.arrival_time.split("T")[1]?.substring(0, 5) || "";
    } else {
      // One-time flight - use full datetime
      departureTime = flight.departure_time.substring(0, 16); // Format: YYYY-MM-DDTHH:MM
      arrivalTime = flight.arrival_time.substring(0, 16);
    }

    console.log("Setting form with:", {
      departure_time: departureTime,
      arrival_time: arrivalTime,
      weekdays: weekdaysArray,
      is_daily:
        flight.is_daily && (!flight.weekdays || flight.weekdays.trim() === ""),
    });

    // Set the form with flight data
    setNewFlight({
      flight_number: flight.flight_number,
      airline_id: flight.airline_id,
      source_city: flight.source_city,
      destination_city: flight.destination_city,
      departure_time: departureTime,
      arrival_time: arrivalTime,
      total_seats: flight.total_seats,
      price: flight.price,
      is_daily:
        flight.is_daily && (!flight.weekdays || flight.weekdays.trim() === ""),
      weekdays: weekdaysArray,
    });
    setEditingFlightId(flight.flight_id);
    setShowAddFlight(false); // Close add flight form if open
    setShowEditFlight(true);

    console.log("After setState - editingFlightId:", flight.flight_id);
    console.log("=== END EDIT BUTTON CLICK ===");

    // Scroll to top to see the edit form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const updateFlight = async (e) => {
    e.preventDefault();
    console.log("Updating flight with ID:", editingFlightId);
    console.log("Current form data:", newFlight);

    try {
      const token = localStorage.getItem("token");

      // Prepare flight data for submission (same as addFlight)
      const flightData = { ...newFlight };

      const hasWeekdays = flightData.weekdays && flightData.weekdays.length > 0;

      if (hasWeekdays) {
        flightData.weekdays = flightData.weekdays.join(",");
      } else {
        flightData.weekdays = null;
      }

      if (flightData.is_daily || hasWeekdays) {
        const today = new Date().toISOString().split("T")[0];

        if (flightData.departure_time.includes("T")) {
          flightData.departure_time = flightData.departure_time;
        } else {
          flightData.departure_time = `${today}T${flightData.departure_time}:00`;
        }

        if (flightData.arrival_time.includes("T")) {
          flightData.arrival_time = flightData.arrival_time;
        } else {
          flightData.arrival_time = `${today}T${flightData.arrival_time}:00`;
        }
      }

      console.log("Sending to backend:", flightData);

      const response = await axios.put(
        `${API_BASE}/flights/${editingFlightId}`,
        flightData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Update response:", response.data);

      setShowEditFlight(false);
      setEditingFlightId(null);
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
        weekdays: [],
      });
      fetchFlights();
      alert("Flight updated successfully!");
    } catch (error) {
      console.error("Full error:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage = "Unknown error";
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map((err) => `${err.loc.join(".")}: ${err.msg}`)
            .join("\n");
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert("Error updating flight:\n" + errorMessage);
    }
  };

  const cancelEdit = () => {
    setShowEditFlight(false);
    setEditingFlightId(null);
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
      weekdays: [],
    });
  };

  const handleViewTicket = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowTicketModal(true);
  };

  const closeTicketModal = () => {
    setShowTicketModal(false);
    setSelectedBookingId(null);
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

                    {/* Daily Flight Option - Only show when NO weekdays are selected */}
                    {newFlight.weekdays.length === 0 && (
                      <div className="daily-flight-option">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={newFlight.is_daily}
                            onChange={(e) =>
                              setNewFlight({
                                ...newFlight,
                                is_daily: e.target.checked,
                                weekdays: [], // Clear weekdays when daily is selected
                                // Reset time fields when switching flight type
                                departure_time: "",
                                arrival_time: "",
                              })
                            }
                            className="checkbox-input"
                          />
                          <span className="checkbox-text">
                            Daily Flight (All Days)
                          </span>
                          <span className="checkbox-help">
                            Check this for flights that operate{" "}
                            <strong>every day</strong> at the same time (no
                            specific weekdays)
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Weekdays Selection */}
                    <div className="weekdays-selection">
                      <label className="form-label">
                        <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                          🗓️ Specific Weekdays
                        </span>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "#718096",
                            fontWeight: 400,
                            marginTop: "0.25rem",
                            display: "block",
                          }}
                        >
                          Or select specific days (e.g., Mon-Fri for business,
                          Sat-Sun for leisure). Only enter <strong>time</strong>{" "}
                          when selected.
                        </span>
                      </label>
                      <div className="weekdays-grid">
                        {[
                          { day: "Monday", value: 0, emoji: "🌙" },
                          { day: "Tuesday", value: 1, emoji: "💼" },
                          { day: "Wednesday", value: 2, emoji: "🌟" },
                          { day: "Thursday", value: 3, emoji: "⚡" },
                          { day: "Friday", value: 4, emoji: "🎉" },
                          { day: "Saturday", value: 5, emoji: "🌴" },
                          { day: "Sunday", value: 6, emoji: "☀️" },
                        ].map(({ day, value, emoji }) => (
                          <label key={value} className="weekday-checkbox">
                            <input
                              type="checkbox"
                              checked={newFlight.weekdays.includes(value)}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...newFlight.weekdays, value].sort()
                                  : newFlight.weekdays.filter(
                                      (d) => d !== value
                                    );
                                setNewFlight({
                                  ...newFlight,
                                  weekdays: updated,
                                  is_daily: false, // NOT a daily flight when specific weekdays are selected
                                });
                              }}
                            />
                            <span className="weekday-label">
                              <span className="weekday-emoji">{emoji}</span>
                              <span className="weekday-name">{day}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                      {newFlight.weekdays.length === 0 && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            padding: "0.75rem",
                            background: "#fff3cd",
                            borderRadius: "0.5rem",
                            fontSize: "0.85rem",
                            color: "#856404",
                          }}
                        >
                          ℹ️ <strong>No specific weekdays selected.</strong>
                          <br />
                          Use "Daily Flight" checkbox above for all days, or
                          leave unchecked for a one-time flight.
                        </div>
                      )}
                    </div>

                    {/* Time/DateTime inputs based on whether weekdays OR daily is selected */}
                    {newFlight.weekdays.length > 0 || newFlight.is_daily ? (
                      <>
                        <div
                          style={{
                            gridColumn: "1 / -1",
                            padding: "1rem",
                            background: "#e6f7ff",
                            borderRadius: "0.75rem",
                            border: "2px solid #91d5ff",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.9rem",
                              color: "#003a8c",
                              fontWeight: 600,
                            }}
                          >
                            🔄 <strong>Recurring Flight</strong>
                            <br />
                            {newFlight.weekdays.length > 0
                              ? `Operates on: ${newFlight.weekdays
                                  .map(
                                    (d) =>
                                      [
                                        "Mon",
                                        "Tue",
                                        "Wed",
                                        "Thu",
                                        "Fri",
                                        "Sat",
                                        "Sun",
                                      ][d]
                                  )
                                  .join(", ")}`
                              : "Operates every day of the year"}
                            . Just enter the time (no dates needed).
                          </p>
                        </div>
                        <label className="form-label">⏰ Departure Time</label>
                        <input
                          type="time"
                          value={newFlight.departure_time}
                          onChange={(e) =>
                            handleTimeChange("departure_time", e.target.value)
                          }
                          className="form-input"
                          required
                        />
                        <label className="form-label">⏰ Arrival Time</label>
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
                        <div
                          style={{
                            gridColumn: "1 / -1",
                            padding: "1rem",
                            background: "#fff3cd",
                            borderRadius: "0.75rem",
                            border: "2px solid #ffd666",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.9rem",
                              color: "#856404",
                              fontWeight: 600,
                            }}
                          >
                            📅 <strong>One-Time Flight:</strong> Enter specific
                            departure and arrival date & time.
                          </p>
                        </div>
                        <label className="form-label">
                          📅 Departure Date & Time
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
                          📅 Arrival Date & Time
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

              {showEditFlight && (
                <div
                  className="add-flight-form edit-flight-form"
                  style={{
                    border: "3px solid #3b82f6",
                    boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <h3 style={{ color: "#1e40af", fontSize: "1.5rem" }}>
                    ✏️ Edit Flight Details (ID: {editingFlightId})
                  </h3>
                  <form onSubmit={updateFlight} className="flight-form">
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
                      type="number"
                      placeholder="Airline ID"
                      value={newFlight.airline_id}
                      onChange={(e) =>
                        setNewFlight({
                          ...newFlight,
                          airline_id: parseInt(e.target.value),
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

                    {/* Daily Flight Option - Only show when NO weekdays are selected */}
                    {newFlight.weekdays.length === 0 && (
                      <div className="daily-flight-option">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={newFlight.is_daily}
                            onChange={(e) =>
                              setNewFlight({
                                ...newFlight,
                                is_daily: e.target.checked,
                                weekdays: [],
                                departure_time: "",
                                arrival_time: "",
                              })
                            }
                            className="checkbox-input"
                          />
                          <span className="checkbox-text">
                            Daily Flight (All Days)
                          </span>
                          <span className="checkbox-help">
                            Check this for flights that operate{" "}
                            <strong>every day</strong> at the same time (no
                            specific weekdays)
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Weekdays Selection */}
                    <div className="weekdays-selection">
                      <label className="form-label">
                        <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                          🗓️ Specific Weekdays
                        </span>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "#718096",
                            fontWeight: 400,
                            marginTop: "0.25rem",
                            display: "block",
                          }}
                        >
                          Or select specific days (e.g., Mon-Fri for business,
                          Sat-Sun for leisure). Only enter <strong>time</strong>{" "}
                          when selected.
                        </span>
                      </label>
                      <div className="weekdays-grid">
                        {[
                          { day: "Monday", value: 0, emoji: "🌙" },
                          { day: "Tuesday", value: 1, emoji: "💼" },
                          { day: "Wednesday", value: 2, emoji: "🌟" },
                          { day: "Thursday", value: 3, emoji: "⚡" },
                          { day: "Friday", value: 4, emoji: "🎉" },
                          { day: "Saturday", value: 5, emoji: "🌴" },
                          { day: "Sunday", value: 6, emoji: "☀️" },
                        ].map(({ day, value, emoji }) => (
                          <label key={value} className="weekday-checkbox">
                            <input
                              type="checkbox"
                              checked={newFlight.weekdays.includes(value)}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...newFlight.weekdays, value].sort()
                                  : newFlight.weekdays.filter(
                                      (d) => d !== value
                                    );
                                setNewFlight({
                                  ...newFlight,
                                  weekdays: updated,
                                  is_daily: false,
                                });
                              }}
                            />
                            <span className="weekday-label">
                              <span className="weekday-emoji">{emoji}</span>
                              <span className="weekday-name">{day}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                      {newFlight.weekdays.length === 0 && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            padding: "0.75rem",
                            background: "#fff3cd",
                            borderRadius: "0.5rem",
                            fontSize: "0.85rem",
                            color: "#856404",
                          }}
                        >
                          ℹ️ <strong>No specific weekdays selected.</strong>
                          <br />
                          Use "Daily Flight" checkbox above for all days, or
                          leave unchecked for a one-time flight.
                        </div>
                      )}
                    </div>

                    {/* Time/DateTime inputs based on whether weekdays OR daily is selected */}
                    {newFlight.weekdays.length > 0 || newFlight.is_daily ? (
                      <>
                        <div
                          style={{
                            gridColumn: "1 / -1",
                            padding: "1rem",
                            background: "#e6f7ff",
                            borderRadius: "0.75rem",
                            border: "2px solid #91d5ff",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.9rem",
                              color: "#003a8c",
                              fontWeight: 600,
                            }}
                          >
                            🔄 <strong>Recurring Flight</strong>
                            <br />
                            <span
                              style={{ fontSize: "0.85rem", fontWeight: 400 }}
                            >
                              Operates on:{" "}
                              {newFlight.weekdays.length > 0
                                ? [
                                    "Mon",
                                    "Tue",
                                    "Wed",
                                    "Thu",
                                    "Fri",
                                    "Sat",
                                    "Sun",
                                  ]
                                    .filter((_, i) =>
                                      newFlight.weekdays.includes(i)
                                    )
                                    .join(", ")
                                : "Every day of the year"}
                              . Just enter the <strong>time</strong> (no dates
                              needed).
                            </span>
                          </p>
                        </div>
                        <input
                          type="time"
                          placeholder="Departure Time"
                          value={newFlight.departure_time}
                          onChange={(e) =>
                            handleTimeChange("departure_time", e.target.value)
                          }
                          className="form-input"
                          required
                        />
                        <input
                          type="time"
                          placeholder="Arrival Time"
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
                        <div
                          style={{
                            gridColumn: "1 / -1",
                            padding: "1rem",
                            background: "#fff7e6",
                            borderRadius: "0.75rem",
                            border: "2px solid #ffd591",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.9rem",
                              color: "#ad6800",
                              fontWeight: 600,
                            }}
                          >
                            📅 <strong>One-Time Flight</strong>
                            <br />
                            <span
                              style={{ fontSize: "0.85rem", fontWeight: 400 }}
                            >
                              Enter the full <strong>date and time</strong> for
                              this specific flight.
                            </span>
                          </p>
                        </div>
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
                        Update Flight
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
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
                          {flight.weekdays && flight.weekdays.trim() !== "" && (
                            <span className="weekdays-badge">
                              📅{" "}
                              {(() => {
                                const days = flight.weekdays
                                  .split(",")
                                  .map(Number);
                                const dayNames = [
                                  "Mon",
                                  "Tue",
                                  "Wed",
                                  "Thu",
                                  "Fri",
                                  "Sat",
                                  "Sun",
                                ];
                                return days.map((d) => dayNames[d]).join(", ");
                              })()}
                            </span>
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
                          onClick={() => handleEditFlight(flight)}
                          className="edit-button"
                          title="Edit Flight"
                        >
                          <span className="edit-icon">✏️</span>
                          Edit
                        </button>
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
                      <button
                        onClick={() => handleViewTicket(booking.booking_id)}
                        className="view-ticket-button"
                        title="View Booking Ticket"
                      >
                        🎫 View Ticket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Ticket Modal */}
      {showTicketModal && selectedBookingId && (
        <div className="modal-overlay">
          <div className="ticket-modal-content">
            <button onClick={closeTicketModal} className="ticket-modal-close">
              ✕
            </button>
            <BookingTicket bookingId={selectedBookingId} API_BASE={API_BASE} />
            <div className="ticket-modal-actions">
              <button onClick={() => window.print()} className="print-button">
                🖨️ Print Ticket
              </button>
              <button onClick={closeTicketModal} className="close-button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
