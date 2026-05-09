const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const sql = require("mssql");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const dbConfig = {
    server: "DESKTOP-RNU8PGP\\SQLEXPRESS",
    database: "BlueHorizon2",
    user: "Ahmed1",
    password: "Ahmed@123",
    options: {
        trustServerCertificate: true
    },
};

sql.connect(dbConfig)
    .then(() => console.log("Connected to SQL Server"))
    .catch(err => console.log("DB Error:", err));

// ========== HELPER FUNCTION ==========
async function executeStoredProcedure(procedureName, inputs = [], outputs = []) {
    const request = new sql.Request();

    // Add input parameters
    inputs.forEach(input => {
        request.input(input.name, input.type, input.value);
    });

    // Add output parameters
    outputs.forEach(output => {
        request.output(output.name, output.type);
    });

    // Execute stored procedure
    const result = await request.execute(procedureName);

    // Return both recordset and output parameters
    return {
        recordset: result.recordset || [],
        output: result.output || {}
    };
}

// ========== UPDATED APIs USING STORED PROCEDURES ==========

// 1. Register User
app.post("/register", async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await executeStoredProcedure('sp_RegisterUser', [
            { name: 'FirstName', type: sql.VarChar(100), value: firstName },
            { name: 'LastName', type: sql.VarChar(100), value: lastName },
            { name: 'Email', type: sql.VarChar(255), value: email },
            { name: 'PasswordHash', type: sql.VarChar(255), value: passwordHash }
        ]);

        const newUser = result.recordset[0];

        res.json({
            success: true,
            message: "Registration successful",
            user: {
                userID: newUser.UserID,
                email: newUser.Email,
                firstName: newUser.FirstName,
                lastName: newUser.LastName,
                fullName: newUser.FirstName + ' ' + newUser.LastName
            }
        });

    } catch (err) {
        console.error(err);

        if (err.message && err.message.includes('Email already exists')) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Registration failed due to server error"
        });
    }
});

// 2. Login User
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await executeStoredProcedure('sp_LoginUser', [
            { name: 'Email', type: sql.VarChar(255), value: email.trim() }
        ]);

        if (result.recordset.length === 0) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(password.trim(), user.PasswordHash);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Invalid password"
            });
        }

        res.json({
            success: true,
            message: "Login successful",
            user: {
                userID: user.UserID,
                email: user.Email,
                firstName: user.FirstName,
                lastName: user.LastName,
                fullName: user.FirstName + ' ' + user.LastName
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Login failed due to server error"
        });
    }
});

// 3. Search Flights
app.post("/search-flights", async (req, res) => {
    const { departureCity, destinationCity, date } = req.body;

    console.log("🔍 Searching flights:", { departureCity, destinationCity, date });

    try {
        const result = await executeStoredProcedure('sp_SearchFlights', [
            { name: 'DepartureCity', type: sql.VarChar, value: departureCity },
            { name: 'DestinationCity', type: sql.VarChar, value: destinationCity },
            { name: 'DepartureDate', type: sql.Date, value: date }
        ]);

        console.log(`✅ Search results: ${result.recordset.length} flights found`);
        res.json(result.recordset);

    } catch (err) {
        console.error("❌ Flight search error:", err);
        res.status(500).json({ message: "Flight search failed" });
    }
});

// 4. Get All Flights
app.get("/all-flights", async (req, res) => {
    try {
        const result = await executeStoredProcedure('sp_GetAllFlights');
        console.log(`✅ All flights fetched: ${result.recordset.length} flights`);
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Error fetching all flights:", err);
        res.status(500).json({ message: "Failed to fetch flights" });
    }
});

