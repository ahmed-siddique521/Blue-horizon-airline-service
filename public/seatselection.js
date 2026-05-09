const bookingData = JSON.parse(localStorage.getItem("bookingData"));

if (!bookingData) {
    alert("No booking data found");
    window.location.href = "searchflight.html";
}

// Check if user is logged in
if (localStorage.getItem("isLoggedIn") !== "true") {
    alert("Please login first");
    localStorage.setItem("redirectAfterLogin", "seatselection.html");
    window.location.href = "login.html";
}

// Show flight info
document.getElementById("seatFlightNumber").innerText = bookingData.flightNumber || "N/A";
document.getElementById("seatRoute").innerText = `${bookingData.departureCity || "N/A"} → ${bookingData.destinationCity || "N/A"}`;
document.getElementById("seatDate").innerText = bookingData.date || "N/A";

// Highlight previously selected seat
window.onload = function () {
    if (bookingData.seat) {
        document.getElementById("selectedSeat").innerText = bookingData.seat;
        highlightSelectedSeat(bookingData.seat);
    }

    // Mark booked seats as unavailable
    markBookedSeats();
};

// Highlight selected seat
function highlightSelectedSeat(seat) {
    // Reset all seats
    const seatButtons = document.querySelectorAll('.seat-btn');
    seatButtons.forEach(btn => {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-outline-primary');
    });

    // Highlight the selected seat
    const selectedSeatBtn = document.querySelector(`.seat-btn[onclick*="${seat}"]`);
    if (selectedSeatBtn) {
        selectedSeatBtn.classList.remove('btn-outline-primary');
        selectedSeatBtn.classList.add('btn-success');
    }
}

// Mark booked seats as unavailable
function markBookedSeats() {
    if (!bookingData.flightID) return;

    // In a real application, you would fetch booked seats from the server
    // For now, we'll use the already disabled seats from HTML
    console.log("Marking booked seats for flight:", bookingData.flightID);
}

// Seat selection
async function selectSeat(seat) {
    if (!bookingData.bookingID) {
        alert("No booking ID found. Please go back and complete passenger details.");
        return;
    }

    // Check if seat is available (not disabled)
    const seatButton = document.querySelector(`button[onclick*="${seat}"]`);
    if (seatButton.classList.contains('btn-outline-secondary')) {
        alert(`Seat ${seat} is already booked. Please select another seat.`);
        return;
    }

    try {
        // Show loading state
        const originalText = seatButton.innerHTML;
        seatButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        seatButton.disabled = true;

        // Call backend API to update seat
        const response = await fetch("http://localhost:3000/update-seat", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bookingID: bookingData.bookingID,
                seatNumber: seat
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update local storage
            bookingData.seat = seat;
            localStorage.setItem("bookingData", JSON.stringify(bookingData));

            // Update UI
            document.getElementById("selectedSeat").innerText = seat;
            highlightSelectedSeat(seat);

            // Show success message
            showSuccessMessage(`Seat ${seat} has been reserved successfully!`);
        } else {
            alert(data.message || "Failed to select seat. Please try another seat.");
        }

    } catch (error) {
        console.error("Error selecting seat:", error);
        alert("An error occurred while selecting the seat. Please try again.");
    } finally {
        // Reset button state
        if (seatButton) {
            seatButton.innerHTML = originalText || seat;
            seatButton.disabled = false;
        }
    }
}

// Show success message
function showSuccessMessage(message) {
    // Create a temporary success alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    alertDiv.style.zIndex = '1050';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alertDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

// Proceed to payment
function proceedToPayment() {
    if (!bookingData.seat) {
        alert("Please select a seat");
        return;
    }

    // Check if booking has PaymentStatus
    if (!bookingData.bookingID) {
        alert("Booking information is incomplete. Please start over.");
        window.location.href = "searchflight.html";
        return;
    }

    window.location.href = "payment.html";
}

// Add keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // Number keys 1-3 for rows, A-E for columns
    if (e.key >= '1' && e.key <= '3') {
        const row = e.key;
        // If user presses A-E after a number
        setTimeout(() => {
            if (e.key >= 'A' && e.key <= 'E') {
                const col = e.key;
                const seat = row + col;
                const seatButton = document.querySelector(`button[onclick*="${seat}"]`);
                if (seatButton && !seatButton.disabled && !seatButton.classList.contains('btn-outline-secondary')) {
                    selectSeat(seat);
                }
            }
        }, 100);
    }
});

// Add click handlers to all seat buttons
document.addEventListener('DOMContentLoaded', function () {
    const seatButtons = document.querySelectorAll('.seat-btn');
    seatButtons.forEach(button => {
        button.addEventListener('click', function () {
            const seat = this.textContent;
            selectSeat(seat);
        });
    });
});