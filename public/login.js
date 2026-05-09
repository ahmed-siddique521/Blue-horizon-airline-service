// login.js - Updated with improved navbar management and user dashboard link

// ========== LOGIN FUNCTION ==========
document.getElementById("loginForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Show loading state
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Logging in...";
    submitBtn.disabled = true;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Save login state AND user data
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userEmail", email);
            localStorage.setItem("userData", JSON.stringify(data.user));

            console.log("User data saved:", data.user);

            // 🔁 redirect back if needed
            const redirectPage = localStorage.getItem("redirectAfterLogin");

            if (redirectPage) {
                localStorage.removeItem("redirectAfterLogin");
                window.location.href = redirectPage;
            } else {
                // Redirect to user dashboard after login
                window.location.href = "user-dashboard.html";
            }
        } else {
            alert(data.message || "Login failed");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred. Please try again.");
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// ========== LOGOUT FUNCTION ==========
function logoutUser() {
    if (confirm("Are you sure you want to logout?")) {
        // Clear all user-related data from localStorage
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userData");
        localStorage.removeItem("redirectAfterLogin");
        localStorage.removeItem("bookingData");

        // Show confirmation message
        alert("You have been logged out successfully.");

        // Redirect to homepage
        window.location.href = "index.html";
    }
}

// Simple logout without confirmation
function quickLogout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userData");
    localStorage.removeItem("redirectAfterLogin");
    localStorage.removeItem("bookingData");
    window.location.href = "index.html";
}

// ========== NAVBAR MANAGEMENT ==========
function updateNavbar() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    // Find navbar elements
    const loginNav = document.getElementById("loginNav");
    const registerNav = document.getElementById("registerNav");
    const existingLogoutNav = document.getElementById("logoutNav");
    const existingUserGreeting = document.getElementById("userGreeting");
    const navbarNav = document.querySelector('.navbar-nav');

    if (!navbarNav) {
        console.log("Navbar not found on this page");
        return;
    }

    if (isLoggedIn) {
        // Hide login and register links
        if (loginNav) loginNav.style.display = "none";
        if (registerNav) registerNav.style.display = "none";

        // Remove existing user greeting if exists
        if (existingUserGreeting) {
            existingUserGreeting.remove();
        }

        // Remove existing logout button if exists
        if (existingLogoutNav) {
            existingLogoutNav.remove();
        }

        // Find the admin login item to insert before it
        const adminLoginItem = document.querySelector('a[href="admin-login.html"]');
        const adminLoginParent = adminLoginItem ? adminLoginItem.parentElement : null;

        // Create user greeting as a clickable link to dashboard
        const userGreeting = document.createElement('li');
        userGreeting.className = 'nav-item';
        userGreeting.id = 'userGreeting';
        userGreeting.innerHTML = `
            <a class="nav-link" href="user-dashboard.html" style="cursor: pointer;">
                <i class="bi bi-person-circle"></i> 
                ${userData.firstName || userData.email || 'User'}
            </a>
        `;

        // Create logout button
        const logoutItem = document.createElement('li');
        logoutItem.className = 'nav-item';
        logoutItem.id = 'logoutNav';
        logoutItem.innerHTML = `
            <a class="nav-link" href="#" onclick="logoutUser()">
                <i class="bi bi-box-arrow-right"></i> Logout
            </a>
        `;

        // Insert before admin login or at the end
        if (adminLoginParent) {
            navbarNav.insertBefore(userGreeting, adminLoginParent);
            navbarNav.insertBefore(logoutItem, adminLoginParent);
        } else {
            navbarNav.appendChild(userGreeting);
            navbarNav.appendChild(logoutItem);
        }

    } else {
        // Show login and register links
        if (loginNav) loginNav.style.display = "block";
        if (registerNav) registerNav.style.display = "block";

        // Remove logout button if exists
        if (existingLogoutNav) {
            existingLogoutNav.remove();
        }

        // Remove user greeting if exists
        if (existingUserGreeting) {
            existingUserGreeting.remove();
        }
    }
}

// ========== CHECK PROTECTED PAGES ==========
function checkProtectedPages() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const currentPage = window.location.pathname.split("/").pop();

    // Pages that require authentication
    const protectedPages = [
        "bookings.html",
        "seatselection.html",
        "payment.html",
        "confirmation.html",
        "user-dashboard.html" // Add dashboard to protected pages
    ];

    if (protectedPages.includes(currentPage) && !isLoggedIn) {
        alert("Please login first to access this page");
        localStorage.setItem("redirectAfterLogin", currentPage);
        window.location.href = "login.html";
        return false;
    }

    return isLoggedIn;
}

// ========== INITIALIZE ON PAGE LOAD ==========
function initializePage() {
    // Update navbar on every page
    updateNavbar();

    // Check protected pages
    checkProtectedPages();

    // Check if we're on a page that shouldn't be accessed when logged in
    const currentPage = window.location.pathname.split("/").pop();
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    // If user is logged in and tries to access login/register pages, redirect
    if (isLoggedIn && (currentPage === "login.html" || currentPage === "register.html")) {
        alert("You are already logged in!");
        window.location.href = "user-dashboard.html";
    }
}

// ========== ADD BOOTSTRAP ICONS IF NOT PRESENT ==========
function addBootstrapIcons() {
    if (!document.querySelector('link[href*="bootstrap-icons"]')) {
        const iconLink = document.createElement('link');
        iconLink.rel = 'stylesheet';
        iconLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css';
        document.head.appendChild(iconLink);
    }
}

// ========== RUN ON PAGE LOAD ==========
document.addEventListener('DOMContentLoaded', function () {
    addBootstrapIcons();
    initializePage();
});

// Also run when page is fully loaded
window.addEventListener('load', initializePage);

// Make functions available globally
window.logoutUser = logoutUser;
window.updateNavbar = updateNavbar;