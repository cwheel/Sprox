import netifaces
import tornado.web
import tornado.websocket
import tornado.ioloop
import tornado.httpserver
import multiprocessing
import os
import uuid
import hashlib

import spire
import get
import parking
import clubSearch
import authFailure
import cacheManager
import notes
import stats
import logger
import config
if config.compileSass: import sass

whitelist = None
authTokens = multiprocessing.Manager().dict() #Thread-safe
protocol = {}

def printArt():
	print ""
	print "                  @@@@@@"
	print "                @@@@@@@@@     ____                           "
	print "               @@@      @@   / ___| _ __  _ __ _____  __     "
	print "              @@@       @@   \___ \| '_ \| '__/ _ \ \/ /   "
	print "             @@@@       @@    ___) | |_) | | | (_) >  <  "
	print "      @@     @@@       @@    |____/| .__/|_|  \___/_/\_\ "
	print "       @    @@@@      @@           |_|  "
	print "       @@   @@@@     @@  "
	print "        @@@@@@@@  @@@              ____                  _   "
	print "           @@@@@@@@@              / ___|  ___ _ ____   _(_) ___ ___"
	print "            @@@@                  \___ \ / _ \ '__\ \ / / |/ __/ _ \\"
	print "            @@@@                   ___) |  __/ |   \ V /| | (_|  __/"
	print "  @@@@      @@@@                  |____/ \___|_|    \_/ |_|\___\___| v" + config.version
	print " @@@@@      @@@@                         Running modules: spire, get, parking, clubSearch, authFailure, cacheManager, notes"
	print " @@@@@     @@@@@                         stats and logger"
	print " @@@@      @@@@@       					"
	print " @@@@      @@@@                          Press ^C to exit"
	print " @@@@     @@@@          "
	print "  @@@@@@@@@@@           "
	print "    @@@@@@@            "
	print ""
	         
def userTokenValid(user, token):
	try:
		if token in authTokens[user]:
			return True
		else:
			return False
	except Exception, e:
		logger.error("User with NetID hash: " + hashlib.sha256(user).hexdigest() + " has attempted auth with an invalid token!")
		return False


def registerProtocolFunction(command, needsAuth, needsSocket, function):
	protocol[command] = {"function" : function, "auth" : needsAuth, "socket" : needsSocket};

