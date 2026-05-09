document.getElementById("searchForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const from = document.getElementById("departureCity").value.trim();
    const to = document.getElementById("destinationCity").value.trim();
    const date = document.getElementById("date").value;

    if (!from || !to || !date) {
        alert("Please fill all fields");
        return;
    }

    window.location.href =
        `searchflight.html?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`;
});
