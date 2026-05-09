// admin-flights.js
console.log("Flight Management JS loaded");

let currentFlights = [];

// Load all flights
async function loadFlights() {
    try {
        showLoading(true);
        hideError();
        hideEditForm();
        hideAddForm();

        const response = await fetch("http://localhost:3000/admin/flights");

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const flights = await response.json();
        currentFlights = flights;

        renderFlightsTable(flights);
        showLoading(false);

    } catch (error) {
        console.error("Error loading flights:", error);
        showLoading(false);
        showError("Failed to load flights. Please try again.");
    }
}

// Render flights table
function renderFlightsTable(flights) {
    const tbody = document.getElementById('flightsTableBody');
    const noFlightsMessage = document.getElementById('noFlightsMessage');
    const flightsTable = document.getElementById('flightsTable');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Hide loading
    loadingSpinner.style.display = 'none';

    if (flights.length === 0) {
        tbody.innerHTML = '';
        noFlightsMessage.style.display = 'block';
        flightsTable.style.display = 'none';
        return;
    }

    noFlightsMessage.style.display = 'none';
    flightsTable.style.display = 'block';

    let tableHTML = '';

    flights.forEach(flight => {
        // Format date
        const departureDate = new Date(flight.DepartureDate);
        const formattedDate = departureDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        // Format time
        const departureTime = flight.DepartureTime;
        const arrivalTime = flight.ArrivalTime;

        tableHTML += `
            <tr id="flight-${flight.FlightID}">
                <td><strong>${flight.FlightID}</strong></td>
                <td>
                    <span class="flight-number">${flight.FlightNumber}</span>
                </td>
                <td>
                    <div class="route-info">
                        <span class="route-from">${flight.DepartureCity}</span>
                        <span class="route-arrow">→</span>
                        <span class="route-to">${flight.DestinationCity}</span>
                    </div>
                </td>
                <td>
                    <div class="date-info">
                        <span class="date-day">${formattedDate}</span>
                    </div>
                </td>
                <td>
                    <div class="time-info">
                        <span class="departure-time">${departureTime}</span>
                        <span class="time-separator">to</span>
                        <span class="arrival-time">${arrivalTime}</span>
                    </div>
                </td>
                <td class="price-info">PKR ${flight.Price.toLocaleString()}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-edit btn-action" 
                                onclick="startEdit(${flight.FlightID})"
                                title="Edit Flight">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-delete btn-action" 
                                onclick="showDeleteConfirmation(${flight.FlightID})"
                                title="Delete Flight">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = tableHTML;
}

// Show add flight form
function showAddForm() {
    document.getElementById('addFlightForm').style.display = 'block';

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('addDepartureDate').value = today;

    // Set default times
    document.getElementById('addDepartureTime').value = '08:00';
    document.getElementById('addArrivalTime').value = '10:00';

    document.getElementById('addFlightNumber').focus();
    document.getElementById('flightsTable').style.display = 'none';
}

// Hide add flight form
function hideAddForm() {
    document.getElementById('addFlightForm').style.display = 'none';
    // Clear form
    document.getElementById('addFlightNumber').value = '';
    document.getElementById('addDepartureCity').value = '';
    document.getElementById('addDestinationCity').value = '';
    document.getElementById('addDepartureDate').value = '';
    document.getElementById('addDepartureTime').value = '';
    document.getElementById('addArrivalTime').value = '';
    document.getElementById('addPrice').value = '';
    // Show table again
    if (currentFlights.length > 0) {
        document.getElementById('flightsTable').style.display = 'block';
    }
}

// Start editing a flight
function startEdit(flightId) {
    const flight = currentFlights.find(f => f.FlightID == flightId);

    if (!flight) {
        showSuccess("Flight not found", false);
        return;
    }

    // Fill edit form
    document.getElementById('editFlightId').value = flight.FlightID;
    document.getElementById('editFlightNumber').value = flight.FlightNumber;
    document.getElementById('editDepartureCity').value = flight.DepartureCity;
    document.getElementById('editDestinationCity').value = flight.DestinationCity;
    document.getElementById('editDepartureDate').value = flight.DepartureDate;
    document.getElementById('editDepartureTime').value = flight.DepartureTime;
    document.getElementById('editArrivalTime').value = flight.ArrivalTime;
    document.getElementById('editPrice').value = flight.Price;

    // Show edit form
    document.getElementById('editFlightForm').style.display = 'block';
    document.getElementById('flightsTable').style.display = 'none';
}

// Cancel editing
function cancelEdit() {
    document.getElementById('editFlightForm').style.display = 'none';
    if (currentFlights.length > 0) {
        document.getElementById('flightsTable').style.display = 'block';
    }
}

// Hide edit form
function hideEditForm() {
    document.getElementById('editFlightForm').style.display = 'none';
}

// Save flight changes
async function saveFlight() {
    const flightId = document.getElementById('editFlightId').value;
    const flightNumber = document.getElementById('editFlightNumber').value.trim();
    const departureCity = document.getElementById('editDepartureCity').value.trim();
    const destinationCity = document.getElementById('editDestinationCity').value.trim();
    const departureDate = document.getElementById('editDepartureDate').value;
    const departureTime = document.getElementById('editDepartureTime').value;
    const arrivalTime = document.getElementById('editArrivalTime').value;
    const price = document.getElementById('editPrice').value;

    // Validation
    if (!flightNumber || !departureCity || !destinationCity || !departureDate || !departureTime || !arrivalTime || !price) {
        showSuccess("Please fill in all required fields", false);
        return;
    }

    if (price <= 0) {
        showSuccess("Price must be greater than 0", false);
        return;
    }

    if (departureTime >= arrivalTime) {
        showSuccess("Arrival time must be after departure time", false);
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/admin/flights/${flightId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                flightNumber: flightNumber,
                departureCity: departureCity,
                destinationCity: destinationCity,
                departureDate: departureDate,
                departureTime: departureTime,
                arrivalTime: arrivalTime,
                price: parseInt(price)
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update flight");
        }

        cancelEdit();
        loadFlights();
        showSuccess("Flight updated successfully!");

    } catch (error) {
        console.error("Error updating flight:", error);
        showSuccess("Error: " + error.message, false);
    }
}

// Add new flight
async function addFlight() {
    const flightNumber = document.getElementById('addFlightNumber').value.trim();
    const departureCity = document.getElementById('addDepartureCity').value.trim();
    const destinationCity = document.getElementById('addDestinationCity').value.trim();
    const departureDate = document.getElementById('addDepartureDate').value;
    const departureTime = document.getElementById('addDepartureTime').value;
    const arrivalTime = document.getElementById('addArrivalTime').value;
    const price = document.getElementById('addPrice').value;

    // Validation
    if (!flightNumber || !departureCity || !destinationCity || !departureDate || !departureTime || !arrivalTime || !price) {
        showSuccess("Please fill in all required fields", false);
        return;
    }

    if (price <= 0) {
        showSuccess("Price must be greater than 0", false);
        return;
    }

    if (departureTime >= arrivalTime) {
        showSuccess("Arrival time must be after departure time", false);
        return;
    }

    // Check if departure date is in the past
    const today = new Date();
    const selectedDate = new Date(departureDate);
    if (selectedDate < today.setHours(0, 0, 0, 0)) {
        showSuccess("Departure date cannot be in the past", false);
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/admin/flights", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                flightNumber: flightNumber,
                departureCity: departureCity,
                destinationCity: destinationCity,
                departureDate: departureDate,
                departureTime: departureTime,
                arrivalTime: arrivalTime,
                price: parseInt(price)
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to add flight");
        }

        hideAddForm();
        loadFlights();
        showSuccess("Flight added successfully!");

    } catch (error) {
        console.error("Error adding flight:", error);
        showSuccess("Error: " + error.message, false);
    }
}

// Show delete confirmation
function showDeleteConfirmation(flightId) {
    document.getElementById('deleteFlightId').value = flightId;
    document.getElementById('confirmationDialog').style.display = 'flex';
}

// Hide confirmation dialog
function hideConfirmation() {
    document.getElementById('confirmationDialog').style.display = 'none';
}

// Confirm delete
async function confirmDelete() {
    const flightId = document.getElementById('deleteFlightId').value;

    try {
        const response = await fetch(`http://localhost:3000/admin/flights/${flightId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete flight");
        }

        hideConfirmation();
        loadFlights();
        showSuccess("Flight deleted successfully!");

    } catch (error) {
        console.error("Error deleting flight:", error);
        showSuccess("Error: " + error.message, false);
    }
}