class WebSocketHandler(tornado.websocket.WebSocketHandler):
	def open(self):
		pass

	def on_message(self, message):
		if "[authenticate]" in message:
				message = message.replace("[authenticate],", "")
				user = message.split(",")[1]
				passwd = message.split(",")[2]

				#If the whitelist is enabled, is the user on it?
				login = True
				if not whitelist is None:
					login = False
					for netid in whitelist:
						if netid == user:
							login = True

				if login:
					if not authFailure.isUserBlacklisted(user):
						#Status updates
						self.write_message("[auth_status]Authenticating with services...")
						logger.info("User with NetID hash: " + hashlib.sha256(user).hexdigest() + " has begun authentication negotiations...")

						#Check if Spire is online
						#if os.system("ping -c 1 spire.umass.edu") == 1:
						#	self.write_message("[service_down_spire]")
						#	return

						#Worker processes for Spire, GET and Parking Services
						if "[get]" in message:
							gi = multiprocessing.Process(target=get.authGet,args=(user, passwd, self))
							gi.start()
						elif "[spire]" in message:
							stats.incrementCounter("spire_auths")
							if user in authTokens: logger.info("User with NetID hash: " + hashlib.sha256(user).hexdigest() + " has reset auth tokens...")
							si = multiprocessing.Process(target=spire.authSpire,args=(user, passwd, self, authTokens))
							si.start()
						elif "[parking]" in message:
							pi = multiprocessing.Process(target=parking.authParking,args=(user, passwd, self))
							pi.start()
					else:
						self.write_message("[authentication_failure_blacklist]")
				else:
					self.write_message("[authentication_failure_whitelist]")

		elif "[logout]" in message:
			#Deauth the user
			message = message.replace("[logout]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]

			logger.info("User with NetID hash: " + hashlib.sha256(user).hexdigest() + " has logged out")

			#Make sure token is valid prior to destruction
			if userTokenValid(user, token):
				del authTokens[user]

		#Protocol Command Running
		for command in protocol:
			#Check if our message starts with the command
			if (message.startswith("[" + command + "]")):
				#Convert the argument string to a list
				args = message.replace("[" + command + "]", "").split(",")

				#Check for auth
				if protocol[command]["auth"]:
					if userTokenValid(args[0], args[1]):

						#Remove the authtoken, lower functions never use it
						try:
							args.remove(authTokens[args[0]])
						except:
							pass
						
						#Add the socket to the list if needed
						if protocol[command]["socket"]:
							args.append(self)

						#Convert the arguments to a tuple
						args = tuple(args)

						#Call the function with the tuple of args
						protocol[command]["function"](*args)

				#Run if auth isn't needed
				else:
					try:
						args.remove(authTokens[args[0]])
					except:
						pass

					if protocol[command]["socket"]:
						args.append(self)

					args = tuple(args)
					protocol[command]["function"](*args)

	def on_close(self):
		pass

	def check_origin(self, origin):
		return True

############################################
# HTTP(s) Server
############################################

class httpHandler(tornado.web.RequestHandler):
    def get(self):
        self.redirect(self.request.full_url().replace("http", "https"), permanent=True)

class httpsHandler(tornado.web.RequestHandler):
	def sendPage(client, path, scss):
		ext = os.path.splitext(path)[1]

		with open (path, "r") as page:
			pageContent = page.read()


		client.set_header("Server", "Sprox v" + config.version)

		if scss:
			pageContent = sass.compile(string=pageContent);
			client.set_header("Content-Type", config.mimeTypes[".css"])
		else:
			client.set_header("Content-Type", config.mimeTypes[ext])

		client.set_header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		client.write(pageContent)

	def get(self):
		req = config.frontend + self.request.uri

		if "?" in req:
			req = req.split("?")[0]

		if ".." in req or "./" in req or "\\" in req:
			sendPage(self, config.frontend + "/errors/503.html", False)
		
		if (req[-1:] == "/"):
			if (os.path.isdir(req)):
				if (os.path.exists(req + "index.html")):
					httpsHandler.sendPage(self, config.frontend + self.request.uri + "index.html", False)
				else:
					httpsHandler.sendPage(self, config.frontend + "/errors/404.html", False)
			else:
				httpsHandler.sendPage(self, config.frontend + "/errors/404.html", False)
		else:
			if config.compileSass and (os.path.exists(req.replace("css", "scss"))) and not os.path.exists(req):
				httpsHandler.sendPage(self, req.replace("css", "scss"), True)
			elif (os.path.exists(req)):
				httpsHandler.sendPage(self, req, False)
			else:
				httpsHandler.sendPage(self, config.frontend + "/errors/404.html", False)

http = tornado.web.Application([
    (r'/.*', httpHandler),
])

https = tornado.web.Application([
    (r'/.*', httpsHandler),
])

sockets = tornado.web.Application([
    (r"/", WebSocketHandler),
])

############################################
# Launch
############################################

if __name__ == "__main__":
	printArt()

	logger.suppressed("===================SPROX SERVICE STARTED===================");

	if os.path.isfile("whitelist"):
		logger.info("Detected NetID whitelist, loading...")
		with open("whitelist") as f:
			whitelist = f.readlines()
			whitelist = [netid.strip('\n') for netid in whitelist]

	logger.info('Building WebSocket protocol...')

	registerProtocolFunction("notes_load_layout", True, True, notes.loadNotesLayout)
	registerProtocolFunction("enable_cache", True, False, cacheManager.userRequestedCaching)
	registerProtocolFunction("disable_cache", True, False, cacheManager.userRequestedNeverCaching)
	registerProtocolFunction("notes_save", True, True, notes.saveNote)
	registerProtocolFunction("notes_load_page", True, True, notes.loadNotesPage)
	registerProtocolFunction("notes_rename_section", True, False, notes.renameSection)
	registerProtocolFunction("notes_remove_page", True, False, notes.removeSectionPage)
	registerProtocolFunction("notes_remove_section", True, False, notes.removeSection)
	registerProtocolFunction("notes_share_page", True, False, notes.loadNotesLayout)
	registerProtocolFunction("notes_update_color", True, False, notes.loadNotesLayout)
	registerProtocolFunction("notes_get_user_sections", True, True, notes.updateSectionColor)
	registerProtocolFunction("stats", False, True, stats.sendStats)
	registerProtocolFunction("club_search", True, True, clubSearch.query)

	logger.info('Starting HTTP server on :' + str(config.httpPort) + ' (Redirects only)...')
	tornado.httpserver.HTTPServer(http).listen(config.httpPort)
	httpsServer = tornado.httpserver.HTTPServer(https,
		ssl_options={ 
        	"certfile": config.sslCertFile,
        	"keyfile": config.sslKeyFile,
    	}
	)

	logger.info('Starting HTTPS server on :' + str(config.httpsPort) + '...')
	httpsServer.listen(config.httpsPort)

	if config.compileSass:
		logger.info('SASS compilation enabled. Files ending in .scss will be treated as .css')

	logger.info('Starting WebSocket server on :' + str(config.port) +'...')
	logger.info('Using TLS, connect via wss:// protocol...')
	logger.info("Listening on eth0 at " + netifaces.ifaddresses('eth0')[2][0]['addr'] + ":" + str(config.port) + ", waiting for clients...")

	sockets.listen(config.port, ssl_options={ 
        "certfile": config.sslCertFile,
        "keyfile": config.sslKeyFile,
    })

	tornado.ioloop.IOLoop.instance().start()