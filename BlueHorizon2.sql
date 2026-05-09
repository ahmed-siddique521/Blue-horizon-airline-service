create database BlueHorizon2;
use BlueHorizon2;


DROP Table Users
-- Users table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,  
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Passwordhash VARCHAR(255) NOT NULL,
    UserStatus VARCHAR(20) DEFAULT 'active',  
    CreatedAt DATETIME DEFAULT GETDATE()
);

select * from Users;

   

-- Flights table
CREATE TABLE Flights (
    FlightID INT IDENTITY PRIMARY KEY,
    FlightNumber VARCHAR(20),
    DepartureCity VARCHAR(50),
    DestinationCity VARCHAR(50),
    DepartureDate DATE,
    DepartureTime VARCHAR(10),
    ArrivalTime VARCHAR(10),
    Price INT,
    AvailableSeats INT DEFAULT 50
);


INSERT INTO Flights VALUES
('BH101', 'Karachi', 'Lahore', '2025-02-10', '07:00', '08:30', 16500, 50),
('BH102', 'Karachi', 'Lahore', '2025-02-10', '10:00', '11:30', 18000, 50);


select * from Flights

-- Bookings table
CREATE TABLE Bookings (
    BookingID INT IDENTITY PRIMARY KEY,
    UserID INT,
    FlightID INT,
    SeatNumber VARCHAR(5),
    PaymentStatus VARCHAR(20) DEFAULT 'Pending',
    CreatedAt DATETIME DEFAULT GETDATE()
);

select * from Bookings

-- Passengers table
CREATE TABLE Passengers (
    PassengerID INT IDENTITY PRIMARY KEY,
    BookingID INT,
    FullName VARCHAR(100),
    CNIC VARCHAR(15),
    Gender VARCHAR(10),
    DOB DATE,
    Contact VARCHAR(20)
);

select * from Passengers

-- Payments table
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT FOREIGN KEY REFERENCES Bookings(BookingID),
    PaymentMethod VARCHAR(50),
    TransactionID VARCHAR(100),
    Amount DECIMAL(10, 2),
    PaymentDate DATETIME,
    PaymentStatus VARCHAR(20) DEFAULT 'Pending' 
);

DROP TABLE Payments;

select * from Payments

-- Admins table
CREATE TABLE Admins (
    AdminID INT IDENTITY PRIMARY KEY,
    Username VARCHAR(50) UNIQUE,
    AdminPassword VARCHAR(50) -- Change Password
);
DROP TABLE Admins;

SELECT * FROM Admins;

INSERT INTO Admins (Username, AdminPassword) VALUES ('admin', 'admin123');

-- Admin notifications table
CREATE TABLE AdminNotifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    NotificationMessage VARCHAR(255), 
    NotificationType VARCHAR(50),   
    IsNew BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

DROP TABLE AdminNotifications;
SELECT * FROM AdminNotifications;

-- ========== STORED PROCEDURES ==========

-- 1. User Registration (sp_RegisterUser)
CREATE PROCEDURE sp_RegisterUser
    @FirstName VARCHAR(50),
    @LastName VARCHAR(50),
    @Email VARCHAR(100),
    @PasswordHash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO Users (FirstName, LastName, Email, Passwordhash)
        OUTPUT INSERTED.UserID, INSERTED.FirstName, INSERTED.LastName, INSERTED.Email
        VALUES (@FirstName, @LastName, @Email, @PasswordHash);
    END TRY
    BEGIN CATCH
        IF ERROR_NUMBER() = 2627
            THROW 50001, 'Email already exists', 1;
        ELSE
            THROW;
    END CATCH
END
GO

-- 2. User Login (sp_LoginUser)
CREATE PROCEDURE sp_LoginUser
    @Email VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT UserID, Email, PasswordHash, FirstName, LastName 
    FROM Users 
    WHERE Email = @Email;
END
GO

-- 3. Search Flights (sp_SearchFlights)
CREATE PROCEDURE sp_SearchFlights
    @DepartureCity VARCHAR(50),
    @DestinationCity VARCHAR(50),
    @DepartureDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        FlightID,
        FlightNumber,
        DepartureCity,
        DestinationCity,
        CONVERT(VARCHAR(10), DepartureDate, 120) as DepartureDate,
        DepartureTime,
        ArrivalTime,
        Price,
        AvailableSeats
    FROM Flights
    WHERE DepartureCity = @DepartureCity
      AND DestinationCity = @DestinationCity
      AND DepartureDate = @DepartureDate;
