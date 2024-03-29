/*
 * This model uses the Node.js MongoDB Driver.
 * To install:  npm install mongodb --save
 */
var mongoClient = require('mongodb').MongoClient;
var bcrypt = require('bcryptjs'); //used for encrypting password

/*
 * This connection_string is for mongodb running locally.
 * Change nameOfMyDb to reflect the name you want for your database
 */
var connection_string = 'admin:admin@ds111788.mlab.com:11788/final_proj_db';
/*
 * If OPENSHIFT env variables have values, then this app must be running on 
 * OPENSHIFT.  Therefore use the connection info in the OPENSHIFT environment
 * variables to replace the connection_string.
 */
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  process.env.OPENSHIFT_APP_NAME;
}
// Global variable of the connected database
var mongoDB; 
console.log(connection_string);

// Use connect method to connect to the MongoDB server
mongoClient.connect('mongodb://'+connection_string, function(err, db) {
  if (err) doError(err);
  console.log("Connected to MongoDB server at: "+connection_string);
  mongoDB = db; // Make reference to db globally available.
});

/*
 * In the methods below, notice the use of a callback argument,
 * how that callback function is called, and the argument it is given.
 * Why do we need to be passed a callback function? Why can't the create, 
 * retrieve, and update functinons just return the data directly?
 * (This is what we discussed in class.)
 */

/********** CRUD Create -> Mongo insert ***************************************
 * @param {string} collection - The collection within the database
 * @param {object} data - The object to insert as a MongoDB document
 * @param {function} callback - Function to call upon insert completion
 *
 * See the API for more information on insert:
 * http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#insertOne
 */
exports.create = function(collection, data, callback) {
  console.log("4. Start insert function in mongoModel");
  if (collection == "users") {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(data.password, salt);
    data.password = hash;
  }
  // Do an asynchronous insert into the given collection
  mongoDB.collection(collection).insertOne(
    data,                     // the object to be inserted
    function(err, status) {   // callback upon completion
      if (err) doError(err);
      console.log("5. Done with mongo insert operation in mongoModel");
      // use the callback function supplied by the controller to pass
      // back true if successful else false
      var success = (status.result.n == 1 ? true : false);
      callback(success);
      console.log("6. Done with insert operation callback in mongoModel");
    });
  console.log("7. Done with insert function in mongoModel");
}

/********** CRUD Retrieve -> Mongo find ***************************************
 * @param {string} collection - The collection within the database
 * @param {object} query - The query object to search with
 * @param {function} callback - Function to call upon completion
 *
 * See the API for more information on find:
 * http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#find
 * and toArray:
 * http://mongodb.github.io/node-mongodb-native/2.0/api/Cursor.html#toArray
 */
exports.retrieve = function(collection, query, callback) {
  /*
   * The find sets up the cursor which you can iterate over and each
   * iteration does the actual retrieve. toArray asynchronously retrieves the
   * whole result set and returns an array.
   */
  if (collection == "users") {
    var user = query.username;
    var search = {};
    search.username = user;
    mongoDB.collection(collection).find(search).toArray(function(err, docs) {
      //If no users found, callback empty []
      if (docs.length == 0) {
        callback(docs);
      }
      //If users found (should only be 1 user since username is unique!), check if password matches hash password
      else {
        var password = docs[0].password;
        var match = bcrypt.compareSync(query.password, password);
        if (match == true) {
          callback(docs);
        }
        else {
          callback([]);
        }
      }
    });
  }
  else{
    mongoDB.collection(collection).find(query).toArray(function(err, docs) {
      if (err) doError(err);
      // docs are MongoDB documents, returned as an array of JavaScript objects
      // Use the callback provided by the controller to send back the docs.
      callback(docs);
    });
  }
}

/********** CRUD Update -> Mongo updateMany ***********************************
 * @param {string} collection - The collection within the database
 * @param {object} filter - The MongoDB filter
 * @param {object} update - The update operation to perform
 * @param {function} callback - Function to call upon completion
 *
 * See the API for more information on insert:
 * http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#updateMany
 */
exports.update = function(collection, filter, update, callback) {
  console.log("4. Start update function in mongoModel");
  mongoDB
    .collection(collection)     // The collection to update
    .updateMany(                // Use updateOne to only update 1 document
      filter,                   // Filter selects which documents to update
      update,                   // The update operation
      {upsert:true},            // If document not found, insert one with this update
                                // Set upsert false (default) to not do insert
      function(err, status){   // Callback upon error or success
        if (err) doError(err);
        console.log("5. Done with mongo update operation in mongoModel");
        callback('Modified '+ status.modifiedCount 
                 +' and added '+ status.upsertedCount+" documents");
        console.log("6. Done with update operation callback in mongoModel");
        });
    console.log("7. Done with update function in mongoModel");
}

/********** CRUD Delete -> Mongo deleteOne or deleteMany **********************
 * The delete model is left as an exercise for you to define.
 */

 exports.delete = function(collection, data, callback) {
  mongoDB.collection(collection).deleteOne(
    data,                     // the object to be deleted
    function(err, status) {   // callback upon completion
      if (err) doError(err);
      // use the callback function supplied by the controller to pass
      // back true if successful else false
      var success = (status.result.ok == 1 ? true : false);
      callback(success);
    });
}



var doError = function(e) {
        console.error("ERROR: " + e);
        throw new Error(e);
    }
