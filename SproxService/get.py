from ghost import Ghost
from operator import itemgetter
import tornado.websocket
import json
import re
import gutil
import hashlib
import shibboleth
import logger

def authGet(user, passwd, socket):
	#Authenticate against GET website
	get = Ghost(download_images=False, wait_timeout=40)
	userInfo = {}

	#Auth with Shibboleth
	if shibboleth.authShibbolethService(get, "https://get.cbord.com/umass/full/login.php", user, passwd):
		#Wait for the date class to appear, its one of the few things added after the XHR(s) complete
		get.wait_for_selector(".date")
		getPage = get.content.replace("\n","")
		
		#GET is pretty terrible and we have to use a bunch of bad Regex...
		userInfo["debit"] = "$0.00"
		try:
			userInfo["debit"] = re.search(r'Student Debit Plan<\/td><td class="last-child balance">.*?<\/td>', getPage).group(0).replace('Student Debit Plan</td><td class="last-child balance">', "").replace('</td>', "")
		except:
			logger.warning("Regex failed, could not capture Student Debit Account balance")

		userInfo["dd"] = "$0.00"
		try:
			userInfo["dd"] = re.search(r'UMass Dining Dollars<\/td><td class="last-child balance">.*?<\/td>', getPage).group(0).replace('UMass Dining Dollars</td><td class="last-child balance">', "").replace('</td>', "")
		except:
			logger.warning("Regex failed, could not capture Dinning Dollars balance")

		userInfo["swipes"] = "0"
		userInfo["mealPlanType"] = "EUnlimited"
		try:
			userInfo["swipes"] = re.search(r'E Unlimited Plan<\/td><td class="last-child balance">.*?<\/td>', getPage).group(0).replace('E Unlimited Plan</td><td class="last-child balance">', "").replace('</td>', "")
			userInfo["mealPlanType"] = "EUnlimited"
		except:
				logger.warning("Regex failed, could not capture Dining Swipes balance (Unlimited Plan)")
		try:
			userInfo["swipes"] = re.search(r'C Value Plan<\/td><td class="last-child balance">.*?<\/td>', getPage).group(0).replace('C Value Plan</td><td class="last-child balance">', "").replace('</td>', "")
			userInfo["mealPlanType"] = "CValue"
		except:
				logger.warning("Regex failed, could not capture Dining Swipes balance (Value Plan)")

		userInfo["gswipes"] = "0"
		try:
			userInfo["gswipes"] = re.search(r'Guest Meals<\/td><td class="last-child balance">.*?<\/td>', getPage).group(0).replace('Guest Meals</td><td class="last-child balance">', "").replace('</td>', "")
		except:
			logger.warning("Regex failed, could not capture Guest Swipes balance")

	else:
		#This should really never be triggered
		logger.warning("User with NetID hash: " + hashlib.sha256(user).hexdigest() + " has failed GET authentication negotiations")
		return

	#Logout
	shibboleth.logoutShibbolethService(get)
		
	#Return the data
	socket.write_message("[user_data_reply_get]" + json.dumps(userInfo))
	#socket.write_message("[user_data_reply_get]" + base64.b64encode(zlib.compress(json.dumps(userInfo),9)))