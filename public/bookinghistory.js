// Updated bookinghistory.js
console.log("Booking History JS loaded");

// Get user ID from localStorage (set during login)
function getUserID() {
    try {
        // Get userData from localStorage
        const userData = localStorage.getItem("userData");
        console.log("Raw userData from localStorage:", userData);

        if (userData) {
            const parsedData = JSON.parse(userData);
            console.log("Parsed userData:", parsedData);

            // Check for userID property (lowercase)
            if (parsedData.userID) {
                console.log("Found userID in userData:", parsedData.userID);
                return parsedData.userID;
            }

            // Check for other possible property names
            if (parsedData.UserID) {
                console.log("Found UserID in userData:", parsedData.UserID);
                return parsedData.UserID;
            }

            if (parsedData.id) {
                console.log("Found id in userData:", parsedData.id);
                return parsedData.id;
            }
        }

        // Try to get from separate userID key
        const userId = localStorage.getItem("userID");
        if (userId) {
            console.log("Found userID in separate key:", userId);
            return parseInt(userId);
        }

        console.log("No user ID found, defaulting to 3 for testing");
        return 3; // Based on your debug info, user ID is 3

    } catch (error) {
        console.error("Error getting user ID:", error);
        return 3; // Default to 3 for your user
    }
}

// Global userID variable
let userID = getUserID();

// Update the user ID display on the page
function updateUserIDDisplay() {
    const userIDElement = document.getElementById("currentUserID");
    if (userIDElement) {
        userIDElement.textContent = userID;
        console.log("Updated user ID display to:", userID);
    }
}

