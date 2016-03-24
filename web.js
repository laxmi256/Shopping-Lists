var express = require("express");
var mysql = require('mysql');
var app = express();
var crypto = require("crypto");
var session = require('express-session');
var bodyParser = require('body-parser');


app.use(express.logger());
app.use(express.static('static'));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function (req, res, next) {
    "use strict";
    res.header("Access-Control-Allow-Origin", "*");
    res.header 'Access-Control-Allow-Methods', 'POST, DELETE'
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var pool = mysql.createPool({
    host: 'us-cdbr-iron-east-03.cleardb.net',
    user: 'bf1b404d468753',
    password: '2fb48d2b',
    database: 'heroku_0e7fc04c2dc2f91'
});


function sleep(milliseconds) {
    "use strict";
    var i = 0;
    var start = new Date().getTime();
    for (i = 0; i < 1e7; i += 1) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}


var flashMsg = "";
var userloggedin;
var login_session = {provider: "", provider_id: "", user_id: "", username: "", email: "", picture: ""};


function setUserLoginStatus(val) {
    "use strict";
    userloggedin = val;
}


function getUserLoginStatus() {
    "use strict";
    return userloggedin;
}


function setFlashMessage(val) {
    "use strict";
    flashMsg = val;
}


function getFlashMessage() {
    "use strict";
    return flashMsg;
}


app.get('/login', function (request, response) {
    "use strict";
    setUserLoginStatus(false);
    var state = crypto.randomBytes(20).toString('hex');
    app.use(session({secret: state}));
    response.render('login.html', {currentuser: login_session});
});


app.get('/connect/', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        setUserLoginStatus(true);
        login_session.provider = request.query.provider;
        login_session.provider_id = request.query.provider_id;
        login_session.username = request.query.name;
        login_session.email = request.query.email;
        login_session.picture = request.query.picture;

        var sql = "select * from user where name = \"" + request.query.name + "\" and email = \"" + request.query.email + "\" and provider = \"" + request.query.provider + "\";";
        connection.query(sql, function (err, user) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            if (user.length === 0) {
                sql = "INSERT INTO user (name, email, picture, provider) VALUES (\"" + request.query.name + "\", \"" + request.query.email + "\", \"" + request.query.picture + "\", \"" + request.query.provider + "\");";
                connection.query(sql, function (err) {
                    if (err) {
                        console.log('error : ', err);
                        throw err;
                    }
                    connection.commit();
                    sleep(1000);
                });
            }
            sql = "select * from user where name = \"" + request.query.name + "\" and email = \"" + request.query.email + "\" and provider = \"" + request.query.provider + "\";";
            connection.query(sql, function (err, user) {
                if (err) {
                    console.log('error : ', err);
                    connection.release();
                    throw err;
                }
                connection.commit();
                sleep(1000);
                connection.release();
                login_session.user_id = user[0].id;
                var msg = "Now logged in as " + login_session.username;
                setFlashMessage(msg);
                return response.send(user);
            });
        });
    });
});


app.get('/disconnect', function (request, response) {
    "use strict";
    setUserLoginStatus(false);
    login_session.provider = "";
    login_session.provider_id = "";
    login_session.username = "";
    login_session.email = "";
    login_session.picture = "";
    var msg = "You have successfully logged out";
    setFlashMessage(msg);
    return response.redirect('/');
});


app.get(['/', '/shoppinglist/'], function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var sql = 'select * from shoppinglist order by shoppinglist.name asc;';
        connection.query(sql, function (err, shoppinglists) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            var val = getUserLoginStatus();
            var message = getFlashMessage();
            if (val) {
                return response.render('ShoppingLists.html', {currentuser: login_session.username, shoppinglists: shoppinglists, loginstatus: val, message: message});
            } else {
                return response.render('publicShoppingLists.html', {shoppinglists: shoppinglists, loginstatus: val, message: message});
            }
        });
    });
});


