// payment.js - UPDATED WITH CORRECT VARIABLE NAMES
const bookingData = JSON.parse(localStorage.getItem("bookingData"));

if (!bookingData) {
    alert("No booking data found");
    window.location.href = "searchflight.html";
}

// Check login status
if (localStorage.getItem("isLoggedIn") !== "true") {
    alert("Please login first");
    window.location.href = "login.html";
}

// Show booking summary
document.getElementById("payFlightNumber").innerText = bookingData.flightNumber;
document.getElementById("payRoute").innerText = `${bookingData.departureCity} → ${bookingData.destinationCity}`;
document.getElementById("payDate").innerText = bookingData.date;
document.getElementById("payPrice").innerText = bookingData.price;

// Auto-fill passenger name in cardholder field
window.onload = function () {
    const cardholderInput = document.querySelector('input[placeholder="Enter name on card"]');
    if (cardholderInput && bookingData.passenger?.fullName) {
        cardholderInput.value = bookingData.passenger.fullName;
    }
};

// Confirm payment - UPDATED VERSION
async function confirmPayment() {
    // Get form values
    const cardholderName = document.querySelector('input[placeholder="Enter name on card"]').value.trim();
    const cardNumber = document.querySelector('input[placeholder="XXXX XXXX XXXX XXXX"]').value.trim();
    const expiryDate = document.querySelector('input[type="month"]').value;
    const cvv = document.querySelector('input[placeholder="***"]').value.trim();
    const paymentMethodSelect = document.querySelector('.form-select');
    const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : "Credit Card";

    // Validation
    if (!cardholderName) {
        alert("Please enter cardholder name");
        return;
    }

    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
        alert("Please enter a valid 16-digit card number");
        return;
    }

    if (!expiryDate) {
        alert("Please select expiry date");
        return;
    }

    if (!cvv || cvv.length !== 3) {
        alert("Please enter a valid 3-digit CVV");
        return;
    }

    if (paymentMethod === "Select Method") {
        alert("Please select a payment method");
        return;
    }

    // Check if bookingID exists
    if (!bookingData.bookingID) {
        alert("No booking found. Please start over.");
        window.location.href = "searchflight.html";
        return;
    }

    // Show loading state
    const payButton = document.querySelector('.btn-success');
    const originalText = payButton.textContent;
    payButton.textContent = "Processing...";
    payButton.disabled = true;

    try {
        // Call payment confirmation API
        const response = await fetch("http://localhost:3000/confirm-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bookingID: bookingData.bookingID,
                paymentMethod: paymentMethod,
                amount: bookingData.price
            })
        });

        const data = await response.json();
        console.log("Payment API response:", data); // Debug log

        if (data.success) {
            // Update booking data with payment info
            bookingData.payment = {
                method: paymentMethod,
                // Use the correct field names from API response
                paymentStatus: data.booking?.PaymentStatus || data.booking?.paymentStatus || "Paid",
                transactionID: data.transactionID || data.booking?.TransactionID || `TXN-${Date.now()}`,
                amount: bookingData.price,
                date: new Date().toISOString()
            };

            // Add booking confirmation data - USE CORRECT FIELD NAMES
            bookingData.confirmation = {
                bookingID: data.booking?.BookingID || data.booking?.bookingID,
                // Check what the API actually returns
                paymentStatus: data.booking?.PaymentStatus || data.booking?.PaymentTransactionStatus || "Paid",
                transactionID: data.transactionID || data.booking?.TransactionID
            };

            localStorage.setItem("bookingData", JSON.stringify(bookingData));

            // Show success message
            alert("Payment successful! Redirecting to confirmation...");

            // Redirect to confirmation page
            window.location.href = "confirmation.html";
        } else {
            alert("Payment failed: " + data.message);
            payButton.textContent = originalText;
            payButton.disabled = false;
        }
    } catch (error) {
        console.error("Payment error:", error);
        alert("An error occurred during payment. Please try again.");
        payButton.textContent = originalText;
        payButton.disabled = false;
    }
}

// Alternative function if main one fails
async function confirmPaymentAlternative() {
    const paymentMethodSelect = document.querySelector('.form-select');
    const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : "Credit Card";

    if (paymentMethod === "Select Method") {
        alert("Please select a payment method");
        return;
    }

    if (!bookingData.bookingID) {
        alert("No booking found. Please start over.");
        window.location.href = "searchflight.html";
        return;
    }

    // Show loading state
    const payButton = document.querySelector('.btn-success');
    const originalText = payButton.textContent;
    payButton.textContent = "Processing...";
    payButton.disabled = true;

    try {
        // Try the simple API
        const response = await fetch("http://localhost:3000/confirm-payment-simple", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bookingID: bookingData.bookingID,
                paymentMethod: paymentMethod,
                amount: bookingData.price
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update booking data with payment info
            bookingData.payment = {
                method: paymentMethod,
                paymentStatus: "Paid",  // Changed from 'status' to 'paymentStatus'
                transactionID: data.transactionID || `TXN-${Date.now()}`,
                amount: bookingData.price,
                date: new Date().toISOString()
            };

            localStorage.setItem("bookingData", JSON.stringify(bookingData));

            // Show success message
            alert("Payment successful! Redirecting to confirmation...");

            // Redirect to confirmation page
            window.location.href = "confirmation.html";
        } else {
            alert("Payment failed: " + data.message);
            payButton.textContent = originalText;
            payButton.disabled = false;
        }
    } catch (error) {
        console.error("Payment error:", error);
        alert("An error occurred during payment. Please try again.");
        payButton.textContent = originalText;
        payButton.disabled = false;
    }
}

// Update button to try alternative if main fails
async function confirmPaymentWithRetry() {
    try {
        await confirmPayment();
    } catch (error) {
        console.log("Main payment failed, trying alternative...");
        await confirmPaymentAlternative();
    }
}

// Add auto-formatting for card number
document.querySelector('input[placeholder="XXXX XXXX XXXX XXXX"]')?.addEventListener('input', function (e) {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    e.target.value = formatted;
});

// Add auto-formatting for CVV
document.querySelector('input[placeholder="***"]')?.addEventListener('input', function (e) {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 3) {
        value = value.substring(0, 3);
    }
    e.target.value = value;
});

// Debug helper
console.log("Payment page loaded");
console.log("Booking data:", bookingData);
console.log("Booking ID:", bookingData.bookingID);

// Check what the API actually returns
async function testPaymentAPI() {
    try {
        const testResponse = await fetch("http://localhost:3000/confirm-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bookingID: bookingData.bookingID,
                paymentMethod: "Credit Card",
                amount: bookingData.price
            })
        });
        const testData = await testResponse.json();
        console.log("API Response Structure:", testData);
        console.log("Booking object keys:", Object.keys(testData.booking || {}));
    } catch (error) {
        console.error("Test API error:", error);
    }
}