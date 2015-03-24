var http = require ('http');

http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type' : 'text/plain'});
	res.end('Hello Mr Brian\n');
}).listen(8000, '127.0.0.1');
console.log("This is running on port 8000");