// 5. Book Flight
app.post("/book-flight", async (req, res) => {
    const { userID, flightID, seat, passenger } = req.body;

    console.log("📋 Booking request received:", { userID, flightID, passenger });

    if (!userID || !flightID || !passenger) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    const requiredFields = ['fullName', 'cnic', 'gender', 'dob', 'contact'];
    for (const field of requiredFields) {
        if (!passenger[field]) {
            return res.status(400).json({
                success: false,
                message: `Missing passenger ${field}`
            });
        }
    }

    try {
        const result = await executeStoredProcedure('sp_BookFlight', [
            { name: 'UserID', type: sql.Int, value: userID },
            { name: 'FlightID', type: sql.Int, value: flightID },
            { name: 'Seat', type: sql.VarChar(10), value: seat || 'TBA' },
            { name: 'FullName', type: sql.NVarChar(100), value: passenger.fullName },
            { name: 'CNIC', type: sql.VarChar(15), value: passenger.cnic },
            { name: 'Gender', type: sql.VarChar(10), value: passenger.gender },
            { name: 'DOB', type: sql.Date, value: passenger.dob },
            { name: 'Contact', type: sql.VarChar(20), value: passenger.contact }
        ], [
            { name: 'BookingID', type: sql.Int }
        ]);

        const bookingID = result.output.BookingID;

        console.log("✅ Booking created with ID:", bookingID);

        res.json({
            success: true,
            bookingID: bookingID,
            message: "Passenger details saved successfully!"
        });

    } catch (err) {
        console.error("❌ Booking error:", err);

        if (err.number === 2627) {
            res.status(400).json({
                success: false,
                message: "Duplicate CNIC or passport number"
            });
        } else if (err.number === 547) {
            res.status(400).json({
                success: false,
                message: "Invalid reference (user or flight does not exist)"
            });
        } else {
            res.status(500).json({
                success: false,
                message: `Booking failed: ${err.message || "Database error occurred"}`
            });
        }
    }
});

// 6. Booking History
app.get("/booking-history/:userID", async (req, res) => {
    const userID = req.params.userID;

    try {
        const result = await executeStoredProcedure('sp_GetBookingHistory', [
            { name: 'UserID', type: sql.Int, value: userID }
        ]);

        console.log(`✅ Found ${result.recordset.length} bookings for user ${userID}`);
        res.json(result.recordset);

    } catch (err) {
        console.error("❌ Booking history error:", err);
        res.status(500).json({
            message: "Failed to load bookings"
        });
    }
});

// 7. Update Seat
app.put("/update-seat", async (req, res) => {
    try {
        const { bookingID, seatNumber } = req.body;

        console.log("📋 Seat update request:", { bookingID, seatNumber });

        if (!bookingID || !seatNumber) {
            return res.status(400).json({
                success: false,
                message: "Booking ID and seat number are required"
            });
        }

        const result = await executeStoredProcedure('sp_UpdateSeat', [
            { name: 'BookingID', type: sql.Int, value: bookingID },
            { name: 'SeatNumber', type: sql.VarChar(10), value: seatNumber }
        ]);

        if (result.output && result.output.RowsAffected === 0) {
            return res.status(400).json({
                success: false,
                message: "Seat update failed. Seat may be taken or booking cannot be modified."
            });
        }

        console.log("✅ Seat updated successfully");
        res.json({
            success: true,
            message: `Seat ${seatNumber} has been successfully reserved`
        });

    } catch (error) {
        console.error("❌ Seat update error:", error.message);

        if (error.message && error.message.includes('Seat is already taken')) {
            res.status(400).json({
                success: false,
                message: "This seat is already taken for this flight"
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to update seat: " + error.message
            });
        }
    }
});

// 8. Admin Login
app.post("/admin-login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await executeStoredProcedure('sp_AdminLogin', [
            { name: 'Username', type: sql.VarChar, value: username },
            { name: 'AdminPassword', type: sql.VarChar, value: password }
        ]);

        if (result.recordset.length === 0) {
            return res.json({ message: "Invalid admin credentials" });
        }

        res.json({ message: "Admin login successful" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Admin login failed" });
    }
});

