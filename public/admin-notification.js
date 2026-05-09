// admin-notifications.js - UPDATED
console.log("Admin notifications JS loaded");

const API_BASE_URL = "http://localhost:3000";

fetch(`${API_BASE_URL}/admin/notifications`)
    .then(res => res.json())
    .then(notifications => {
        console.log("DEBUG - Raw data:", notifications);

        const list = document.getElementById("notificationList");
        list.innerHTML = "";

        if (notifications.length === 0) {
            list.innerHTML = '<div class="list-group-item text-center">No notifications</div>';
            return;
        }

        notifications.forEach(notification => {
            const div = document.createElement("div");
            div.className = "list-group-item";

            // USE NEW VARIABLE NAMES WITH PROPER NULL CHECKING:
            const message = notification.NotificationMessage ? notification.NotificationMessage : "No message";
            const type = notification.NotificationType ? notification.NotificationType : "General";
            const isNew = notification.IsNew === 1 || notification.IsNew === true;
            const createdAt = notification.CreatedAt ? new Date(notification.CreatedAt) : new Date();

            // Format the display
            div.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong class="text-primary">${type}:</strong>
                        <span class="ms-2">${message}</span>
                        <div class="text-muted small mt-1">
                            ${createdAt.toLocaleString()}
                        </div>
                    </div>
                    ${isNew ? `<span class="badge bg-danger">NEW</span>` : ''}
                </div>
            `;

            list.appendChild(div);
        });
    })
    .catch(err => {
        console.error("Fetch error:", err);
        document.getElementById("notificationList").innerHTML =
            '<div class="list-group-item text-danger">Error loading notifications</div>';
    });