END
GO

-- 4. Get All Flights (sp_GetAllFlights)
CREATE PROCEDURE sp_GetAllFlights
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        FlightID,
        FlightNumber,
        DepartureCity,
        DestinationCity,
        CONVERT(VARCHAR(10), DepartureDate, 120) as DepartureDate,
        DepartureTime,
        ArrivalTime,
        Price,
        AvailableSeats
    FROM Flights
    ORDER BY DepartureDate ASC, DepartureTime ASC;
END
GO

-- 5. Book Flight (sp_BookFlight)
CREATE PROCEDURE sp_BookFlight
    @UserID INT,
    @FlightID INT,
    @Seat VARCHAR(10),
    @FullName NVARCHAR(100),
    @CNIC VARCHAR(15),
    @Gender VARCHAR(10),
    @DOB DATE,
    @Contact VARCHAR(20),
    @BookingID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        INSERT INTO Bookings (UserID, FlightID, SeatNumber, PaymentStatus, CreatedAt)
        OUTPUT INSERTED.BookingID
        VALUES (@UserID, @FlightID, @Seat, 'Pending', GETDATE());
        
        SET @BookingID = SCOPE_IDENTITY();
        
        INSERT INTO Passengers (BookingID, FullName, CNIC, Gender, DOB, Contact)
        VALUES (@BookingID, @FullName, @CNIC, @Gender, @DOB, @Contact);
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- 6. Get Booking History (sp_GetBookingHistory)
CREATE PROCEDURE sp_GetBookingHistory
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        B.BookingID,
        B.UserID,
        B.FlightID,
        B.SeatNumber,
        B.CreatedAt,
        B.PaymentStatus,
        F.FlightNumber,
        F.DepartureCity,
        F.DestinationCity,
        CONVERT(VARCHAR(10), F.DepartureDate, 120) as DepartureDate,
        F.DepartureTime,
        F.ArrivalTime,
        F.Price,
        P.FullName,
        P.CNIC,
        P.Contact
    FROM Bookings B
    JOIN Flights F ON B.FlightID = F.FlightID
    JOIN Passengers P ON B.BookingID = P.BookingID
    WHERE B.UserID = @UserID
    ORDER BY B.CreatedAt DESC;
END
GO

-- 7. Update Seat (sp_UpdateSeat)
CREATE PROCEDURE sp_UpdateSeat
    @BookingID INT,
    @SeatNumber VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (
            SELECT 1 FROM Bookings B
            JOIN Flights F ON B.FlightID = F.FlightID
            WHERE B.SeatNumber = @SeatNumber 
            AND B.BookingID != @BookingID
            AND F.FlightID = (SELECT FlightID FROM Bookings WHERE BookingID = @BookingID)
        )
        BEGIN
            THROW 50002, 'Seat is already taken', 1;
        END
        
        UPDATE Bookings 
        SET SeatNumber = @SeatNumber 
        WHERE BookingID = @BookingID
          AND (PaymentStatus IS NULL OR PaymentStatus = 'Pending');
        
        SELECT @@ROWCOUNT as RowsAffected;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- 8. Admin Login (sp_AdminLogin)
CREATE PROCEDURE sp_AdminLogin
    @Username VARCHAR(50),
    @AdminPassword VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Admins 
    WHERE Username = @Username AND AdminPassword = @AdminPassword;
END
GO

-- 9. Get Admin Notifications (sp_GetAdminNotifications)
CREATE PROCEDURE sp_GetAdminNotifications
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        NotificationID,
        NotificationMessage,
        NotificationType,
        IsNew,
        CreatedAt
    FROM AdminNotifications
    ORDER BY CreatedAt DESC;
END
GO

-- 10. Get All Users (Admin) (sp_GetAllUsers)
CREATE PROCEDURE sp_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        UserID, 
        FirstName, 
        LastName, 
        Email, 
        UserStatus AS Status,
        CreatedAt,
        CONCAT(FirstName, ' ', LastName) as FullName
    FROM Users
    ORDER BY CreatedAt DESC;
