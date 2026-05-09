// admin-users.js - Updated for new UI
console.log("Admin Users JS loaded");

let currentUsers = [];
let editingUserId = null;

// Load all users
async function loadUsers() {
    try {
        showLoading(true);
        hideError();
        hideEditForm();
        hideAddForm();

        const response = await fetch("http://localhost:3000/admin/users");

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const users = await response.json();
        currentUsers = users;

        renderUsersTable(users);
        showLoading(false);

    } catch (error) {
        console.error("Error loading users:", error);
        showLoading(false);
        showError("Failed to load users. Please try again.");
    }
}

// Render users table
function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    const noUsersMessage = document.getElementById('noUsersMessage');
    const usersTable = document.getElementById('usersTable');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Hide loading
    loadingSpinner.style.display = 'none';

    if (users.length === 0) {
        tbody.innerHTML = '';
        noUsersMessage.style.display = 'block';
        usersTable.style.display = 'none';
        return;
    }

    noUsersMessage.style.display = 'none';
    usersTable.style.display = 'block';

    let tableHTML = '';

    users.forEach(user => {
        const date = new Date(user.CreatedAt);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        tableHTML += `
            <tr id="user-${user.UserID}">
                <td><strong>${user.UserID}</strong></td>
                <td>${user.FirstName}</td>
                <td>${user.LastName}</td>
                <td>${user.Email}</td>
                <td>
                    <span class="status-badge ${user.Status === 'active' ? 'status-active' : 'status-inactive'}">
                        ${user.Status ? user.Status.charAt(0).toUpperCase() + user.Status.slice(1) : 'Active'}
                    </span>
                </td>
                <td class="date-cell">${formattedDate}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-edit btn-action" 
                                onclick="startEdit(${user.UserID})"
                                title="Edit User">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-delete btn-action" 
                                onclick="showDeleteConfirmation(${user.UserID})"
                                title="Delete User">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = tableHTML;
}

// Show add user form
function showAddForm() {
    document.getElementById('addUserForm').style.display = 'block';
    document.getElementById('addFirstName').focus();
    document.getElementById('usersTable').style.display = 'none';
}

// Hide add user form
function hideAddForm() {
    document.getElementById('addUserForm').style.display = 'none';
    // Clear form
    document.getElementById('addFirstName').value = '';
    document.getElementById('addLastName').value = '';
    document.getElementById('addEmail').value = '';
    document.getElementById('addPassword').value = '';
    // Show table again
    if (currentUsers.length > 0) {
        document.getElementById('usersTable').style.display = 'block';
    }
}

// Start editing a user
function startEdit(userId) {
    const user = currentUsers.find(u => u.UserID == userId);

    if (!user) {
        showSuccess("User not found", false);
        return;
    }

    editingUserId = userId;

    // Fill edit form
    document.getElementById('editUserId').value = user.UserID;
    document.getElementById('editFirstName').value = user.FirstName;
    document.getElementById('editLastName').value = user.LastName;
    document.getElementById('editEmail').value = user.Email;
    document.getElementById('editStatus').value = user.Status || 'active';

    // Show edit form
    document.getElementById('editUserForm').style.display = 'block';
    document.getElementById('usersTable').style.display = 'none';
}

// Cancel editing
function cancelEdit() {
    editingUserId = null;
    document.getElementById('editUserForm').style.display = 'none';
    if (currentUsers.length > 0) {
        document.getElementById('usersTable').style.display = 'block';
    }
}

// Hide edit form
function hideEditForm() {
    document.getElementById('editUserForm').style.display = 'none';
}

// Save user changes
async function saveUser() {
    const userId = document.getElementById('editUserId').value;
    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const status = document.getElementById('editStatus').value;

    if (!firstName || !lastName || !email) {
        showSuccess("Please fill in all required fields", false);
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: firstName,
                lastName: lastName,
                email: email,
                status: status
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update user");
        }

        editingUserId = null;
        cancelEdit();
        loadUsers();
        showSuccess("User updated successfully!");

    } catch (error) {
        console.error("Error updating user:", error);
        showSuccess("Error: " + error.message, false);
    }
}

// Add new user
async function addUser() {
    const firstName = document.getElementById('addFirstName').value.trim();
    const lastName = document.getElementById('addLastName').value.trim();
    const email = document.getElementById('addEmail').value.trim();
    const password = document.getElementById('addPassword').value;

    if (!firstName || !lastName || !email || !password) {
        showSuccess("Please fill in all required fields", false);
        return;
    }

    if (password.length < 6) {
        showSuccess("Password must be at least 6 characters", false);
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/admin/users", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to add user");
        }

        hideAddForm();
        loadUsers();
        showSuccess("User added successfully!");

    } catch (error) {
        console.error("Error adding user:", error);
        showSuccess("Error: " + error.message, false);
    }
}

// Show delete confirmation
function showDeleteConfirmation(userId) {
    document.getElementById('deleteUserId').value = userId;
    document.getElementById('confirmationDialog').style.display = 'flex';
}

// Hide confirmation dialog
function hideConfirmation() {
    document.getElementById('confirmationDialog').style.display = 'none';
}

// Confirm delete
async function confirmDelete() {
    const userId = document.getElementById('deleteUserId').value;

    try {
        const response = await fetch(`http://localhost:3000/admin/users/${userId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete user");
        }

        hideConfirmation();
        loadUsers();
        showSuccess("User deleted successfully!");

    } catch (error) {
        console.error("Error deleting user:", error);
        showSuccess("Error: " + error.message, false);
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

// Search users
async function searchUsers() {
    const searchTerm = document.getElementById('searchInput').value.trim();

    if (!searchTerm) {
        loadUsers();
        return;
    }

    try {
        showLoading(true);

        const response = await fetch(`http://localhost:3000/admin/users/search?query=${encodeURIComponent(searchTerm)}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const users = await response.json();
        currentUsers = users;

        renderUsersTable(users);
        showLoading(false);

    } catch (error) {
        console.error("Error searching users:", error);
        showLoading(false);
        showError("Search failed. Please try again.");
    }
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
    loadUsers();

    // Add Enter key support for search
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchUsers();
        }
    });
});