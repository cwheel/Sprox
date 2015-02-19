from ghost import Ghost
from operator import itemgetter
import tornado.websocket
import json
import re
import gutil
import shibboleth
import time
import cacheManager
import hashlib
import logger
import sessionManager

def authOnParkingWebsite(user, passwd, socket, cstate, sessions):
	#Authenticate against parking website
	parking = Ghost(download_images=False)
	permit = {"color" : "red", "permit" : "No Permit", "endDate" : ""}
	
	#Auth with Shibboleth
	if shibboleth.authShibbolethService(parking, "https://parking.umass.edu/myaccount.php/mypermits", user, passwd):
		parking.wait_for_selector("h1")
		parkingPermits = parking.content.replace("\n","")
		
		if not "No prior permits on record." in parkingPermits:
			color = "Red"
			try:
				active = re.search(r'</tr><tr>.*?Active', parkingPermits).group(0)
			except:
				logger.warning("Regex failed, could not caputre active permits. Perhaps there all expired?")
				return

			try:
				color = re.search(r'</tr><tr><td>.*?</td>', active).group(0).replace("</tr><tr><td>","").replace("</td>", "")
			except:
				logger.warning("Regex failed, could not capture parking permit color")
			
			permit = "Uknown Permit"
			try:
				permit = re.search(r'</td><td>.*?</td>', active).group(0).replace("</td><td>","").replace("</td>")
			except:
				logger.warning("Regex failed, could not capture parking permit number")
			
			endDate = time.strftime("%d/%m/%yy")
			try:
				endDate = re.search(r'</td><td>.*?</td>', active).group(1).replace("</td><td>","").replace("</td>")
			except:
				logger.warning("Regex failed, could not capture parking permit end date")
			
			permit = {"color" : color, "permit" : permit, "endDate" : endDate}

		if cstate == 1:
			cacheManager.setCacheForUserService(user, "parking", json.dumps(permit), passwd)
	else:
		#This should really never be triggered
		logger.warning("User with NetID hash: " + hashlib.sha256(user).hexdigest() + " has failed Parking Services authentication negotiations")
		return

	#Logout
	shibboleth.logoutShibbolethService(parking)
	
	#Send back data
	socket.write_message("[user_data_reply_parking]" + json.dumps(permit))
	sessionManager.storeSessionValue(sessions, user, "parking", permit)

def authParking(user, passwd, socket, sessions):
	#Handle Caching
	cacheState = cacheManager.userCacheState(user)
	if cacheState == 2:
		cache = cacheManager.getCacheForUserService(user, "parking", passwd)
		if cache is None:
			#Failed to auth on the local data store, maybe the user changed the university password?
			cacheState = 1
			authOnParkingWebsite(user, passwd, socket, cacheState, sessions)
		else:
			socket.write_message("[user_data_reply_parking]" + cache)
			sessionManager.storeSessionValue(sessions, user, "parking", cache)
	else:
		authOnParkingWebsite(user, passwd, socket, cacheState, sessions)