// 9. Get Admin Notifications
// Line ~260: Get Admin Notifications - NO MAPPING
app.get("/admin/notifications", async (req, res) => {
    try {
        const result = await executeStoredProcedure('sp_GetAdminNotifications');
        // Direct return - no mapping
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
});

// 10. Get All Users (Admin)
app.get("/admin/users", async (req, res) => {
    try {
        const result = await executeStoredProcedure('sp_GetAllUsers');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

// 11. Search Users (Admin)
app.get("/admin/users/search", async (req, res) => {
    try {
        const { query } = req.query;
        const result = await executeStoredProcedure('sp_SearchUsers', [
            { name: 'SearchQuery', type: sql.VarChar, value: query }
        ]);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Search failed" });
    }
});

// 12. Add User (Admin)
app.post("/admin/users", async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                message: "First name, last name, email, and password are required"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await executeStoredProcedure('sp_AddUser', [
            { name: 'FirstName', type: sql.VarChar, value: firstName },
            { name: 'LastName', type: sql.VarChar, value: lastName },
            { name: 'Email', type: sql.VarChar, value: email },
            { name: 'Password', type: sql.VarChar, value: hashedPassword }
        ]);

        // Add notification
        await executeStoredProcedure('sp_AddAdminNotification', [
            { name: 'Message', type: sql.VarChar, value: `New user added: ${firstName} ${lastName} (${email})` },
            { name: 'Type', type: sql.VarChar, value: 'User' }
        ]);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error(err);

        if (err.message && err.message.includes('Email already exists')) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        res.status(500).json({ message: "Failed to add user" });
    }
});

// 13. Update User (Admin)
app.put("/admin/users/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const { firstName, lastName, email, status } = req.body;

        const result = await executeStoredProcedure('sp_UpdateUser', [
            { name: 'UserID', type: sql.Int, value: userId },
            { name: 'FirstName', type: sql.VarChar, value: firstName },
            { name: 'LastName', type: sql.VarChar, value: lastName },
            { name: 'Email', type: sql.VarChar, value: email },
            { name: 'Status', type: sql.VarChar, value: status || 'active' }
        ]);

        if (result.output && result.output.RowsAffected === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // Add notification
        await executeStoredProcedure('sp_AddAdminNotification', [
            { name: 'Message', type: sql.VarChar, value: `User updated: ${firstName} ${lastName} (${email})` },
            { name: 'Type', type: sql.VarChar, value: 'User' }
        ]);

        // Fetch updated user
        const userResult = await executeStoredProcedure('sp_SearchUsers', [
            { name: 'SearchQuery', type: sql.VarChar, value: email }
        ]);

        res.json(userResult.recordset[0] || {});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update user" });
    }
});

// 14. Delete User (Admin)
app.delete("/admin/users/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        // Get user details first
        const request = new sql.Request();
        request.input('userId', sql.Int, userId);
        const userResult = await request.query(`
            SELECT FirstName, LastName, Email FROM Users WHERE UserID = @userId
        `);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const result = await executeStoredProcedure('sp_DeleteUser', [
            { name: 'UserID', type: sql.Int, value: userId }
        ]);

        if (result.output && result.output.RowsAffected === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userResult.recordset[0];
        await executeStoredProcedure('sp_AddAdminNotification', [
            { name: 'Message', type: sql.VarChar, value: `User deleted: ${user.FirstName} ${user.LastName} (${user.Email})` },
            { name: 'Type', type: sql.VarChar, value: 'User' }
        ]);

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete user" });
    }
});

// 15. Get All Flights (Admin)
app.get("/admin/flights", async (req, res) => {
    try {
        const result = await executeStoredProcedure('sp_AdminGetFlights');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch flights" });
    }
});

// 16. Add Flight (Admin)
app.post("/admin/flights", async (req, res) => {
    try {
        const {
            flightNumber,
            departureCity,
            destinationCity,
            departureDate,
            departureTime,
            arrivalTime,
            price
        } = req.body;

        if (!flightNumber || !departureCity || !destinationCity || !departureDate || !departureTime || !arrivalTime || !price) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (price <= 0) {
            return res.status(400).json({
                message: "Price must be greater than 0"
            });
        }

        if (departureTime >= arrivalTime) {
            return res.status(400).json({
                message: "Arrival time must be after departure time"
            });
        }

        const result = await executeStoredProcedure('sp_AddFlight', [
            { name: 'FlightNumber', type: sql.VarChar, value: flightNumber },
            { name: 'DepartureCity', type: sql.VarChar, value: departureCity },
            { name: 'DestinationCity', type: sql.VarChar, value: destinationCity },
            { name: 'DepartureDate', type: sql.Date, value: departureDate },
            { name: 'DepartureTime', type: sql.VarChar, value: departureTime },
            { name: 'ArrivalTime', type: sql.VarChar, value: arrivalTime },
            { name: 'Price', type: sql.Int, value: price }
        ]);

        await executeStoredProcedure('sp_AddAdminNotification', [
            { name: 'Message', type: sql.VarChar, value: `New flight added: ${flightNumber} (${departureCity} → ${destinationCity})` },
            { name: 'Type', type: sql.VarChar, value: 'Flight' }
        ]);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to add flight" });
    }
});

