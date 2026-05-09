 Ahmed Siddique(s2024266013)
               
Project Setup Instructions:

This project is built on Node.js and requires specific dependencies to function properly. To run this application on your system, you will first need to have Node.js installed on your computer. Once Node.js is installed, navigate to the backend folder in your terminal and initialize the project using the command npm init -y. This will generate the necessary package.json file. Then, install the required packages—including express, cors, body-parser, bcrypt and mssql—by running npm install. After the installation is complete, you can start the server by executing node server.js. The frontend files are located in the frontend folder and can be served using any static file server or opened directly in a browser.


Project Description:

The Blue Horizon Airline Reservation System is a full-stack web-based application designed to simplify and digitize the airline ticket booking process. The system was developed using Node.js, Express.js, Microsoft SQL Server, HTML, CSS, and JavaScript, following a client-server architecture with RESTful APIs for communication between the frontend and backend.

The project provides a complete airline reservation workflow where users can create accounts, securely log in, search available flights, reserve seats, enter passenger information, make payments, and access booking history. The system also includes an admin management panel that allows administrators to manage users, flights, bookings, and notifications efficiently.

The backend is built with Express.js and uses asynchronous API handling with async/await for smooth server operations. SQL Server is used as the relational database management system, where data is managed through SQL queries, transactions, and stored procedures. Password security is implemented using bcrypt hashing to protect user credentials. Database transactions are used during flight booking to maintain consistency and prevent incomplete bookings.

Key Features:

* User registration and login authentication
* Secure password hashing using bcrypt
* Flight search functionality
* Flight booking and seat reservation system
* Passenger details management
* Payment confirmation system
* Booking history tracking
* Admin dashboard for flight and user management
* Notification management system
* SQL transaction handling for secure bookings
* RESTful API integration between frontend and backend

Technologies Used:

* Frontend: HTML, CSS, JavaScript
* Backend: Node.js, Express.js
* Database: Microsoft SQL Server
* Authentication & Security: bcrypt
* API Testing: Postman
* Version Control: Git & GitHub

This project demonstrates concepts of full-stack web development, database connectivity, API development, authentication, CRUD operations, SQL transactions, and server-side programming in a real-world airline reservation scenario.

