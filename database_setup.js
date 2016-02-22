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

var sql = "CREATE TABLE user (id int NOT NULL AUTO_INCREMENT PRIMARY KEY, name varchar(100) NOT NULL, email varchar(100) NOT NULL, picture varchar(255), provider varchar(100));";
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

sql = "CREATE TABLE shoppinglist (id int NOT NULL AUTO_INCREMENT PRIMARY KEY, name varchar(250) NOT NULL, shared_email varchar(250), user_id int, FOREIGN KEY fk_user_id(user_id) REFERENCES user(id) ON DELETE CASCADE);";
console.log("query2 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    console.log(sql);
    sleep(1000);
    console.log('query2 executed');
});

sql = "CREATE TABLE item (id int NOT NULL  AUTO_INCREMENT, name varchar(250) NOT NULL, quantity varchar(8), shoppinglist_id int, user_id int, PRIMARY KEY (id), FOREIGN KEY fk_shoppinglist_id(shoppinglist_id) REFERENCES shoppinglist(id) ON DELETE CASCADE, FOREIGN KEY fk_user_id(user_id) REFERENCES user(id) ON DELETE CASCADE);";
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

sql = "INSERT INTO user (name, email, picture, provider) VALUES ('Lakshmi S Nair', 'laxmi256@gmail.com', 'https://lh3.googleusercontent.com/-X_99w-tbVxk/AAAAAAAAAAI/AAAAAAAAKo4/wEqfD6cBWLM/s96-c/photo.jpg', 'google');";
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

sql = 'select * from user;';
console.log("query5 : " + sql);
connection.query(sql, function (err, rows) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    console.log(rows);
    sleep(1000);
    console.log('query5 executed');
});

sql = "INSERT INTO shoppinglist (user_id, name, shared_email) VALUES (2, 'Big Bazaar List', '');";
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

sql = 'select * from shoppinglist;';
console.log("query7 : " + sql);
connection.query(sql, function (err, rows) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    console.log(rows);
    sleep(1000);
    console.log('query7 executed');
});

sql = "INSERT INTO item (name, quantity, user_id, shoppinglist_id) VALUES ('Rice', '20 kg', 2, 2);";
console.log("query8 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query8 executed');
});


sql = "INSERT INTO item (name, quantity, user_id, shoppinglist_id) VALUES ('Idli Rice', '5 kg', 2, 2);";
console.log("query9 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query9 executed');
});

sql = "INSERT INTO item (name, quantity, user_id, shoppinglist_id) VALUES ('Dosa Rice', '3 kg', 2, 2);";
console.log("query10 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query10 executed');
});

sql = "INSERT INTO item (name, quantity, user_id, shoppinglist_id) VALUES ('Sugar', '6 kg', 2, 2);";
console.log("query11 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query11 executed');
});

sql = "INSERT INTO item (name, quantity, user_id, shoppinglist_id) VALUES ('Ashirvaad Atta', '10kg', 2, 2);";
console.log("query12 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query12 executed');
});

sql = "INSERT INTO item (name, quantity, user_id, shoppinglist_id) VALUES ('Urad Daal', '1 kg', 2, 2);";
console.log("query13 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query13 executed');
});

sql = "INSERT INTO item (name, quantity, user_id, shoppinglist_id) VALUES ('Red Label Tea', '1/2 kg', 2, 2);";
console.log("query14 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query14 executed');
});

sql = "INSERT INTO item (name, quantity, user_id, shoppinglist_id) VALUES ('Toilet Soap', '3', 2, 2);";
console.log("query15 : " + sql);
connection.query(sql, function (err) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    connection.commit();
    sleep(1000);
    console.log('query15 executed');
});

sql = 'select * from item;';
console.log("query16 : " + sql);
connection.query(sql, function (err, rows) {
    "use strict";
    if (err) {
        console.log('error : ', err);
        throw err;
    }
    console.log(rows);
    sleep(1000);
    console.log('query16 executed');
});