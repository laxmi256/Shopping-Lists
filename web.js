var express = require("express");
var mysql = require('mysql');
var app = express();
var crypto = require("crypto");
var fs = require("fs");
var session = require('express-session');
var bodyParser = require('body-parser');


app.use(express.logger());
app.use(express.static('static'));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


var connection = mysql.createConnection('mysql://bf1b404d468753:2fb48d2b@us-cdbr-iron-east-03.cleardb.net/heroku_0e7fc04c2dc2f91');
connection.connect();

var contents = fs.readFileSync("client_secrets.json");
var jsonContent = JSON.parse(contents);
var CLIENT_ID = jsonContent.web.client_id;
var APPLICATION_NAME = "Shopping Lists";


function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
			break;
		}
	}
}


var userloggedin = false;
var flashMsg = "";
var login_session = {provider: "", provider_id: "", user_id: "", username:"", email:"", picture:""};


function setUserLoginStatus(val) {
    userloggedin = val;
}


function getUserLoginStatus() {
    return userloggedin;
}


function setFlashMessage(val) {
	flashMsg = val;
}


function getFlashMessage() {
	return flashMsg;
}


app.get('/login',function(request, response) {
	var state = crypto.randomBytes(20).toString('hex');
	app.use(session({secret: state}));
	response.render('login.html', {currentuser:login_session, connection:connection});
});