app.get('/shoppingList/new/', function (request, response) {
    "use strict";
    setFlashMessage("");
    var val = getUserLoginStatus();
    return response.render('newShoppingList.html', {loginstatus: val});
});


app.post('/shoppingList/new/', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var sql = "insert into shoppinglist (user_id, name, shared_email) values (" + login_session.user_id + ", \"" + request.body.name + "\", \"" + "" + "\");";
        console.log(sql);
        connection.query(sql, function (err) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            var msg = 'New Shopping List ' + request.body.name + ' Successfully Created';
            setFlashMessage(msg);
            return response.redirect('/shoppinglist/');
        });
    });
});


app.get('/shoppingList/:shoppinglist_id/edit/', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        setFlashMessage("");
        var shoppinglist_id = request.params.shoppinglist_id;
        var val = getUserLoginStatus();
        var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
        connection.query(sql, function (err, shoppinglist) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            return response.render('editShoppingList.html', {shoppinglist: shoppinglist, loginstatus: val});
        });
    });
});


app.post('/shoppingList/:shoppinglist_id/edit/', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;
        var sql = "update shoppinglist set name = \"" + request.body.name + "\" where id = " + shoppinglist_id + ";";
        connection.query(sql, function (err) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            var msg = 'Successfully Edited ' + request.body.name;
            setFlashMessage(msg);
            var url = '/shoppinglist/' + shoppinglist_id + '/item/';
            return response.redirect(url);
        });
    });
});


app.get('/shoppinglist/:shoppinglist_id/share/', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        setFlashMessage("");
        var val = getUserLoginStatus();
        var shoppinglist_id = request.params.shoppinglist_id;
        var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
        connection.query(sql, function (err, shoppinglist) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);

            sql = "select * from user;";
            connection.query(sql, function (err, users) {
                if (err) {
                    console.log('error : ', err);
                    connection.release();
                    throw err;
                }
                connection.commit();
                sleep(1000);
                connection.release();
                var count = users.length;
                return response.render('shareShoppingList.html', {shoppinglist: shoppinglist, loginstatus: val, users: users, usercount: count});
            });
        });
    });
});


app.post('/shoppinglist/:shoppinglist_id/share/', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;
        if (request.body.shared_email) {
            var sql = "update shoppinglist set shared_email = \"" + request.body.shared_email + "\" where id = " + shoppinglist_id + ";";
            connection.query(sql, function (err) {
                if (err) {
                    console.log('error : ', err);
                    connection.release();
                    throw err;
                }
                connection.commit();
                sleep(1000);
                connection.release();
                var msg = 'Successfully Shared Shopping List';
                setFlashMessage(msg);
            });
        }
        var url = '/shoppinglist/' + shoppinglist_id + '/item/';
        return response.redirect(url);
    });
});


app.get('/shoppinglist/:shoppinglist_id/unshare/', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        setFlashMessage("");
        var shoppinglist_id = request.params.shoppinglist_id;
        var val = getUserLoginStatus();
        var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
        connection.query(sql, function (err, shoppinglist) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            return response.render('unshareShoppingList.html', {shoppinglist: shoppinglist, loginstatus: val});
        });
    });
});


app.post('/shoppinglist/:shoppinglist_id/unshare/', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;
        var sql = "update shoppinglist set shared_email = \"" + "" + "\" where id = " + shoppinglist_id + ";";
        connection.query(sql, function (err) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            var msg = 'Successfully Unshared Shopping List';
            setFlashMessage(msg);
            var url = '/shoppinglist/' + shoppinglist_id + '/item/';
            return response.redirect(url);
        });
    });
});


app.get('/shoppinglist/:shoppinglist_id/delete/', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        setFlashMessage("");
        var shoppinglist_id = request.params.shoppinglist_id;
        var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
        connection.query(sql, function (err, shoppinglist) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            var val = getUserLoginStatus();
            return response.render('deleteShoppingList.html', {shoppinglist: shoppinglist, loginstatus: val});
        });
    });
});


