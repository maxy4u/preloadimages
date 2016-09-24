var express = require('express'),
    path = require('path'),
   app = express();
var oneDay = 86400000;
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.static(path.join(__dirname),{ maxAge: oneDay }));

app.listen(4000);
console.log('Listening on port 4000...');	