app.get('/connect/', function (request, response) {
	setUserLoginStatus(true);
	login_session['provider'] = request.query.provider;
	login_session['provider_id'] = request.query.provider_id;
	login_session['username'] = request.query.name;
	login_session['email'] = request.query.email;
	login_session['picture'] = request.query.picture;

	var sql = "select * from user where name = \"" + request.query.name + "\" and email = \"" + request.query.email + "\" and provider = \"" + request.query.provider + "\";";
	connection.query(sql, function(err,user,fields) {
		if (err)	{
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		if (user.length == 0) {
			sql = "INSERT INTO user (name, email, picture, provider) VALUES (\"" + request.query.name + "\", \"" + request.query.email + "\", \"" + request.query.picture + "\", \"" + request.query.provider + "\");";
			connection.query(sql, function(err,user,fields) {
				if(err)
				{
					console.log('error : ', err);
					throw err;
				}
				connection.commit();
				sleep(1000);
			});
		}
		sql = "select * from user where name = \"" + request.query.name + "\" and email = \"" + request.query.email + "\" and provider = \"" + request.query.provider + "\";";
		connection.query(sql, function(err,user,fields) {
			if(err) {
				console.log('error : ', err);
				throw err;
			}
			connection.commit();
			sleep(1000);
			login_session['user_id'] = user[0].id;
			var msg = "Now logged in as " + login_session['username'];
			setFlashMessage(msg);
			return response.send(user);
		});
	});
});


app.get('/disconnect', function (req, res) {
	setUserLoginStatus(false);
	login_session['provider'] = "";
	login_session['provider_id'] = "";
	login_session['username'] = "";
	login_session['email'] = "";
	login_session['picture'] = "";
	var msg = "You have successfully logged out";
	setFlashMessage(msg);
    return res.redirect('/');
});


app.get(['/','/shoppinglist/'], function(request, response) {
	var sql = 'select * from shoppinglist order by shoppinglist.name asc;';
	connection.query(sql, function(err,shoppinglists,fields) {
		if(err) {
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		var val = getUserLoginStatus();
		var message = getFlashMessage();
		if(val) {
			return response.render('ShoppingLists.html', {currentuser: login_session['username'], shoppinglists: shoppinglists, loginstatus: val, message: message});
		}
		else {
			return response.render('publicShoppingLists.html', {shoppinglists: shoppinglists, loginstatus: val, message: message});
		}
	});
});


app.get('/newShoppingList/', function(request, response) {
	setFlashMessage("");
	var val = getUserLoginStatus();
	return response.render('newShoppingList.html', {loginstatus: val});
});


app.post('/newShoppingList/', function(request, response) {
	var sql = "insert into shoppinglist (user_id, name, shared_email) values (" + login_session['user_id'] + ", \"" + request.body.name + "\", \"" + "" + "\");";
	console.log(sql);
	connection.query(sql, function(err,shoppinglist,fields) {
		if(err) {
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		var val = getUserLoginStatus();
		var msg = 'New Shopping List ' + request.body.name + ' Successfully Created';
		setFlashMessage(msg);
		return response.redirect('/shoppinglist/');
	});
});


app.get('/editShoppingList/:shoppinglist_id', function(request, response) {
	setFlashMessage("");
	var shoppinglist_id = request.params.shoppinglist_id;
	var val = getUserLoginStatus();
	var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
	connection.query(sql, function(err,shoppinglist,fields) {
		if(err) {
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		return response.render('editShoppingList.html', {shoppinglist: shoppinglist, loginstatus: val});
	});
});


app.post('/editShoppingList/:shoppinglist_id', function(request, response) {
	var shoppinglist_id = request.params.shoppinglist_id;
	var sql = "update shoppinglist set name = \"" + request.body.name + "\" where id = " + shoppinglist_id + ";";
	connection.query(sql, function(err,shoppinglist,fields) {
		if(err) {
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		var msg = 'Successfully Edited ' + request.body.name;
		setFlashMessage(msg);
		var url = '/shoppinglist/' + shoppinglist_id + '/item/';
		return response.redirect(url);
	});
});


app.get('/shoppinglist/:shoppinglist_id/share/', function(request, response) {
	setFlashMessage("");
	var shoppinglist_id = request.params.shoppinglist_id;
	var val = getUserLoginStatus();
	var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
	connection.query(sql, function(err,shoppinglist,fields) {
		if(err) {
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		
		sql = "select * from user;";
		connection.query(sql, function(err,users,fields) {
			if(err) {
				console.log('error : ', err);
				throw err;
			}
			connection.commit();
			sleep(1000);
			var count = users.length;
			return response.render('shareShoppingList.html', {shoppinglist: shoppinglist, loginstatus: val, users: users, usercount: count});
		});
	});
});


app.post('/shoppinglist/:shoppinglist_id/share/', function(request, response) {
	var shoppinglist_id = request.params.shoppinglist_id;
	if(request.body.shared_email) {
		var sql = "update shoppinglist set shared_email = \"" + request.body.shared_email + "\" where id = " + shoppinglist_id + ";";
		connection.query(sql, function(err,shoppinglist,fields) {
			if(err) {
				console.log('error : ', err);
				throw err;
			}
			connection.commit();
			sleep(1000);
			var msg = 'Successfully shared';
			setFlashMessage(msg);
		});
	}
	var url = '/shoppinglist/' + shoppinglist_id + '/item/';
	return response.redirect(url);
});


app.get('/shoppinglist/:shoppinglist_id/unshare/', function(request, response) {
	setFlashMessage("");
	var shoppinglist_id = request.params.shoppinglist_id;
	var val = getUserLoginStatus();
	var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
	connection.query(sql, function(err,shoppinglist,fields) {
		if(err) {
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		return response.render('unshareShoppingList.html', {shoppinglist: shoppinglist, loginstatus: val});
	});
});


app.post('/shoppinglist/:shoppinglist_id/unshare/', function(request, response) {
	var shoppinglist_id = request.params.shoppinglist_id;
	var sql = "update shoppinglist set shared_email = \"" + "" + "\" where id = " + shoppinglist_id + ";";
	connection.query(sql, function(err,shoppinglist,fields) {
		if(err) {
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		var msg = 'Successfully Unshared';
		setFlashMessage(msg);
		var url = '/shoppinglist/' + shoppinglist_id + '/item/';
		return response.redirect(url);
	});
});


app.get('/shoppinglist/:shoppinglist_id/delete/', function(request, response) {
	setFlashMessage("");
	var shoppinglist_id = request.params.shoppinglist_id;
	var val = getUserLoginStatus();
	var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
	connection.query(sql, function(err,shoppinglist,fields) {
		if(err)	{
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		var val = getUserLoginStatus();
		return response.render('deleteShoppingList.html', {shoppinglist: shoppinglist, loginstatus: val});
	});
});


app.post('/shoppinglist/:shoppinglist_id/delete/', function(request, response) {
	var shoppinglist_id = request.params.shoppinglist_id;
	var sql = "delete from shoppinglist where id = " + shoppinglist_id + ";";
	connection.query(sql, function(err,shoppinglist,fields) {
		if(err) {
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		var msg = 'Successfully Deleted';
		setFlashMessage(msg);
		var url = '/shoppinglist/';
		return response.redirect(url);
	});
});


app.get('/shoppinglist/:shoppinglist_id/item/', function(request, response) {
	var shoppinglist_id = request.params.shoppinglist_id;
	var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
	connection.query(sql, function(err,shoppinglist,fields) {
		if(err) {
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		
		sql = "select * from user where id=" + shoppinglist[0].user_id + ";";
		connection.query(sql, function(err,creator,fields) {
			if(err)	{
				console.log('error : ', err);
				throw err;
			}
			connection.commit();

			sql = "select * from user;";
			connection.query(sql, function(err,users,fields) {
				if(err) {
					console.log('error : ', err);
					throw err;
				}
				var count = users.length;
				connection.commit();
				sleep(1000);
				
				sql = "select * from item where shoppinglist_id=" + shoppinglist_id + ";";
				connection.query(sql, function(err,items,fields) {
					if(err)	{
						console.log('error : ', err);
						throw err;
					}
					connection.commit();
					sleep(1000);
					var val = getUserLoginStatus();
					var message = getFlashMessage();
					if ((val == false) || (creator[0].id != login_session['user_id'] && login_session['email'] != shoppinglist[0].shared_email)) {
						return response.render('publicItem.html', {items: items, shoppinglist: shoppinglist, creator: creator, loginstatus: val, message: message});
					}
					else {
						return response.render('Item.html', {items: items, shoppinglist: shoppinglist, creator: creator, usercount: count, loginstatus: val, message: message});
					}
				});
			});
		});
	});
});


app.get('/shoppinglist/:shoppinglist_id/item/new/', function(request, response) {
	setFlashMessage("");
	var val = getUserLoginStatus();
	return response.render('newItem.html', {loginstatus: val});
});


app.post('/shoppinglist/:shoppinglist_id/item/new/', function(request, response) {
	var shoppinglist_id = request.params.shoppinglist_id;
	var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
	connection.query(sql, function(err,shoppinglist,fields) {
		if(err) {
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		sql = "insert into item (name, quantity, shoppinglist_id, user_id) values (\"" + request.body.name + "\", \"" + request.body.quantity + "\", " + shoppinglist_id + ", " + shoppinglist[0].user_id + ");";
		connection.query(sql, function(err,item,fields) {
			if(err) {
				console.log('error : ', err);
				throw err;
			}
			connection.commit();
			sleep(1000);
			var msg = 'New Item ' + request.body.name + ' Successfully Created';
			setFlashMessage(msg);
			var url = '/shoppinglist/' + shoppinglist_id + '/item/';
			return response.redirect(url);
		});
	});
});


app.get('/shoppinglist/:shoppinglist_id/item/:item_id/edit', function(request, response) {
	setFlashMessage("");
	var shoppinglist_id = request.params.shoppinglist_id;
	var item_id = request.params.item_id;
	var sql = "select * from item where id=" + item_id + ";";
	connection.query(sql, function(err,item,fields) {
		if(err)	{
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		var val = getUserLoginStatus();
		return response.render('editItem.html', {item: item, loginstatus: val});
	});
});


app.post('/shoppinglist/:shoppinglist_id/item/:item_id/edit', function(request, response) {
	var shoppinglist_id = request.params.shoppinglist_id;
	var item_id = request.params.item_id;
	var sql = "update item set name = \"" + request.body.name + "\" , quantity = \"" + request.body.quantity + "\"" + " where id = " + item_id + ";";
	connection.query(sql, function(err,editedItem,fields) {
		if(err)	{
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		var msg = 'Item ' + request.body.name + ' Successfully Edited';
		setFlashMessage(msg);
		var url = '/shoppinglist/' + shoppinglist_id + '/item/';
		return response.redirect(url);
	});
});


app.get('/shoppinglist/:shoppinglist_id/item/:item_id/delete', function(request, response) {
	setFlashMessage("");
	var item_id = request.params.item_id;
	var sql = "select * from item where id=" + item_id + ";";
	connection.query(sql, function(err,item,fields) {
		if(err)	{
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		var val = getUserLoginStatus();
		return response.render('deleteItem.html', {item: item, loginstatus: val});
	});
});	

app.post('/shoppinglist/:shoppinglist_id/item/:item_id/delete', function(request, response) {
	var shoppinglist_id = request.params.shoppinglist_id;
	var item_id = request.params.item_id;
	var sql = "delete from item where id = " + item_id + ";"
	connection.query(sql, function(err,item,fields) {
		if(err) {
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		var msg = 'Item Successfully Deleted';
		setFlashMessage(msg);
		var url = '/shoppinglist/' + shoppinglist_id + '/item/';
		return response.redirect(url);
	});
});


app.get('/user/api', function(request, response) {
	var val = getUserLoginStatus();
	var sql = 'select * from user;';
	connection.query(sql, function(err,rows,fields) {
		if(err)	{
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		response.send(rows);
	});
});


app.get('/shoppinglist/api/', function(request, response) {
	var sql = 'select * from shoppinglist;';
	connection.query(sql, function(err,rows,fields) {
		if(err) {
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		response.send(rows);
	});
});


app.get('/item/api/', function(request, response) {
	var sql = 'select * from item;';
	connection.query(sql, function(err,rows,fields) {
		if(err)	{
			console.log('error : ', err);
			throw err;
		}
		connection.commit();
		sleep(1000);
		response.send(rows);
	});
});


var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});