app.post('/shoppinglist/:shoppinglist_id/delete/', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;
        var sql = "delete from shoppinglist where id = " + shoppinglist_id + ";";
        connection.query(sql, function (err) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            var msg = 'Successfully Deleted Shopping List';
            setFlashMessage(msg);
            var url = '/shoppinglist/';
            return response.redirect(url);
        });
    });
});


app.get('/shoppinglist/:shoppinglist_id/item/', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;
        var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
        connection.query(sql, function (err, shoppinglist) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);

            sql = "select * from user where id=" + shoppinglist[0].user_id + ";";
            connection.query(sql, function (err, creator) {
                if (err) {
                    console.log('error : ', err);
                    connection.release();
                    throw err;
                }
                connection.commit();

                sql = "select * from user;";
                connection.query(sql, function (err, users) {
                    if (err) {
                        console.log('error : ', err);
                        connection.release();
                        throw err;
                    }
                    var count = users.length;
                    connection.commit();
                    sleep(1000);

                    sql = "select * from item where shoppinglist_id=" + shoppinglist_id + ";";
                    connection.query(sql, function (err, items) {
                        if (err) {
                            console.log('error : ', err);
                            connection.release();
                            throw err;
                        }
                        connection.commit();
                        sleep(1000);
                        connection.release();
                        var val = getUserLoginStatus();
                        var message = getFlashMessage();
                        if ((val === false) || (creator[0].id !== login_session.user_id && login_session.email !== shoppinglist[0].shared_email)) {
                            return response.render('publicItem.html', {items: items, shoppinglist: shoppinglist, creator: creator, loginstatus: val, message: message});
                        } else {
                            return response.render('Item.html', {items: items, shoppinglist: shoppinglist, creator: creator, usercount: count, loginstatus: val, message: message});
                        }
                    });
                });
            });
        });
    });
});


app.get('/shoppinglist/:shoppinglist_id/item/new/', function (request, response) {
    "use strict";
    setFlashMessage("");
    var val = getUserLoginStatus();
    return response.render('newItem.html', {loginstatus: val});
});


app.post('/shoppinglist/:shoppinglist_id/item/new/', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;
        var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
        connection.query(sql, function (err, shoppinglist) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            sql = "insert into item (name, quantity, shoppinglist_id, user_id) values (\"" + request.body.name + "\", \"" + request.body.quantity + "\", " + shoppinglist_id + ", " + shoppinglist[0].user_id + ");";
            connection.query(sql, function (err) {
                if (err) {
                    console.log('error : ', err);
                    connection.release();
                    throw err;
                }
                connection.commit();
                sleep(1000);
                connection.release();
                var msg = 'New Item ' + request.body.name + ' Successfully Created';
                setFlashMessage(msg);
                var url = '/shoppinglist/' + shoppinglist_id + '/item/';
                return response.redirect(url);
            });
        });
    });
});


app.get('/shoppinglist/:shoppinglist_id/item/:item_id/edit', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        setFlashMessage("");
        var item_id = request.params.item_id;
        var sql = "select * from item where id=" + item_id + ";";
        connection.query(sql, function (err, item) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            var val = getUserLoginStatus();
            return response.render('editItem.html', {item: item, loginstatus: val});
        });
    });
});


app.post('/shoppinglist/:shoppinglist_id/item/:item_id/edit', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;
        var item_id = request.params.item_id;
        var sql = "update item set name = \"" + request.body.name + "\" , quantity = \"" + request.body.quantity + "\"" + " where id = " + item_id + ";";
        connection.query(sql, function (err) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            var msg = 'Item ' + request.body.name + ' Successfully Edited';
            setFlashMessage(msg);
            var url = '/shoppinglist/' + shoppinglist_id + '/item/';
            return response.redirect(url);
        });
    });
});


