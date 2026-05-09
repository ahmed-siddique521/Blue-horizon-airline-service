function adminLogout() {
    // remove admin login state
    localStorage.removeItem("isAdmin");

    // redirect to admin login
    window.location.href = "admin-login.html";
}
