
# Carbon Footprint Tracker

Welcome to the Carbon Footprint Tracker application! This app allows users to track and monitor their carbon footprint through various activities and helps them make more environmentally friendly choices. The app is built with a server-side backend using Node.js and Express, and includes features such as data parsing, user authentication, and more.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

## Features

- **User Authentication:** Secure user login and registration using JWT and bcrypt.
- **Data Parsing:** CSV parsing to import data related to carbon emissions.
- **File Uploads:** Support for file uploads with `multer` and `express-formidable`.
- **Cross-Origin Resource Sharing (CORS):** Enabled to allow frontend applications to connect to the server.
- **Email Notifications:** Send email notifications to users using Nodemailer.
- **Environment Variable Management:** Manage sensitive data using `dotenv`.

## Getting Started

To get started with the Carbon Footprint Tracker app, follow the installation and usage instructions below.

## Installation

1. **Clone the repository:**
    ```shell
    git clone https://github.com/BazouneChaima/Carbon-Track-BE.git
    cd Carbon-Track-BE
    ```

2. **Install dependencies:**
    ```shell
    npm install
    ```

3. **Set up environment variables:**
    - Create a `.env` file in the root of the project directory.
    - Add necessary environment variables such as database connection strings, JWT secret, etc (You can check exemple.env).
  
4. **Start the server:**
    ```shell
    nodemon index.js
    ```

## Usage

- Once the server is running, you can interact with the application using your frontend app.
- Explore the available endpoints in your server code to understand the functionalities provided.

## Dependencies

The Carbon Footprint Tracker app depends on the following packages:

- `bcryptjs` for password hashing
- `concurrently` for running multiple scripts concurrently
- `cookie-parser` for handling HTTP cookies
- `cors` for Cross-Origin Resource Sharing
- `csv-parser` for parsing CSV files
- `dotenv` for loading environment variables from a `.env` file
- `ejs` for templating
- `express` for creating the server
- `express-async-handler` for async error handling in Express routes
- `express-formidable` for handling file uploads
- `jsonwebtoken` for handling JSON Web Tokens
- `mongoose` for MongoDB database connection
- `multer` for file uploading and handling
- `nodemailer` for sending emails
- `nodemon` for automatically restarting the server during development
- `socketio` to manage notification

## Contributing

Contributions are welcome! If you have any suggestions or improvements, feel free to submit a pull request.

## License

This project is licensed under the [ISC License](LICENSE).

## Acknowledgements

- Thanks to the open-source community and libraries used in this project.

## Contact

For any questions or feedback, please contact [Your Name](mailto:your.email@example.com).

---

I hope this README helps guide you in documenting your project. Modify and expand upon it as needed! Let me know if you need any more assistance.