END
GO

-- 11. Search Users (Admin) (sp_SearchUsers)
CREATE PROCEDURE sp_SearchUsers
    @SearchQuery VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        UserID, 
        FirstName, 
        LastName, 
        Email, 
        UserStatus AS Status,
        CreatedAt,
        CONCAT(FirstName, ' ', LastName) as FullName
    FROM Users
    WHERE (FirstName LIKE '%' + @SearchQuery + '%'
           OR LastName LIKE '%' + @SearchQuery + '%'
           OR Email LIKE '%' + @SearchQuery + '%')
    ORDER BY CreatedAt DESC;
END
GO

-- 12. Add User (Admin) (sp_AddUser)
CREATE PROCEDURE sp_AddUser
    @FirstName VARCHAR(50),
    @LastName VARCHAR(50),
    @Email VARCHAR(100),
    @Password VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO Users (FirstName, LastName, Email, Passwordhash, UserStatus)
        OUTPUT INSERTED.UserID, INSERTED.FirstName, INSERTED.LastName, 
               INSERTED.Email, INSERTED.UserStatus AS Status, INSERTED.CreatedAt,
               CONCAT(@FirstName, ' ', @LastName) as FullName
        VALUES (@FirstName, @LastName, @Email, @Password, 'active');
    END TRY
    BEGIN CATCH
        IF ERROR_NUMBER() = 2627
            THROW 50001, 'Email already exists', 1;
        ELSE
            THROW;
    END CATCH
END
GO

-- 13. Update User (Admin) (sp_UpdateUser)

CREATE PROCEDURE sp_UpdateUser
    @UserID INT,
    @FirstName VARCHAR(50),
    @LastName VARCHAR(50),
    @Email VARCHAR(100),
    @Status VARCHAR(20) 
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users 
    SET FirstName = @FirstName, 
        LastName = @LastName, 
        Email = @Email, 
        UserStatus = @Status  
    WHERE UserID = @UserID;
    
    SELECT @@ROWCOUNT as RowsAffected;
END
GO

-- 14. Delete User (Admin) (sp_DeleteUser)
CREATE PROCEDURE sp_DeleteUser
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Users WHERE UserID = @UserID;
    
    SELECT @@ROWCOUNT as RowsAffected;
END
GO

-- 15. Get All Flights (Admin) (sp_AdminGetFlights)
CREATE PROCEDURE sp_AdminGetFlights
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        FlightID,
        FlightNumber,
        DepartureCity,
        DestinationCity,
        CONVERT(VARCHAR(10), DepartureDate, 120) as DepartureDate,
        DepartureTime,
        ArrivalTime,
        Price,
        AvailableSeats
    FROM Flights
    ORDER BY DepartureDate DESC, DepartureTime ASC;
END
GO

-- 16. Add Flight (Admin) (sp_AddFlight)
CREATE PROCEDURE sp_AddFlight
    @FlightNumber VARCHAR(20),
    @DepartureCity VARCHAR(50),
    @DestinationCity VARCHAR(50),
    @DepartureDate DATE,
    @DepartureTime VARCHAR(10),
    @ArrivalTime VARCHAR(10),
    @Price INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Flights (
        FlightNumber, 
        DepartureCity, 
        DestinationCity, 
        DepartureDate, 
        DepartureTime, 
        ArrivalTime, 
        Price
    )
    OUTPUT INSERTED.FlightID, INSERTED.FlightNumber, 
           INSERTED.DepartureCity, INSERTED.DestinationCity,
           CONVERT(VARCHAR(10), INSERTED.DepartureDate, 120) as DepartureDate,
           INSERTED.DepartureTime, INSERTED.ArrivalTime,
           INSERTED.Price
    VALUES (
        @FlightNumber, 
        @DepartureCity, 
        @DestinationCity, 
        @DepartureDate, 
        @DepartureTime, 
        @ArrivalTime, 
        @Price
    );
END
GO

