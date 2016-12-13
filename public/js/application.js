$(document).ready(function() {

//------------------------------SONGS FUNCTIONALITY-------------------------------------------
	
	// $('button').click(function() {
 //  		var id = $(this).id;
 //  		console.log(id);
	// });

	//Create functionality for songs
	$('#requestSong').submit(addSong);

	//show a user's songs when they are on the song page
	$.ajax({
			url: './songs',
			type: 'GET',
			success:function(result) {
				$('#mysongs').html(result);
			}
		});

	function addSong(event) {
		var genre = $('#genre').val();
		var lyrics = $('#lyrics').val();
		var tempo = $('input[type="radio"][name="speed"]:checked').val();
		var age = $('#age').val();
		var location = $('#location').val();
		var extras = $('#extras').val();
		var answer = null;
		$.ajax({
			url: './songs',
			type: 'PUT',
			data: { genre: genre, lyrics: lyrics, tempo: tempo, age: age, location: location, extras: extras, answer: answer },
			success: function(result) {
				$('#success').html(result);
			}
		});
	}

//-----------------------------USER LOGIN AND REGISTRATION CR FUNCTIONALITY----------------------------------------

	//CR functionality for users
	$('#login').submit(login_user); //read logged in user
	$('#register').submit(new_user); //create new user

	// //show leaderboard when user loads / is on the home page
	// $.ajax({
	// 		url: './allusers',
	// 		type: 'GET',
	// 		success:function(result) {
	// 			$('#leaderboard').html(result);
	// 		}
	// 	});

	function login_user(event) {
		var user_name = $('#login input')[0].value;
		var user_password = $('#login input')[1].value;
		$.ajax({
			url: './users',
			type: 'GET',
			data: { username: user_name, password: user_password },
			success: function(result) {
				if (result.length == 0) {
					$('#error').html("<p>Incorrect username or password. Please try again!</p>");
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

//------------------------------GAMEPLAY FUNCTIONALITY-------------------------------------------

	$('#next').on('click', gamePlay);
	$('#answerSong').submit(answerSong);

	function gamePlay() {
		$('#game').html('');
		var game_display = '<center>'
		$('#game').append(game_display);
		$.ajax({
			url: './rand_song',
			type: 'GET',
			success: function(result) {
				$('#game').append(result);
			},
			error: function(response, status) {
				console.log(response);
				alert("Game currently not functioning. We are sorry for the inconvenience!");
			}
		});
	}

	function answerSong(event) {
		event.preventDefault();
		var song = $('#answerSong input')[0].value;
		var user = $('#hiddenuser input')[0].value;
		if (song == "") {
			gamePlay();
		}
		else {
			$.ajax({
				url: './answers',
				type: 'PUT',
				data: { requested_by: user, answer: song },
				success: function(result) {
					gamePlay();
					$('#name').val("");
				}
			});
		}
	}

//------------------------------ANSWERS FUNCTIONALITY-------------------------------------------
	
	//API Call: Search for recipes using 3 leftover ingredients submitted by users
	$('#upcoming').submit(getPerformerResults);

	//Perform GET recipe functions for finding recipe IDs, then SEARCH recipe function to get ingredients
	function getPerformerResults(event) {
		var performer_q = $('#upcoming input')[0].value;

		//clear search inputs
		$('#upcoming input')[0].value = "";
		console.log(performer_q);

		//below information received from API documentation
		//following example pattern of: http://api.yummly.com/v1/api/recipes?_app_id=YOUR_ID&_app_key=YOUR_APP_KEY
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
            		console.log(result.performers[0])
            		performer_id = result.performers[0].id;
            		searchPerformerEvents(performer_id);
            		// searchRecipes(result.matches); //calls function to search for recipes using result IDs
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
            		console.log(result.recommendations)
            		displayRecs(result.recommendations)
            		// searchRecipes(result.matches); //calls function to search for recipes using result IDs
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

	function displayRecs(recommendations) {
		var html = "<div class='row'>"
		$.each(recommendations, function() {
			concert = this;
			html+= "<div class='col-sm-6'><div class='card card-block'>";
			html+="<h3 class='card-title'>"+concert.event.title+"</h3><p class='card-text'>"+concert.event.datetime_local+"</p>";
			html+="<a href="+concert.event.url+" class='btn btn-primary'>Get Tickets</a>"
			html+="<input type='button' class='btn btn-primary' id='"+concert.event.id+"'>Interested!</input></div></div>"
		});
		html+="</div>"
		$('#upcoming_results').append(html);
		
	}

	$('input[type="button"]').on('click', saveEvent);

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