// Search flights
async function searchFlights() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();

    console.log("Searching for:", searchTerm);

    try {
        showLoading(true);
        hideError();

        // Build URL
        let url = 'http://localhost:3000/admin/flights';

        if (searchTerm) {
            url = `http://localhost:3000/admin/flights/search?query=${encodeURIComponent(searchTerm)}`;
        }

        console.log("Fetching URL:", url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const flights = await response.json();
        currentFlights = flights;

        console.log("Found flights:", flights.length);

        renderFlightsTable(flights);
        showLoading(false);

    } catch (error) {
        console.error("Search error:", error);
        showLoading(false);
        showError("Search failed: " + error.message);
    }
}
// Show success message
function showSuccess(message, isSuccess = true) {
    const successElement = document.getElementById('successMessage');
    const successText = document.getElementById('successText');

    successText.textContent = message;
    successElement.style.display = 'flex';
    successElement.style.background = isSuccess ?
        'linear-gradient(135deg, #198754, #146c43)' :
        'linear-gradient(135deg, #dc3545, #b02a37)';

    // Auto hide after 3 seconds
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 3000);
}

// Hide success message
function hideSuccess() {
    document.getElementById('successMessage').style.display = 'none';
}

// Utility functions
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    errorText.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    loadFlights();

    // Add Enter key support for search
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchFlights();
        }
    });
});

