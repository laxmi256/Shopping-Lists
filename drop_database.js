var express = require("express");
var mysql = require('mysql');
var app = express();
app.use(express.logger());

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

var connection = mysql.createConnection('mysql://bf1b404d468753:2fb48d2b@us-cdbr-iron-east-03.cleardb.net/heroku_0e7fc04c2dc2f91');
connection.connect();
console.log("DB CONNECTION SUCCESS");

var sql = 'delete from item where id > 0;';
console.log("query1 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query1 executed');
});


sql = 'delete from shoppinglist where id > 0;';
console.log("query2 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query2 executed');
});

sql = 'delete from user where id > 0;';
console.log("query3 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query3 executed');
});

sql = 'drop table item;';
console.log("query4 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query4 executed');
});

sql = 'drop table shoppinglist;';
console.log("query5 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query5 executed');
});

sql = 'drop table user;';
console.log("query6 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query6 executed');
});