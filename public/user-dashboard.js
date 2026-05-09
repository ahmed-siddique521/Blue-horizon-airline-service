// user-dashboard.js - Simplified Version (Just name and email)
const API_BASE_URL = 'http://localhost:3000';

// ========== SIMPLE AUTH CHECK ==========
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userData = localStorage.getItem('userData');

    if (!isLoggedIn || !userData) {
        alert('Please login to access dashboard');
        window.location.href = 'login.html';
        return null;
    }

    try {
        return JSON.parse(userData);
    } catch (error) {
        console.error('Error parsing user data:', error);
        alert('Session expired. Please login again.');
        localStorage.clear();
        window.location.href = 'login.html';
        return null;
    }
}

// ========== FETCH USER DETAILS ==========
async function fetchUserDetails() {
    const userData = checkAuth();
    if (!userData) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userData.email}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.user || userData;

    } catch (error) {
        console.error('Error fetching user details:', error);
        // Fallback to localStorage data
        return userData;
    }
}

// ========== UPDATE USER PROFILE UI ==========
function updateUserProfile(user) {
    // Update user name
    const userNameElement = document.getElementById('userName');
    if (userNameElement && user) {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
        userNameElement.textContent = fullName;

        // Update avatar with initials
        const avatarElement = document.getElementById('userAvatar');
        if (avatarElement) {
            const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();
            avatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=007bff&color=fff&size=120`;
        }
    }

    // Update user email
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement && user.email) {
        userEmailElement.textContent = user.email;
    }

    // Update user phone (set static value)
    const userPhoneElement = document.getElementById('userPhone');
    if (userPhoneElement) {
        userPhoneElement.textContent = '+92 324-5921039';
    }
}

// ========== SET STATIC BOOKINGS DATA ==========
function setStaticBookingsData() {
    // Set static stats
    document.getElementById('totalBookings').textContent = '2';
    document.getElementById('completedFlights').textContent = '1';
    document.getElementById('upcomingFlights').textContent = '1';

    // Set static upcoming flights
    document.getElementById('upcomingFlightsList').innerHTML = `
        <div class="booking-card p-3 mb-3 border rounded">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">BH101 - Karachi to Lahore</h6>
                    <p class="mb-1 text-muted">
                        <i class="bi bi-calendar"></i> Dec 20, 2023
                    </p>
                    <p class="mb-0">
                        <span class="badge bg-info">upcoming</span>
                        <span class="ms-2">2 passenger(s)</span>
                    </p>
                </div>
                <div class="text-end">
                    <p class="mb-1 fw-bold">PKR 24,000</p>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewBooking('1')">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `;

    // Set static flight history
    document.getElementById('flightHistoryContent').innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Flight</th>
                        <th>Route</th>
                        <th>Date</th>
                        <th>Passengers</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>BH202</td>
                        <td>Karachi to Islamabad</td>
                        <td>Dec 10, 2023</td>
                        <td>1</td>
                        <td>PKR 25,000</td>
                        <td><span class="badge bg-success">completed</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-secondary" onclick="viewBooking('2')">
                                Details
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

// ========== INITIALIZE DASHBOARD ==========
async function initializeDashboard() {
    // Check authentication
    const userData = checkAuth();
    if (!userData) return;

    // Show loading
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';

    try {
        // Fetch user details from backend
        const userDetails = await fetchUserDetails();

        // Update user profile with name and email
        updateUserProfile(userDetails);

        // Set static data for everything else
        setStaticBookingsData();

    } catch (error) {
        console.error('Error loading dashboard:', error);

        // Use localStorage data as fallback
        updateUserProfile(userData);
        setStaticBookingsData();

    } finally {
        // Hide loading
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

// ========== SIMPLE VIEW BOOKING ==========
function viewBooking(bookingId) {
    alert(`View booking details for ID: ${bookingId}`);
}

// ========== EVENT LISTENER ==========
document.addEventListener('DOMContentLoaded', function () {
    initializeDashboard();

    // Update navbar if function exists
    if (window.updateNavbar) {
        window.updateNavbar();
    }
});

// Make functions available globally
window.viewBooking = viewBooking;