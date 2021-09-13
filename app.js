const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
require("dotenv").config()
const DATABASE_NAME = "flutter_bus_booking";
const CONNECTION_URL = process.env.CONNECTION_URL;
var app = Express();
const cors = require("cors");
const db = require("./config/mongoose.config");
const initial = require("./config/initial");

/**
 * Mongo sanitize to prevent noSql injection
 */
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

/**
 * Helmet to set http headers for routes thus prevent injection
 */
const helmet = require("helmet");
app.use(helmet());

/**
 * XSS clean to prevent cross site scripting
 */
const xss = require("xss-clean");
app.use(xss())

/**
 * Request rate limiting
 */
const expressRateLimit = require("express-rate-limit");
const limiter = expressRateLimit({
  windowMs: 10 * 60 * 1000, // 2 mins
  max: 5, // No of Requests
});
app.use(limiter);

/**
 * Prevent access of any hidden info if api is exposed
 */
const hpp = require("hpp");
const { validate, User } = require("./models/user");
const { authJwt } = require("./middleware/auth.middleware");
app.use(hpp());

app.use(cors());
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
var database, collection;

app.listen(process.env.PORT || 5000, () => {
  MongoClient.connect(CONNECTION_URL, (error, client) => {
    if (error) {
      throw error;
    }
    database = client.db(DATABASE_NAME);
    collection = database.collection("buses");
    console.log("Connected to `" + DATABASE_NAME + "` without Mongoose!");
  });
});

const myCollections = new Set(["buses", "ticket_booking", "services", "routes"]);
/*
** Posting data to a document in mongo db
*/
app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

app.get("/users", [authJwt.verifyToken, authJwt.isModerator, authJwt.isAdmin], (req, res) => {
  database.collection(`users`).find({}).toArray((error, result) => {
    if (error) {
      return res.status(500).send(error);
    }
    res.send(result);
  });
});

myCollections.forEach(element => {
  return app.post(`/${element}/create`, [authJwt.verifyToken, authJwt.isModerator, authJwt.isAdmin], (request, response) => {
    database.collection(`${element}`).insert(request.body, (error, result) => {
      if (error) {
        return response.status(500).send(error);
      }
      response.send(result.result);
    });
  });
})

/*
** Getting all docs inform off an array
*/
myCollections.forEach(element => {
  return app.get("/" + element, (req, res) => {
    database.collection(`${element}`).find({}).toArray((error, result) => {
      if (error) {
        return res.status(500).send(error);
      }
      res.send(result);
    });
  });
});


/*
** Getting a document by its id
*/
myCollections.forEach(element => {
  app.get("/" + element + "/:id", (request, response) => {
    database.collection(`${element}`).findOne({ "_id": new ObjectId(request.params.id) }, (error, result) => {
      if (error) {
        return response.status(500).send(error);
      }
      response.send(result);
    });
  });
});


/*
** Updating a document by its id
*/
myCollections.forEach(element => {
  app.patch("/" + element + "/update" + "/:id", [authJwt.verifyToken, authJwt.isModerator, authJwt.isAdmin], (request, response) => {
    database.collection(`${element}`).findOneAndUpdate({ "_id": new ObjectId(request.params.id) }, { $set: request.body }, (error, result) => {
      if (error) {
        return response.status(500).send(error);
      }
      response.send(result);
    });
  });
});

/*
** Deleting a document by its id
*/
myCollections.forEach(element => {
  app.post("/" + element + "/delete" + "/:id", [authJwt.verifyToken, authJwt.isModerator, authJwt.isAdmin], (request, response) => {
    database.collection(`${element}`).findOneAndDelete({ "_id": new ObjectId(request.params.id) }, (error, result) => {
      if (error) {
        return response.status(500).send(error);
      }
      response.send(result);
    });
  });
});

/**
 * The users' api
 * CONNECT TO MONGOOSE
 */
db.
  mongoose.connect(CONNECTION_URL)
  .then(() => {
    console.log('Now connected to MongoDB with Mongoose!');
    initial;
  })
  .catch(err => console.error('Something went wrong', err));

/**
 * User api route setup
 */
require('./routes/auth.routes')(app);