// 17. Update Flight (Admin)
app.put("/admin/flights/:id", async (req, res) => {
    try {
        const flightId = req.params.id;
        const {
            flightNumber,
            departureCity,
            destinationCity,
            departureDate,
            departureTime,
            arrivalTime,
            price
        } = req.body;

        if (!flightNumber || !departureCity || !destinationCity || !departureDate || !departureTime || !arrivalTime || !price) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (price <= 0) {
            return res.status(400).json({
                message: "Price must be greater than 0"
            });
        }

        if (departureTime >= arrivalTime) {
            return res.status(400).json({
                message: "Arrival time must be after departure time"
            });
        }

        const result = await executeStoredProcedure('sp_UpdateFlight', [
            { name: 'FlightID', type: sql.Int, value: flightId },
            { name: 'FlightNumber', type: sql.VarChar, value: flightNumber },
            { name: 'DepartureCity', type: sql.VarChar, value: departureCity },
            { name: 'DestinationCity', type: sql.VarChar, value: destinationCity },
            { name: 'DepartureDate', type: sql.Date, value: departureDate },
            { name: 'DepartureTime', type: sql.VarChar, value: departureTime },
            { name: 'ArrivalTime', type: sql.VarChar, value: arrivalTime },
            { name: 'Price', type: sql.Int, value: price }
        ]);

        if (result.output && result.output.RowsAffected === 0) {
            return res.status(404).json({ message: "Flight not found" });
        }

        await executeStoredProcedure('sp_AddAdminNotification', [
            { name: 'Message', type: sql.VarChar, value: `Flight updated: ${flightNumber} (${departureCity} → ${destinationCity})` },
            { name: 'Type', type: sql.VarChar, value: 'Flight' }
        ]);

        res.json({
            success: true,
            message: "Flight updated successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to update flight"
        });
    }
});

// 18. Delete Flight (Admin)
app.delete("/admin/flights/:id", async (req, res) => {
    try {
        const flightId = req.params.id;

        // Get flight details first
        const request = new sql.Request();
        request.input('flightId', sql.Int, flightId);
        const flightResult = await request.query(`
            SELECT FlightNumber, DepartureCity, DestinationCity 
            FROM Flights WHERE FlightID = @flightId
        `);

        if (flightResult.recordset.length === 0) {
            return res.status(404).json({ message: "Flight not found" });
        }

        // Check for bookings
        const bookingCheck = new sql.Request();
        bookingCheck.input('flightId', sql.Int, flightId);
        const bookings = await bookingCheck.query(`
            SELECT COUNT(*) as bookingCount FROM Bookings WHERE FlightID = @flightId
        `);

        if (bookings.recordset[0].bookingCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete flight with existing bookings"
            });
        }

        const result = await executeStoredProcedure('sp_DeleteFlight', [
            { name: 'FlightID', type: sql.Int, value: flightId }
        ]);

        if (result.output && result.output.RowsAffected === 0) {
            return res.status(404).json({ message: "Flight not found" });
        }

        const flight = flightResult.recordset[0];
        await executeStoredProcedure('sp_AddAdminNotification', [
            { name: 'Message', type: sql.VarChar, value: `Flight deleted: ${flight.FlightNumber} (${flight.DepartureCity} → ${flight.DestinationCity})` },
            { name: 'Type', type: sql.VarChar, value: 'Flight' }
        ]);

        res.json({
            success: true,
            message: "Flight deleted successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to delete flight"
        });
    }
});

// 19. Confirm Payment
app.post("/confirm-payment", async (req, res) => {
    try {
        const { bookingID, paymentMethod, amount } = req.body;

        console.log("📋 Payment confirmation:", { bookingID, paymentMethod, amount });

        if (!bookingID || !paymentMethod || !amount) {
            return res.status(400).json({
                success: false,
                message: "Missing required payment information"
            });
        }

        const result = await executeStoredProcedure('sp_ConfirmPayment', [
            { name: 'BookingID', type: sql.Int, value: bookingID },
            { name: 'PaymentMethod', type: sql.VarChar(50), value: paymentMethod },
            { name: 'Amount', type: sql.Decimal(10, 2), value: amount }
        ], [
            { name: 'TransactionID', type: sql.VarChar(100) }
        ]);

        console.log("✅ Payment confirmed successfully");
        console.log("Transaction ID:", result.output.TransactionID);

        res.json({
            success: true,
            message: "Payment confirmed successfully",
            booking: result.recordset[0],
            transactionID: result.output.TransactionID
        });

    } catch (error) {
        console.error("❌ Payment confirmation error:", error.message);
        res.status(500).json({
            success: false,
            message: "Payment confirmation failed: " + error.message
        });
    }
});

// 20. Get Booking Details
app.get("/booking-details/:bookingID", async (req, res) => {
    try {
        const bookingID = req.params.bookingID;

        const result = await executeStoredProcedure('sp_GetBookingDetails', [
            { name: 'BookingID', type: sql.Int, value: bookingID }
        ]);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.json({
            success: true,
            booking: result.recordset[0]
        });

    } catch (error) {
        console.error("Error fetching booking details:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch booking details"
        });
    }
});

// Keep existing APIs that don't need stored procedures
app.get("/api/users/:email", async (req, res) => {
    // Keep as is or convert to stored procedure if needed
});

app.get("/api/bookings", async (req, res) => {
    // Keep as is (returns static data)
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
});