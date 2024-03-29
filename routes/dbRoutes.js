// include my model for this application
var mongoModel = require("../models/mongoModel.js");

// Define the routes for this controller
exports.init = function(app) {
  app.get('/', homepage); // The homepage page
  app.get('/home', homepage); // Can be accessed by another url
  app.get('/logout', logout); // Log out user and end session
  app.get('/favorites', favorites); // The favorites page
  app.get('/upcoming', upcoming); //The request song page

  //Retrieve all users for leaderboard
  app.get('/allArtists', getAllArtists);; //CRUD Retrieve ALL
    
  // The collection parameter maps directly to the mongoDB collection
  app.put('/:collection', doCreate); // CRUD Create
  app.get('/:collection', doRetrieve); // CRUD Retrieve for single user
  app.post('/:collection', doUpdate); // CRUD Update
  app.delete('/:collection', doDelete); // CRUD Delete 

}

//
//
// PAGE ROUTING 
//
//

// Home page: if user is not logged in, have them authenticate
// Otherwise, render homepage
homepage = function(req, res) {
  console.log(req.session.user);
  if ( req.session.user == undefined) {
    res.render('homepage', { username: false } );
  }
  else {
    res.render('homepage', { username: req.session.user } );
  }
};

// logout & end session, redirecting them to homepage
logout = function(req, res) {
  req.session.reset();
  res.redirect('/home');
}

// About page
about = function(req, res) {
  if ( req.session.user == undefined) {
    res.render('homepage', { username: false } );
  }
  else {
    res.render('homepage', { username: req.session.user } );
  }
};

// Favorites page that shows favorite artists
favorites = function(req, res) {
  if ( req.session.user == undefined) {
    res.render('homepage', { username: false } );
  }
  else {
    res.render('favorites', { username: req.session.user } );
  }
};

// Path for user query upcoming events
upcoming = function(req, res) {
  if ( req.session.user == undefined) {
    res.render('homepage', { username: false } );
  }
  else {
    res.render('upcoming', { username: req.session.user } );
  }
};

//
//
// APP CRUD FUNCTIONALITY
//
//

/********** CRUD Create *******************************************************
 * Take the object defined in the request body and do the Create
 * operation in mongoModel.
 */ 

getAllArtists = function(request, response) {
    var message = 'All Artists';
    response.render('allArtists', {'title': message, 
                                    'allArtistsData':Artists.Collection});
}

doCreate = function(req, res){
  /*
   * First check if req.body has something to create.
   * Object.keys(req.body).length is a quick way to count the number of
   * properties in the req.body object.
   */
  if (Object.keys(req.body).length == 0) {
    res.render('message', {title: 'Mongo Demo', obj: "No create message body found"});
    return;
  }
  /*
   * Call the model Create with:
   *  - The collection to do the Create into
   *  - The object to add to the model, received as the body of the request
   *  - An anonymous callback function to be called by the model once the
   *    create has been successful.  The insertion of the object into the 
   *    database is asynchronous, so the model will not be able to "return"
   *    (as in a function return) confirmation that the create was successful.
   *    Consequently, so that this controller can be alerted with the create
   *    is successful, a callback function is provided for the model to 
   *    call in the future whenever the create has completed.
   */
  if (req.params.collection == "concerts") {
    /* add current user in session as attribute to document */
    req.body.username = req.session.user;
  }
  mongoModel.create ( req.params.collection, 
                      req.body,
                      function(result) {
                        // result equal to true means create was successful
                        var success = (result ? "Create successful" : "Create unsuccessful");
                        res.render('message', {title: 'Mongo Demo', obj: success});
                      });
}


/********** CRUD Retrieve (or Read) *******************************************
 * Take the object defined in the query string and do the Retrieve
 * operation in mongoModel.  (Note: The mongoModel method was called "find"
 * when we discussed this in class but I changed it to "retrieve" to be
 * consistent with CRUD operations.)
 */ 

doRetrieve = function(req, res){
  /*
   * Call the model Retrieve with:
   *  - The collection to Retrieve from
   *  - The object to lookup in the model, from the request query string
   *  - As discussed above, an anonymous callback function to be called by the
   *    model once the retrieve has been successful.
   * modelData is an array of objects returned as a result of the Retrieve
   */
   console.log(req.params.collection);
  if (req.params.collection == "artists") {
    /* add current user in session as attribute to search for in document */
    req.query.username = req.session.user;
  }
  mongoModel.retrieve(
    req.params.collection, 
    req.query,
    function(modelData) {
      if (modelData.length) {
        if (req.params.collection == "users") {
          /* Create session with username when user logs in */
          req.session.user = req.query.username;
          res.render('user_results',{obj: modelData});
        }
        else if (req.params.collection == "artists") {
          console.log("results");
          res.render('results', {title: "This is title", obj: modelData});
        }
      } 
      else {
        var message = "No search results found. Please try again!";
        res.render('message', {obj: message});
      }
  });
  
}

/********** CRUD Update *******************************************************
 * Take the MongoDB update object defined in the request body and do the
 * update.  (I understand this is bad form for it assumes that the client
 * has knowledge of the structure of the database behind the model.  I did
 * this to keep the example very general for any collection of any documents.
 * You should not do this in your project for you know exactly what collection
 * you are using and the content of the documents you are storing to them.)
 */ 
doUpdate = function(req, res){
  // filter on user and name of item, which cannot be updated
  var filter = {"username": req.session.user, "name": req.body.filter};
  // if there no update operation defined, render an error page.
  if (!req.body.update) {
    res.render('message', {title: 'Mongo Demo', obj: "No update operation defined"});
    return;
  }
  var update = {"$set":{"quantity":req.body.update}};
  /*
   * Call the model Update with:
   *  - The collection to update
   *  - The filter to select what documents to update
   *  - The update operation
   *    E.g. the request body string:
   *      find={"name":"pear"}&update={"$set":{"leaves":"green"}}
   *      becomes filter={"name":"pear"}
   *      and update={"$set":{"leaves":"green"}}
   *  - As discussed above, an anonymous callback function to be called by the
   *    model once the update has been successful.
   */
  mongoModel.update(  req.params.collection, filter, update,
		                  function(status) {
              				  res.render('message',{title: 'Mongo Demo', obj: status});
		                  });
}

doDelete = function(req, res){
  /*
   * Call the model Delete with:
   *  - The collection to Delete from
   *  - The object to delete in the model, from the request query string
   *  - As discussed above, an anonymous callback function to be called by the
   *    model once the delete has been successful.
   * modelData is an array of objects returned as a result of the Retrieve
   */

  mongoModel.delete ( req.params.collection, 
                      req.body,
                      function(result) {
                        // result equal to true means delete was successful
                        var success = (result ? "Delete successful" : "Delete unsuccessful");
                        res.render('message', {title: 'Mongo Demo', obj: success});
                      });
}


