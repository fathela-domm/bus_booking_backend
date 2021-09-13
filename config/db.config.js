require("dotenv").config();
const DATABASE_NAME = "flutter_bus_booking";
const CONNECTION_URL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_USER_PASSWORD}@cluster0.ndq6e.mongodb.net/${DATABASE_NAME}?retryWrites=true&w=majority`;
module.exports = CONNECTION_URL;
