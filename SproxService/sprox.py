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

whitelist = None
authTokens = multiprocessing.Manager().dict() #Thread-safe
frontend = "frontend"

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
	print "  @@@@      @@@@                  |____/ \___|_|    \_/ |_|\___\___| v1620"
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


class WebSocketHandler(tornado.websocket.WebSocketHandler):
	def open(self):
		pass

############################################
# Socket Command Processing
############################################

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

		elif "[enable_cache]" in message: 
			#Enable caching for the user
			message = message.replace("[enable_cache]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]

			if userTokenValid(user, token):
				cacheManager.userRequestedCaching(user)

		elif "[disable_cache]" in message: 
			#Disable caching for the user
			message = message.replace("[disable_cache]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]

			#Ensure token validity prior changing the cache state
			if userTokenValid(user, token):
				cacheManager.userRequestedNeverCaching(user)

		elif "[logout]" in message:
			#Deauth the user
			message = message.replace("[logout]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]

			logger.info("User with NetID hash: " + hashlib.sha256(user).hexdigest() + " has logged out")

			#Make sure token is valid prior to destruction
			if userTokenValid(user, token):
				del authTokens[user]

		elif "[notes_save]" in message:
			#Save the specified note
			message = message.replace("[notes_save]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]
			notebookSection = message.split(",")[2]
			page = message.split(",")[3]
			pageContents = message.split(",")[4]
			
			#Check the users auth state
			if userTokenValid(user, token):
				notes.saveNote(user, notebookSection, page, pageContents, self)

		elif "[notes_load_layout]" in message:
			#Load the notebook skeleton layout
			message = message.replace("[notes_load_layout]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]
			
			#Check the users auth state
			if userTokenValid(user, token):
				notes.loadNotesLayout(user, self)

		elif "[notes_load_page]" in message:
			#Load a specific note
			message = message.replace("[notes_load_page]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]
			notebookSection = message.split(",")[2]
			notebookPage = message.split(",")[3]
			
			#Check the users auth state
			if token in authTokens[user]:
				notes.loadNotesPage(user, notebookSection, notebookPage, self)

		elif "[notes_rename_section]" in message:
			#Rename a notebook section
			message = message.replace("[notes_rename_section]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]
			notebookSectionNew = message.split(",")[2]
			notebookSectionOld = message.split(",")[3]

			#Check the users auth state
			if userTokenValid(user, token):
				notes.renameSection(user, notebookSectionOld, notebookSectionNew)

		elif "[notes_remove_page]" in message:
			#Remove a specified page in a notebook
			message = message.replace("[notes_remove_page]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]
			notebookSection = message.split(",")[2]
			page = message.split(",")[3]

			#Check the users auth state
			if userTokenValid(user, token):
				notes.removeSectionPage(user, notebookSection, page)
		elif "[notes_remove_section]" in message:
			#Remove a specified page in a notebook
			message = message.replace("[notes_remove_section]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]
			notebookSection = message.split(",")[2]

			#Check the users auth state
			if userTokenValid(user, token):
				notes.removeSection(user, notebookSection)
		elif "[notes_share_page]" in message:
			#Share the specified page with the specified netid
			message = message.replace("[notes_share_page]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]
			notebookPage = message.split(",")[2]
			pageSection = message.split(",")[3]
			withUser = message.split(",")[4]
			intoSection = message.split(",")[5]
			
			#Check the users auth state
			if userTokenValid(user, token):
				notes.sharePage(user, notebookPage, pageSection, withUser, intoSection)
		elif "[notes_get_user_sections]" in message:
			#Get the sections for the specified user
			message = message.replace("[notes_get_user_sections]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]
			qUser = message.split(",")[2]
			
			#Check the users auth state
			if userTokenValid(user, token):
				notes.sectionsForUser(qUser, self)
		elif "[notes_update_color]" in message:
			#Change the color of a users section
			message = message.replace("[notes_update_color]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]
			section = message.split(",")[2]
			color = message.split(",")[3]
			
			#Check the users auth state
			if userTokenValid(user, token):
				notes.updateSectionColor(user, section, color)
		elif "[stats]" in message:
			stats.sendStats(self)
		elif "[club_search]" in message:
			#Query the clubs db for the specified term
			message = message.replace("[club_search]", "")
			user = message.split(",")[0]
			token = message.split(",")[1]
			query = message.split(",")[2]

			#Check the users auth state
			if userTokenValid(user, token):
				clubSearch.query(query, self)
	def on_close(self):
		pass

	def check_origin(self, origin):
		return True

############################################
# HTTP(s) Server
############################################

class httpHandler(tornado.web.RequestHandler):
    def get(self):
        self.redirect(self.request.full_url().replace("http", "https"))

class httpsHandler(tornado.web.RequestHandler):
	types = {".html" : "text/html", ".png" : "image/png", ".js" : "text/javascript", ".ico" : "image/x-icon", ".css" : "text/css", ".json" : "text/json", ".gif" : "image/gif"}

	def sendPage(client, path):
		ext = os.path.splitext(path)[1]

		with open (path, "r") as page:
			pageContent = page.read()

		client.set_header("Content-Type", httpsHandler.types[ext])
		client.write(pageContent)

	def get(self):
		req = frontend + self.request.uri

		if "?" in req:
			req = req.split("?")[0]

		if ".." in req or "./" in req or "\\" in req:
			sendPage(self, frontend + "/errors/503.html")
		
		if (req[-1:] == "/"):
			if (os.path.isdir(req)):
				if (os.path.exists(req + "index.html")):
					httpsHandler.sendPage(self, frontend + self.request.uri + "index.html")
				else:
					httpsHandler.sendPage(self, frontend + "/errors/404.html")
			else:
				httpsHandler.sendPage(self, frontend + "/errors/404.html")
		else:
			if (os.path.exists(req)):
				httpsHandler.sendPage(self, req)
			else:
				httpsHandler.sendPage(self, frontend + "/errors/404.html")

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

	logger.info('Starting HTTP server on :80...')
	tornado.httpserver.HTTPServer(http).listen(80)
	httpsServer = tornado.httpserver.HTTPServer(https,
		ssl_options={ 
        	"certfile": "cert.crt",
        	"keyfile": "decssl.key",
    	}
	)

	logger.info('Starting HTTPS server on :443...')
	httpsServer.listen(443)

	logger.info('Starting WebSocket server on :8181...')
	logger.info('Using TLS, connect via wss:// protocol...')
	logger.info("Listening on eth0 at " + netifaces.ifaddresses('eth0')[2][0]['addr'] + ":8181, waiting for clients...")

	sockets.listen(8181, ssl_options={ 
        "certfile": "cert.crt",
        "keyfile": "decssl.key",
    })

	tornado.ioloop.IOLoop.instance().start()