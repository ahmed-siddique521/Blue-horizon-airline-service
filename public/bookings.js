const bookingData = JSON.parse(localStorage.getItem("bookingData"));

// Check login status on page load
if (localStorage.getItem("isLoggedIn") !== "true") {
    alert("Please login first");
    localStorage.setItem("redirectAfterLogin", "bookings.html");
    window.location.href = "login.html";
    // Stop execution if not logged in
    throw new Error("User not logged in");
}

if (!bookingData) {
    alert("No flight selected");
    window.location.href = "searchflight.html";
}

// Fill flight summary
document.getElementById("flightNumber").innerText = bookingData.flightNumber;
document.getElementById("route").innerText =
    `${bookingData.departureCity} → ${bookingData.destinationCity}`;
document.getElementById("flightDate").innerText = bookingData.date;
document.getElementById("flightPrice").innerText = bookingData.price;

// **NEW FUNCTION: Check if user is logged in**
function isUserLoggedIn() {
    return localStorage.getItem("isLoggedIn") === "true";
}

// **NEW FUNCTION: Get user ID from localStorage**
function getUserId() {
    const userData = localStorage.getItem("userData");
    if (userData) {
        try {
            const parsedData = JSON.parse(userData);
            return parsedData.userID || null;
        } catch (e) {
            console.error("Error parsing user data:", e);
            return null;
        }
    }
    return null;
}

// Save passenger & move to seat selection
// In your bookings.js - make sure this savePassenger() function is correct
async function savePassenger() {
    // **CHECK LOGIN STATUS AGAIN BEFORE PROCEEDING**
    if (!isUserLoggedIn()) {
        alert("Please login first to book a flight");
        localStorage.setItem("redirectAfterLogin", "bookings.html");
        window.location.href = "login.html";
        return; // Stop execution
    }

    // **GET USER ID FROM LOCALSTORAGE**
    const userId = getUserId();
    if (!userId) {
        alert("Unable to retrieve user information. Please login again.");
        window.location.href = "login.html";
        return;
    }

    // Validate form inputs
    const fullName = document.getElementById("fullName").value.trim();
    const cnic = document.getElementById("cnic").value.trim();
    const gender = document.getElementById("gender").value;
    const dob = document.getElementById("dob").value;
    const contact = document.getElementById("contact").value.trim();

    // Basic validation
    if (!fullName || !cnic || !gender || !dob || !contact) {
        alert("Please fill in all passenger details");
        return;
    }

    // Validate CNIC format (optional but recommended)
    if (!cnic.match(/^\d{5}-\d{7}-\d{1}$/)) {
        alert("Please enter CNIC in format: XXXXX-XXXXXXX-X");
        return;
    }

    // Validate contact number
    if (!contact.match(/^03\d{2}-\d{7}$/)) {
        alert("Please enter contact in format: 03XX-XXXXXXX");
        return;
    }

    const payload = {
        userID: userId,
        flightID: bookingData.flightID,
        seat: null, // Will be updated later on seat selection
        passenger: {
            fullName: fullName,
            cnic: cnic,
            gender: gender,
            dob: dob,
            contact: contact
        }
    };

    console.log("Sending passenger data:", payload); // Debug log

    try {
        const response = await fetch("http://localhost:3000/book-flight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log("Booking response:", data); // Debug log

        if (data.success) {
            // Store the booking ID in bookingData
            bookingData.bookingID = data.bookingID;
            bookingData.passenger = payload.passenger; // Save passenger data locally too
            localStorage.setItem("bookingData", JSON.stringify(bookingData));

            alert("Passenger details saved successfully! Redirecting to seat selection...");
            window.location.href = "seatselection.html";
        } else {
            alert("Booking failed: " + (data.message || "Unknown error"));

            // Log detailed error for debugging
            console.error("Booking failed with details:", {
                payload: payload,
                response: data
            });
        }
    } catch (error) {
        console.error("Network error during booking:", error);
        alert("Network error. Please check your connection and try again.");
    }
}