-- 17. Update Flight (Admin) (sp_UpdateFlight)
CREATE PROCEDURE sp_UpdateFlight
    @FlightID INT,
    @FlightNumber VARCHAR(20),
    @DepartureCity VARCHAR(50),
    @DestinationCity VARCHAR(50),
    @DepartureDate DATE,
    @DepartureTime VARCHAR(10),
    @ArrivalTime VARCHAR(10),
    @Price INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Flights 
    SET FlightNumber = @FlightNumber, 
        DepartureCity = @DepartureCity, 
        DestinationCity = @DestinationCity, 
        DepartureDate = @DepartureDate, 
        DepartureTime = @DepartureTime, 
        ArrivalTime = @ArrivalTime, 
        Price = @Price
    WHERE FlightID = @FlightID;
    
    SELECT @@ROWCOUNT as RowsAffected;
END
GO

-- 18. Delete Flight (Admin) (sp_DeleteFlight)
CREATE PROCEDURE sp_DeleteFlight
    @FlightID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Flights WHERE FlightID = @FlightID;
    
    SELECT @@ROWCOUNT as RowsAffected;
END
GO

-- 19. Confirm Payment (sp_ConfirmPayment)
CREATE PROCEDURE sp_ConfirmPayment
    @BookingID INT,
    @PaymentMethod VARCHAR(50),
    @Amount DECIMAL(10, 2),
    @TransactionID VARCHAR(100) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        SET @TransactionID = 'TXN-' + CAST(DATEADD(ms, DATEDIFF(ms, GETDATE(), GETUTCDATE()), GETDATE()) AS VARCHAR(50)) + '-' + CAST(ABS(CHECKSUM(NEWID())) AS VARCHAR(10));
        
        UPDATE Bookings 
        SET PaymentStatus = 'Paid'
        WHERE BookingID = @BookingID;
        
        INSERT INTO Payments (BookingID, PaymentMethod, TransactionID, Amount, PaymentDate, PaymentStatus)
        VALUES (@BookingID, @PaymentMethod, @TransactionID, @Amount, GETDATE(), 'Success');
        
        SELECT 
            b.BookingID,
            b.PaymentStatus,
            f.FlightNumber,
            f.DepartureCity,
            f.DestinationCity,
            CONVERT(VARCHAR(10), f.DepartureDate, 120) as DepartureDate,
            f.Price,
            b.SeatNumber,
            p.FullName as PassengerName,
            p.CNIC as PassengerCNIC,
            p.Contact as PassengerContact,
            @TransactionID as TransactionID,
            @PaymentMethod as PaymentMethod,
            @Amount as Amount,
            GETDATE() as PaymentDate
        FROM Bookings b
        JOIN Flights f ON b.FlightID = f.FlightID
        JOIN Passengers p ON b.BookingID = p.BookingID
        WHERE b.BookingID = @BookingID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- 20. Get Booking Details (sp_GetBookingDetails)
CREATE PROCEDURE sp_GetBookingDetails
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        b.BookingID,
        b.PaymentStatus,
        b.SeatNumber,
        b.CreatedAt,
        f.FlightNumber,
        f.DepartureCity,
        f.DestinationCity,
        f.DepartureDate,
        f.Price,
        p.FullName as PassengerName,
        p.CNIC as PassengerCNIC,
        p.Gender as PassengerGender,
        p.DOB as PassengerDOB,
        p.Contact as PassengerContact,
        pay.PaymentMethod,
        pay.TransactionID,
        pay.Amount,
        pay.PaymentDate,
        pay.PaymentStatus as PaymentTransactionStatus
    FROM Bookings b
    JOIN Flights f ON b.FlightID = f.FlightID
    JOIN Passengers p ON b.BookingID = p.BookingID
    LEFT JOIN Payments pay ON b.BookingID = pay.BookingID
    WHERE b.BookingID = @BookingID;
END
GO

-- 21. Add Admin Notification (sp_AddAdminNotification) 


CREATE PROCEDURE sp_AddAdminNotification
    @Message VARCHAR(255),    
    @Type VARCHAR(50)         
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO AdminNotifications (NotificationMessage, NotificationType, IsNew)
    VALUES (@Message, @Type, 1);
END
GO

-- 22. Mark Notification as Read (sp_MarkNotificationAsRead)
CREATE PROCEDURE sp_MarkNotificationAsRead
    @NotificationID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE AdminNotifications 
    SET IsNew = 0 
    WHERE NotificationID = @NotificationID;
END
GO

