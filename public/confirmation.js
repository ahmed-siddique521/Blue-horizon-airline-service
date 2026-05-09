// confirmation.js - Updated to fetch real data from backend
const bookingData = JSON.parse(localStorage.getItem("bookingData"));

if (!bookingData || !bookingData.payment) {
    alert("Invalid booking session");
    window.location.href = "searchflight.html";
}

// Function to load booking details from backend
async function loadBookingConfirmation() {
    try {
        // If we have bookingID, try to fetch from backend
        if (bookingData.bookingID) {
            const response = await fetch(`http://localhost:3000/booking-details/${bookingData.bookingID}`);

            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    // Use real data from database
                    displayRealBookingConfirmation(data.booking);
                    return;
                }
            }
        }

        // Fallback to localStorage data
        displayLocalStorageConfirmation();

    } catch (error) {
        console.error("Error loading booking confirmation:", error);
        // Use localStorage data as fallback
        displayLocalStorageConfirmation();
    }
}

function displayRealBookingConfirmation(booking) {
    // Format date
    const flightDate = new Date(booking.DepartureDate);
    const formattedDate = flightDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Booking info
    document.getElementById("confBookingId").innerText = `BH-${String(booking.BookingID).padStart(5, '0')}`;
    document.getElementById("confPassenger").innerText = booking.PassengerName;
    document.getElementById("confFlight").innerText = booking.FlightNumber;
    document.getElementById("confRoute").innerText = `${booking.DepartureCity} → ${booking.DestinationCity}`;
    document.getElementById("confDate").innerText = formattedDate;
    document.getElementById("confSeat").innerText = booking.SeatNumber || "TBA";

    // Payment info
    document.getElementById("confAmount").innerText = booking.Price || bookingData.price;
    document.getElementById("confMethod").innerText = booking.PaymentMethod || bookingData.payment?.method || "Card";
    document.getElementById("confStatus").innerText = booking.PaymentStatus || "Paid";

    // Add transaction ID if available
    if (booking.TransactionID) {
        const paymentCard = document.querySelector('.card-body');
        const transactionInfo = document.createElement('p');
        transactionInfo.innerHTML = `<strong>Transaction ID:</strong> <span class="text-muted">${booking.TransactionID}</span>`;
        document.getElementById("confMethod").parentNode.parentNode.appendChild(transactionInfo);
    }

    // Create download receipt button
    createDownloadButton(booking);
}

function displayLocalStorageConfirmation() {
    // Generate booking ID
    const bookingId = "BH-" + Math.floor(10000 + Math.random() * 90000);

    // Booking info
    document.getElementById("confBookingId").innerText = bookingId;
    document.getElementById("confPassenger").innerText = bookingData.passenger?.fullName || "N/A";
    document.getElementById("confFlight").innerText = bookingData.flightNumber;
    document.getElementById("confRoute").innerText = `${bookingData.departureCity} → ${bookingData.destinationCity}`;
    document.getElementById("confDate").innerText = bookingData.date;
    document.getElementById("confSeat").innerText = bookingData.seat || "TBA";

    // Payment info
    document.getElementById("confAmount").innerText = bookingData.price;
    document.getElementById("confMethod").innerText = bookingData.payment?.method || "Card";
    document.getElementById("confStatus").innerText = bookingData.payment?.status || "Paid";
}

function createDownloadButton(booking) {
    const actionDiv = document.querySelector('.text-center');
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-success me-2';
    downloadBtn.innerHTML = '<i class="bi bi-download"></i> Download Receipt';
    downloadBtn.onclick = () => generateReceipt(booking);
    actionDiv.insertBefore(downloadBtn, actionDiv.firstChild);

    // Add Bootstrap Icons if not already included
    if (!document.querySelector('link[href*="bootstrap-icons"]')) {
        const iconLink = document.createElement('link');
        iconLink.rel = 'stylesheet';
        iconLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css';
        document.head.appendChild(iconLink);
    }
}

function generateReceipt(booking) {
    const receiptContent = `
        BLUEHORIZON AIR SERVICES
        ================================
        
        BOOKING CONFIRMATION RECEIPT
        ================================
        
        Booking ID: BH-${String(booking.BookingID).padStart(5, '0')}
        Date: ${new Date().toLocaleDateString()}
        Time: ${new Date().toLocaleTimeString()}
        
        --------------------------------
        PASSENGER INFORMATION
        --------------------------------
        Name: ${booking.PassengerName}
        ${booking.PassengerCNIC ? `CNIC: ${booking.PassengerCNIC}` : ''}
        ${booking.PassengerContact ? `Contact: ${booking.PassengerContact}` : ''}
        
        --------------------------------
        FLIGHT DETAILS
        --------------------------------
        Flight: ${booking.FlightNumber}
        Route: ${booking.DepartureCity} to ${booking.DestinationCity}
        Date: ${new Date(booking.DepartureDate).toLocaleDateString()}
        Seat: ${booking.SeatNumber || 'TBA'}
        
        --------------------------------
        PAYMENT DETAILS
        --------------------------------
        Amount: PKR ${booking.Price || bookingData.price}
        Method: ${booking.PaymentMethod || bookingData.payment?.method || 'Card'}
        Status: ${booking.PaymentStatus || 'Paid'}
        ${booking.TransactionID ? `Transaction ID: ${booking.TransactionID}` : ''}
        
        ================================
        Thank you for choosing
        BlueHorizon Air Services!
        
        For queries: support@bluehorizon.com
        Contact: 042-111-222-333
    `;

    // Create and download file
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Booking_Receipt_${booking.BookingID || 'temp'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Clear booking data after confirmation (optional)
setTimeout(() => {
    // Keep user data but remove booking data
    const userData = {
        isLoggedIn: localStorage.getItem("isLoggedIn"),
        userEmail: localStorage.getItem("userEmail"),
        userData: localStorage.getItem("userData")
    };

    localStorage.clear();

    // Restore user data
    Object.keys(userData).forEach(key => {
        if (userData[key]) {
            localStorage.setItem(key, userData[key]);
        }
    });
}, 30000); // Clear after 30 seconds

// Initialize confirmation page
loadBookingConfirmation();