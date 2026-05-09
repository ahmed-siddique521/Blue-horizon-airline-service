// searchflight.js - FIXED VERSION
let allFlights = []; // Store all flights for filtering

// DOM Elements - will be initialized when DOM is loaded
let resultsDiv, searchInfo, pageTitle, loadingDiv, noResultsDiv, searchForm;

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize DOM elements
    resultsDiv = document.getElementById("results");
    searchInfo = document.getElementById("searchInfo");
    pageTitle = document.getElementById("pageTitle");
    loadingDiv = document.getElementById("loading");
    noResultsDiv = document.getElementById("noResults");
    searchForm = document.getElementById("searchForm");

    // Get URL parameters if any
    const params = new URLSearchParams(window.location.search);
    const departureCity = params.get("from");
    const destinationCity = params.get("to");
    const date = params.get("date");

    if (departureCity && destinationCity && date) {
        // If coming from home page search, perform that search
        document.getElementById("departureCity").value = departureCity;
        document.getElementById("destinationCity").value = destinationCity;
        document.getElementById("date").value = date;
        searchFlights(departureCity, destinationCity, date);
    } else {
        // Otherwise show all flights
        loadAllFlights();
    }

    // Handle form submission
    searchForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const from = document.getElementById("departureCity").value.trim();
        const to = document.getElementById("destinationCity").value.trim();
        const date = document.getElementById("date").value;

        if (!from || !to || !date) {
            alert("Please fill in all search fields");
            return;
        }

        searchFlights(from, to, date);
    });
});

// Load all flights
async function loadAllFlights() {
    showLoading(true);
    clearSearchForm();

    try {
        console.log("Loading all flights...");
        const response = await fetch("http://localhost:3000/all-flights");

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allFlights = await response.json();
        console.log(`Found ${allFlights.length} flights`);

        displayFlights(allFlights);
        updateSearchInfo("Showing all available flights", allFlights.length);
        pageTitle.textContent = "All Available Flights";

    } catch (err) {
        console.error("Error loading flights:", err);
        resultsDiv.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error loading flights</h5>
                <p>${err.message}</p>
                <p>Please check if the server is running and try again.</p>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

// Search flights
async function searchFlights(from, to, date) {
    showLoading(true);

    try {
        console.log(`Searching flights: ${from} → ${to} on ${date}`);
        const response = await fetch("http://localhost:3000/search-flights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                departureCity: from,
                destinationCity: to,
                date: date
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const flights = await response.json();
        console.log(`Found ${flights.length} flights for search`);

        displayFlights(flights);

        if (flights.length > 0) {
            updateSearchInfo(`${from} → ${to} | ${formatDate(date)}`, flights.length);
            pageTitle.textContent = "Search Results";
        } else {
            showNoResults();
            updateSearchInfo(`No flights found for ${from} → ${to} on ${formatDate(date)}`, 0);
        }

    } catch (err) {
        console.error("Error searching flights:", err);
        resultsDiv.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error searching flights</h5>
                <p>${err.message}</p>
                <p>Please check your search criteria and try again.</p>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

// In your searchflight.js, update the displayFlights function:
function displayFlights(flights) {
    if (flights.length === 0) {
        showNoResults();
        return;
    }

    let html = '<div class="row">';

    flights.forEach(flight => {
        // Since AvailableSeats doesn't exist, use a default value or calculate it
        // For now, we'll assume all flights have seats available
        const availableSeats = 50; // Default value since your table doesn't have this column

        // Determine seat availability badge
        let seatBadge = '';
        if (availableSeats >= 10) {
            seatBadge = '<span class="badge badge-available">Available</span>';
        } else if (availableSeats > 0) {
            seatBadge = `<span class="badge badge-limited">Only ${availableSeats} left</span>`;
        } else {
            seatBadge = '<span class="badge badge-full">Fully Booked</span>';
        }

        // Format date and time
        let formattedDate = "Date not available";
        try {
            if (flight.DepartureDate) {
                const flightDate = new Date(flight.DepartureDate);
                formattedDate = flightDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch (e) {
            console.error("Error formatting date:", e);
        }

        // Format price with commas
        const formattedPrice = flight.Price ? flight.Price.toLocaleString() : '0';

        // Safely escape the flight object for onclick
        const flightJson = JSON.stringify(flight).replace(/"/g, '&quot;');

        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card flight-card shadow-sm h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="card-title mb-1">${flight.FlightNumber || 'N/A'}</h5>
                                <p class="text-muted mb-0">${flight.DepartureCity || 'N/A'} → ${flight.DestinationCity || 'N/A'}</p>
                            </div>
                            ${seatBadge}
                        </div>
                        
                        <div class="mb-3">
                            <p class="mb-1"><i class="bi bi-calendar me-2"></i>${formattedDate}</p>
                            <p class="mb-1"><i class="bi bi-clock me-2"></i>${flight.DepartureTime || 'N/A'} - ${flight.ArrivalTime || 'N/A'}</p>
                            <p class="mb-0"><i class="bi bi-person me-2"></i>Seats Available</p>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <h4 class="text-primary mb-0">PKR ${formattedPrice}</h4>
                            <button class="btn btn-success" 
                                    onclick="selectFlight('${flightJson.replace(/'/g, "\\'")}')">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    resultsDiv.innerHTML = html;
    noResultsDiv.style.display = 'none';
}

// Update search info text
function updateSearchInfo(text, count) {
    if (count > 0) {
        searchInfo.innerHTML = `${text} <span class="badge bg-primary ms-2">${count} flights</span>`;
    } else {
        searchInfo.textContent = text;
    }
}

// Show no results message
function showNoResults() {
    resultsDiv.innerHTML = '';
    noResultsDiv.style.display = 'block';
}

// Show/hide loading spinner
function showLoading(show) {
    loadingDiv.style.display = show ? 'block' : 'none';
    resultsDiv.style.display = show ? 'none' : 'block';
}

// Format date for display
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// Clear search form
function clearSearchForm() {
    document.getElementById("departureCity").value = '';
    document.getElementById("destinationCity").value = '';
    document.getElementById("date").value = '';
}

// Select flight (make it globally accessible)
window.selectFlight = function (flightJson) {
    try {
        const flight = JSON.parse(flightJson);
        const bookingData = {
            flightID: flight.FlightID,
            flightNumber: flight.FlightNumber,
            departureCity: flight.DepartureCity,
            destinationCity: flight.DestinationCity,
            date: flight.DepartureDate ? flight.DepartureDate.split("T")[0] : new Date().toISOString().split('T')[0],
            price: flight.Price || 0
        };

        // Save selected flight
        localStorage.setItem("bookingData", JSON.stringify(bookingData));

        // 🔐 LOGIN CHECK
        const isLoggedIn = localStorage.getItem("isLoggedIn");

        if (isLoggedIn !== "true") {
            // save redirect path
            localStorage.setItem("redirectAfterLogin", "bookings.html");
            window.location.href = "login.html";
        } else {
            window.location.href = "bookings.html";
        }
    } catch (error) {
        console.error("Error selecting flight:", error);
        alert("Error selecting flight. Please try again.");
    }
};

// Add debugging
console.log("searchflight.js loaded");