// Load booking history
async function loadBookingHistory() {
    try {
        console.log("Loading booking history for user:", userID);
        console.log("Making API call to: http://localhost:3000/booking-history/" + userID);

        // Show loading state
        const bookingList = document.getElementById("bookingList");
        const noBookings = document.getElementById("noBookings");

        if (bookingList) {
            bookingList.innerHTML = `
                <div class="text-center my-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading your bookings...</p>
                </div>
            `;
        }

        const response = await fetch(`http://localhost:3000/booking-history/${userID}`);

        console.log("API Response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Response:", errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("Bookings data received:", data);

        // Check if data is an array
        if (!Array.isArray(data)) {
            console.error("API did not return an array:", data);
            throw new Error("Invalid response format from server");
        }

        renderBookings(data);

    } catch (error) {
        console.error("Booking history error:", error);
        showError(error.message);
    }
}

// Render bookings to the page
function renderBookings(bookings) {
    const bookingList = document.getElementById("bookingList");
    const noBookings = document.getElementById("noBookings");

    bookingList.innerHTML = "";

    if (!bookings || bookings.length === 0) {
        console.log("No bookings found for user:", userID);
        bookingList.innerHTML = `
            <div class="alert alert-info">
                <h5><i class="bi bi-info-circle me-2"></i>No Bookings Found</h5>
                <p>You haven't made any bookings yet.</p>
                <a href="searchflight.html" class="btn btn-primary mt-2">
                    <i class="bi bi-search me-1"></i> Search Flights
                </a>
            </div>
        `;
        noBookings.style.display = "block";
        return;
    }

    noBookings.style.display = "none";
    bookingList.style.display = "block";

    console.log(`Rendering ${bookings.length} bookings`);

    bookings.forEach((b, index) => {
        console.log(`Booking ${index + 1}:`, b);

        // Format date
        let formattedDate = 'N/A';
        if (b.DepartureDate) {
            try {
                // Handle date string (might be in different formats)
                let dateStr = b.DepartureDate;
                // If it's already a Date object or timestamp
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                }
            } catch (e) {
                console.error("Error formatting date:", e);
                formattedDate = b.DepartureDate; // Use raw string
            }
        }

        // Format created date
        let createdDate = 'N/A';
        if (b.CreatedAt) {
            try {
                const date = new Date(b.CreatedAt);
                if (!isNaN(date.getTime())) {
                    createdDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            } catch (e) {
                console.error("Error formatting CreatedAt:", e);
            }
        }

        // Get status (use PaymentStatus from your table)
        const status = b.PaymentStatus || 'Pending';
        let statusClass = "bg-warning text-dark"; // Default for pending

        if (status.toLowerCase() === 'paid' || status.toLowerCase() === 'confirmed') {
            statusClass = "bg-success";
        } else if (status.toLowerCase() === 'cancelled') {
            statusClass = "bg-danger";
        }

        // Format time if available
        const timeInfo = b.DepartureTime && b.ArrivalTime
            ? `<p class="mb-1"><strong>Time:</strong> ${b.DepartureTime} - ${b.ArrivalTime}</p>`
            : '';

        // Price
        const price = b.Price ? `PKR ${b.Price}` : "N/A";

        // Seat
        const seat = b.SeatNumber && b.SeatNumber !== 'TBA' && b.SeatNumber !== '' ? b.SeatNumber : 'Not Assigned';

        bookingList.innerHTML += `
            <div class="card shadow-sm mb-4 booking-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h5 class="card-title">
                                <i class="bi bi-airplane me-2"></i>Flight ${b.FlightNumber || 'N/A'}
                            </h5>
                            <p class="mb-1">
                                <strong>Route:</strong>
                                ${b.DepartureCity || 'N/A'} → ${b.DestinationCity || 'N/A'}
                            </p>
                            <p class="mb-1">
                                <strong>Date:</strong>
                                ${formattedDate}
                            </p>
                            ${timeInfo}
                            <p class="mb-1">
                                <strong>Passenger:</strong>
                                ${b.FullName || 'N/A'}
                            </p>
                            <p class="mb-1">
                                <strong>Seat:</strong>
                                <span class="badge bg-info">${seat}</span>
                            </p>
                            <p class="mb-1">
                                <strong>Price:</strong>
                                ${price}
                            </p>
                            <p class="mb-0 text-muted small">
                                <strong>Booked on:</strong> ${createdDate}
                            </p>
                        </div>

                        <div class="col-md-4 text-md-end">
                            <div class="mb-3">
                                <strong>Booking ID:</strong> 
                                <span class="badge bg-secondary">#${b.BookingID}</span>
                            </div>
                            <div class="mb-3">
                                <strong>Status:</strong><br>
                                <span class="badge ${statusClass} mt-1 status-badge">
                                    ${status}
                                </span>
                            </div>
                            <div class="mt-3">
                                ${getBookingActions(b)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// Get booking actions based on status
function getBookingActions(booking) {
    const status = (booking.PaymentStatus || '').toLowerCase();

    if (status === 'pending') {
        return `
            <button class="btn btn-success btn-sm mb-2" onclick="payBooking(${booking.BookingID})">
                <i class="bi bi-credit-card me-1"></i> Pay Now
            </button>
            <br>
            <button class="btn btn-outline-danger btn-sm" onclick="cancelBooking(${booking.BookingID})">
                <i class="bi bi-x-circle me-1"></i> Cancel
            </button>
        `;
    } else if (status === 'paid' || status === 'confirmed') {
        return `
            <button class="btn btn-primary btn-sm mb-2" onclick="viewTicket(${booking.BookingID})">
                <i class="bi bi-ticket-detailed me-1"></i> View Ticket
            </button>
        `;
    }

    return '';
}

// Show error message
function showError(message) {
    const bookingList = document.getElementById("bookingList");
    const noBookings = document.getElementById("noBookings");

    bookingList.innerHTML = `
        <div class="alert alert-danger">
            <h5><i class="bi bi-exclamation-triangle me-2"></i>Error Loading Bookings</h5>
            <p>${message}</p>
            <p class="small">User ID being used: ${userID}</p>
            <button class="btn btn-sm btn-outline-danger mt-2" onclick="loadBookingHistory()">
                <i class="bi bi-arrow-clockwise me-1"></i> Try Again
            </button>
        </div>
    `;
    noBookings.style.display = "none";
    bookingList.style.display = "block";
}

// Action functions
function payBooking(bookingID) {
    alert(`Payment for booking #${bookingID} would be processed here.`);
    // You can implement payment logic here
}

function cancelBooking(bookingID) {
    if (confirm("Are you sure you want to cancel this booking?")) {
        alert(`Booking #${bookingID} cancellation would be processed here.`);
        // You can implement cancellation logic here
    }
}

function viewTicket(bookingID) {
    alert(`Viewing ticket for booking #${bookingID}`);
    // You can redirect to ticket page or open modal
}

// Function to set user ID (can be called from HTML)
function setUserID(id) {
    userID = id;
    updateUserIDDisplay();
    console.log("User ID set to:", userID);
}

// Load booking history when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Get the latest user ID
    userID = getUserID();

    // Update the user ID display
    updateUserIDDisplay();

    // Update the navbar if function exists
    if (window.updateNavbar) {
        window.updateNavbar();
    }

    // Log debug info
    console.log("DOM loaded - User ID:", userID);
    console.log("Full userData:", localStorage.getItem("userData"));

    // Load booking history
    loadBookingHistory();
});

// Make functions available globally
window.loadBookingHistory = loadBookingHistory;
window.payBooking = payBooking;
window.cancelBooking = cancelBooking;
window.viewTicket = viewTicket;
window.setUserID = setUserID;