#Sprox Service Version
version = "1630"

#Web root
frontend = "frontend"

#SQL Connection Info
sqlHost = "localhost"
sqlUser = "root"
sqlPassword = "7145a7dfd5a6cfad8cf7c2221590cc24567e171dc9c7bfb62"
sqlDB = "Sprox"

#HTTP server MIME types
mimeTypes = {".html" : "text/html", 
	".png" : "image/png", 
	".js" : "text/javascript", 
	".ico" : "image/x-icon", ".css" : 
	"text/css", ".json" : "text/json", 
	".gif" : "image/gif", 
	".map" : "text/json",
	".scss" : "text/plain"}

#Should we compile SASS (.scss) files before sending them?
compileSass = True

#WebSocket port
port = 8181

#HTTP Ports
httpPort = 80
httpsPort = 443

#SSL Certificate
sslKeyFile = "decssl.key"
sslCertFile = "cert.crt"