app.get('/shoppinglist/:shoppinglist_id/item/:item_id/delete', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        setFlashMessage("");
        var item_id = request.params.item_id;
        var sql = "select * from item where id=" + item_id + ";";
        connection.query(sql, function (err, item) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            var val = getUserLoginStatus();
            return response.render('deleteItem.html', {item: item, loginstatus: val});
        });
    });
});


app.post('/shoppinglist/:shoppinglist_id/item/:item_id/delete', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;
        var item_id = request.params.item_id;
        var sql = "delete from item where id = " + item_id + ";";
        connection.query(sql, function (err) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            var msg = 'Item Successfully Deleted';
            setFlashMessage(msg);
            var url = '/shoppinglist/' + shoppinglist_id + '/item/';
            return response.redirect(url);
        });
    });
});


app.get('/user/json', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var sql = 'select * from user;';
        connection.query(sql, function (err, rows) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            response.send(rows);
        });
    });
});


app.get('/user/:user_id/json', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var user_id = request.params.user_id;
        var sql = "select * from user where id=" + user_id + ";";
        connection.query(sql, function (err, rows) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            response.send(rows);
        });
    });
});


app.delete('/user/:user_id/json', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var user_id = request.params.user_id;
        var sql = "delete from user where id=" + user_id + ";";
        connection.query(sql, function (err) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            response.send(200);
        });
    });
});


app.get('/shoppinglist/json', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var sql = 'select * from shoppinglist;';
        connection.query(sql, function (err, rows) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            response.send(rows);
        });
    });
});


app.get('/shoppinglist/:shoppinglist_id/json', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;
        var sql = "select * from shoppinglist where id=" + shoppinglist_id + ";";
        connection.query(sql, function (err, rows) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            response.send(rows);
        });
    });
});


app.delete('/shoppinglist/:shoppinglist_id/json', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }       
        var shoppinglist_id = request.params.shoppinglist_id;
        var sql = "delete from shoppinglist where id=" + shoppinglist_id + ";";
        connection.query(sql, function (err) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            response.send(200);
        });
    });
});


app.get('/item/json', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;
        var sql = "select * from item;";
        connection.query(sql, function (err, rows) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            response.send(rows);
        });
    });
});


app.get('/item/:item_id/json', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var item_id = request.params.item_id;
        var sql = "select * from item where id=" + item_id + ";";
        connection.query(sql, function (err, rows) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            response.send(rows);
        });
    });
});


app.delete('/item/:item_id/json', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }       
        var item_id = request.params.item_id;
        var sql = "delete from item where id=" + item_id + ";";
        connection.query(sql, function (err) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            response.send(200);
        });
    });
});


app.get('/shoppinglist/:shoppinglist_id/item/json', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;
        var sql = "select * from item where shoppinglist_id=" + shoppinglist_id + ";";
        connection.query(sql, function (err, rows) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            response.send(rows);
        });
    });
});


app.get('/shoppinglist/:shoppinglist_id/item/:item_id/json', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;
        var item_id = request.params.item_id;
        var sql = "select * from item where shoppinglist_id=" + shoppinglist_id + " and id=" + item_id + ";";
        connection.query(sql, function (err, rows) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();
            response.send(rows);
        });
    });
});


app.delete('/shoppinglist/:shoppinglist_id/item/:item_id/json', function (request, response) {
    "use strict";
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log('error : ', err);
            throw err;
        }
        var shoppinglist_id = request.params.shoppinglist_id;   
        var item_id = request.params.item_id;
        var sql = "delete from item where shoppinglist_id=" + shoppinglist_id + " and id=" + item_id + ";";
        connection.query(sql, function (err) {
            if (err) {
                console.log('error : ', err);
                connection.release();
                throw err;
            }
            connection.commit();
            sleep(1000);
            connection.release();           
            response.send(200);
        });
    });
});

var port = process.env.PORT || 5000;
app.listen(port, function () {
    "use strict";
    setFlashMessage("");
    setUserLoginStatus(false);
    console.log("Listening on " + port);
});
