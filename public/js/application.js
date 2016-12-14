$(document).ready(function() {

//
//
// ARTISTS FUNCTIONALITY
//
//
	
//CRUD functionality for artist rankings
    $('#new').submit(createItem);
    $('#get_top').submit(getItem);
    $('#post').submit(updateItem);
    $('#delete').submit(deleteItem);

    function createItem(event) {
        var artist = document.getElementById('artist').value;
        var rank = document.getElementById('ranking').value;
        $.ajax({
            url: './artists',
            type: 'PUT',
            data: { artist: artist, rank: rank },
            success: function(result) {
                console.log("Added a favorite!");
                window.location.reload(true);
            }
        });
        event.preventDefault();
    }

    // Get all artists ajax call
    $("#get_all").submit(function(event) {
        $.get('/artist', function(html) {
            $('#all_results').html(html);
        });
        event.preventDefault();
    });

    function getItem(event) {
        console.log("get");
        var rank = 1;
        $.ajax({
            url: './artists',
            type: 'GET',
            data: { rank: rank },
            success: function(result) {
                console.log(result);
                $('#get_answer').html(result);
            },
            error: function(response, status) {
                $('#get_answer').html('1 : The Fray');
            }
        });
        event.preventDefault();
    }

    function updateItem(event) {
        console.log("update Item called");
        var item_name = $('#update input')[0].value;
        var quant = $('#update input')[1].value;
        $.ajax({
            url: './artists',
            type: 'POST',
            data: { filter: item_name, update: quant },
            success: function(result) {
                console.log("Successfully updated item in artist list!");
                window.location.reload(true);
            }
        });
        event.preventDefault();
    }

    function deleteItem() {
        //go through 'td' elements to find name of item in the row
        var item_name = $(this).closest('tr td').prev('td').prev('td').prev('td').text();
        //remove any line breaks from item_name
        item_name = item_name.replace(/\s{2,}/g, '');
        item_name = item_name.replace(/\t/g, '');
        item_name = item_name.replace(/(\r\n|\n|\r)/g,"");
        $.ajax({
            url: './artists',
            type: 'DELETE',
            data: { name: item_name },
            success:function(result){
                console.log("Successfully deleted item");
                window.location.reload(true);
            }
        });
        event.preventDefault();
    }

//
//
// USERS LOGIN/CREATE
//
//
	$('#login').submit(login_user); //read logged in user
	$('#register').submit(new_user); //create new user

	function login_user(event) {
		var user_name = $('#login input')[0].value;
		var user_password = $('#login input')[1].value;
		$.ajax({
			url: './users',
			type: 'GET',
			data: { username: user_name, password: user_password },
			success: function(result) {
				if (result.length == 0) {
					$('#error').html("<p>Incorrect username or password. Please try again.</p>");
                    window.location.reload(true);
				}
				console.log("Successfully found user!");
				console.log(user_name, user_password)
				window.location.reload(true);
			},
			error: function(response, status) {
				alert("Incorrect username or password. Please try again!");
			}
		});
		event.preventDefault();
	}

	function new_user(event) {
		var first_name = $('#register input')[0].value;
		var last_name = $('#register input')[1].value;
		var user_email = $('#register input')[2].value;
		var user_name = $('#register input')[3].value;
		var user_password = $('#register input')[4].value;
		$.ajax({
			url: './users',
			type: 'PUT',
			data: { firstname: first_name, lastname: last_name, email: user_email, 
				username: user_name, password: user_password },
			success: function(result) {
				$('#error').html("<p>Congrats! You've been added to our system. Enter your login information below to get started.</p>");
				console.log("Successfully added user to system!");
			}
		});
		event.preventDefault();
	}

//
//
// SEATGEEK API CALLS
//
//
	
	// Find the ID of a preferenced performer
	$('#upcoming').submit(getPerformerResults);
    $('#upcoming_geo').submit(getFromLocation);
    $('#favorite').submit(getFavResults);

	function getPerformerResults(event) {
		var performer_q = $('#upcoming input')[0].value;

		$('#upcoming input')[0].value = "";
		console.log(performer_q);

		// https://api.seatgeek.com/2/events?client_id=MYCLIENTID&client_secret=MYCLIENTSECRET
        // Query to find ID 
		try{
			$.ajax({ 
			url: 'https://api.seatgeek.com/2/performers', 
            type: 'GET',
            data: {
            	"q": performer_q,
            	"client_id": "NjQxNzM2MnwxNDgxNjQ2MjUx",
            	"client_secret": "yJIfLxYsZj1mkHwc1LD9wExA-X8HGGWGHOkoOZlo"
            }, 
            success: function(result) {
            	$('#upcoming_results').empty();
            	console.log('successfully called ajax for performer search!');
            	if (result.length == 0) {
            		$('#upcoming_results').append("<p>Sorry we could not find any performers with those keywords. Please try another search!</p>");
            	}
            	else {
                    // Get more event information if ID exists
            		performer_id = result.performers[0].id;
            		searchPerformerEvents(performer_id);
            	}
            },
            error: function(response){
                console.log(response);                
            },
            dataType: "json",
        	});
			return false;
		} catch (e) {console.log(e.description);}
	}

    // Search for the recommended events of performer
	function searchPerformerEvents(performer_id) {

		try{
			$.ajax({ 
			url: 'https://api.seatgeek.com/2/recommendations', 
            type: 'GET',
            data: {
            	"performers.id": performer_id,
            	"geoip": true,
            	"client_id": "NjQxNzM2MnwxNDgxNjQ2MjUx",
            	"client_secret": "yJIfLxYsZj1mkHwc1LD9wExA-X8HGGWGHOkoOZlo"
            }, 
            success: function(result) {
            	$('#upcoming_results').empty();
            	console.log('successfully called ajax for performer rec search!');
            	if (result.length == 0) {
            		$('#upcoming_results').append("<p>Sorry we could not find any performers with those keywords. Please try another search!</p>");
            	}
            	else {
                    // Display recommendations in HTML
            		displayRecs(result.recommendations)
            	}
            },
            error: function(response){
                console.log(response);                
            },
            dataType: "json",
        	});
			return false;
		} catch (e) {console.log(e.description);
		}
	}

    // Piece together HTML to display the information
	function displayRecs(recommendations) {
		var html = "<div class='row'>"
		$.each(recommendations, function() {
			concert = this;
			html+= "<div class='col-sm-6'><div class='card card-block'>";
			html+="<h3 class='card-title'>"+concert.event.title+"</h3><p class='card-text'>"+concert.event.datetime_local+"</p>";
			html+="<a href="+concert.event.url+" class='btn btn-primary'>Get Tickets</a></div></div>"
			// html+="<button class='btn btn-primary' id='"+concert.event.id+"'>Interested!</button></div></div>"
		});
		html+="</div>"
		$('#upcoming_results').append(html);
		
	}

    // API Call to get events according to your IP Address location
    function getFromLocation() {
        // Query to find events near you geographically
        try{
            $.ajax({ 
            url: 'https://api.seatgeek.com/2/events', 
            type: 'GET',
            data: {
                "geoip": true,
                "client_id": "NjQxNzM2MnwxNDgxNjQ2MjUx",
                "client_secret": "yJIfLxYsZj1mkHwc1LD9wExA-X8HGGWGHOkoOZlo"
            }, 
            success: function(result) {
                $('#upcoming_results').empty();
                console.log('successfully called ajax for performer search!');
                if (result.length == 0) {
                    $('#upcoming_results').append("<p>Sorry we could not find any performers with those keywords. Please try another search!</p>");
                }
                else {
                    // Get more event information if ID exists
                    console.log(result);
                    displayEvents(result.events)
;                }
            },
            error: function(response){
                console.log(response);                
            },
            dataType: "json",
            });
            return false;
        } catch (e) {console.log(e.description);}
    }


    // Display the events (not recommendations)
    function displayEvents(events) {
        var html = "<div class='row'>"
        $.each(events, function() {
            concert = this;

            html+= "<div class='col-sm-6'><div class='card card-block'>";
            html+="<h3 class='card-title'>"+concert.title+"</h3><p class='card-text'>"+concert.datetime_local+"</p><p class='card-text'>"+concert.venue.address+" "+concert.venue.city+"</p>";
            html+="<a href="+concert.url+" class='btn btn-primary'>Get Tickets</a></div></div>"
            // html+="<button class='btn btn-primary' id='"+concert.event.id+"'>Interested!</button></div></div>"
        });
        html+="</div>"
        $('#upcoming_results').append(html);
        
    }

    // Retrieve the favorite artist's recommended events on homepage
    function getFavResults(event) {
        var performer_q = 'The+Fray';

        console.log(performer_q);

        // https://api.seatgeek.com/2/events?client_id=MYCLIENTID&client_secret=MYCLIENTSECRET
        // Query to find ID 
        try{
            $.ajax({ 
            url: 'https://api.seatgeek.com/2/performers', 
            type: 'GET',
            data: {
                "q": performer_q,
                "client_id": "NjQxNzM2MnwxNDgxNjQ2MjUx",
                "client_secret": "yJIfLxYsZj1mkHwc1LD9wExA-X8HGGWGHOkoOZlo"
            }, 
            success: function(result) {
                $('#favorite_results').empty();
                console.log('successfully called ajax for performer search!');
                if (result.length == 0) {
                    $('#favorite_results').append("<p>Sorry we could not find any performers with those keywords. Please try another search!</p>");
                }
                else {
                    // Get more event information if ID exists
                    performer_id = result.performers[0].id;
                    searchFavPerformerEvents(performer_id);
                }
            },
            error: function(response){
                console.log(response);                
            },
            dataType: "json",
            });
            return false;
        } catch (e) {console.log(e.description);}
    }

    // Search for the recommended events of performer
    function searchFavPerformerEvents(performer_id) {

        try{
            $.ajax({ 
            url: 'https://api.seatgeek.com/2/recommendations', 
            type: 'GET',
            data: {
                "performers.id": performer_id,
                "geoip": true,
                "client_id": "NjQxNzM2MnwxNDgxNjQ2MjUx",
                "client_secret": "yJIfLxYsZj1mkHwc1LD9wExA-X8HGGWGHOkoOZlo"
            }, 
            success: function(result) {
                $('#favorite_results').empty();
                console.log('successfully called ajax for performer rec search!');
                if (result.length == 0) {
                    $('#favorite_results').append("<p>Sorry we could not find any performers with those keywords. Please try another search!</p>");
                }
                else {
                    // Display recommendations in HTML
                    displayFavEvents(result.recommendations)
                }
            },
            error: function(response){
                console.log(response);                
            },
            dataType: "json",
            });
            return false;
        } catch (e) {console.log(e.description);
        }
    }

    // Display the events (not recommendations)
    function displayFavEvents(events) {
        var html = "<div class='row'>"
        $.each(events, function() {
            concert = this;
            html+= "<div class='col-sm-6'><div class='card card-block'>";
            html+="<h3 class='card-title'>"+concert.event.title+"</h3><p class='card-text'>"+concert.event.datetime_local+"</p>";
            html+="<a href="+concert.event.url+" class='btn btn-primary'>Get Tickets</a></div></div>"
            // html+="<button class='btn btn-primary' id='"+concert.event.id+"'>Interested!</button></div></div>"
        });
        html+="</div>"

        $('#favorite_results').append(html);
    }

	function saveEvent(concert){
		console.log(concert);
		// var title = concert.event.title;
		// var datetime = concert.event.datetime_local;
		// var id = concert.event.id;
		// var performerList=[];
		// $.each(concert.event.performers, function() {
		// 	performer_info = this;
		// 	performers.append(performer_info.name);
		// });
		// console.log(performerList);
		// var performers = performerList;
		// var url = concert.event.url;
		// $.ajax({
		// 	url: './events',
		// 	type: 'PUT',
		// 	data: { title: title, date: datetime, id: id, performers: performers, url: url},
		// 	success: function(result) {
		// 		$('#'+id).html("Saved!");
		// 	}
		// });
	}

});