document.querySelector("form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("adminUser").value;
    const password = document.getElementById("adminPass").value;

    const response = await fetch("http://localhost:3000/admin-login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.message === "Admin login successful") {
        localStorage.setItem("isAdmin", "true");
        window.location.href = "admin-dashboard.html";
    } else {
        document.getElementById("errorMsg").innerText = data.message;
    }
});
