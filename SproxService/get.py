from ghost import Ghost
from operator import itemgetter
import tornado.websocket
import json
import re
import gutil
import hashlib
import shibboleth
import logger
import sys
import sessionManager

def stripNums(string):
	return (''.join([i for i in string if not i.isdigit()])).rstrip()

def authGet(user, passwd, socket, sessions):
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

		#Load the transaction history from GET
		get.open("https://get.cbord.com/umass/full/history.php")
		get.wait_for_page_loaded()

		#Prepare the transaction history for regex
		getHistoryPage = get.content.replace("\n","")
		getHistoryPage = re.search(r'<tbody class="scrollContent">.*?<\/tbody>', getHistoryPage).group(0)
		rawTransactions = re.findall(r'<tr class=".*?"><td class="first-child account_name">.*?<\/tr>', getHistoryPage)

		#Build final array for transport
		transactions = []
		for item in rawTransactions:
			jsonItem = {}

			#Build the JSON objects
			jsonItem['planType'] = re.search(r'<td class="first-child account_name">.*?<\/td>', item).group(0).replace('<td class="first-child account_name">',"").replace('</td>',"").lower().title()
			jsonItem['transDate'] = re.search(r'<span class="date">.*?<\/span>', item).group(0).replace('<span class="date">',"").replace('</span>',"")
			jsonItem['transTime'] = re.search(r'<span class="time">.*?<\/span>', item).group(0).replace('<span class="time">',"").replace('</span>',"")
			jsonItem['transLocation'] = re.search(r'<td class="activity_details">.*?<\/td>', item).group(0).replace('<td class="activity_details">',"").replace('</td>',"").lower().title()

			#Strip register numbers
			jsonItem['transLocation'] = stripNums(jsonItem['transLocation'])

			#Sometimes fetching the cost/swipes fails...
			jsonItem['transCost'] = "Unknown"
			try:
				jsonItem['transCost'] = re.search(r'<td class="amount_points debit" title="debit">.*?<\/td>', item).group(0).replace('<td class="amount_points debit" title="debit">',"").replace('</td>',"").replace("- ", "")
			except:
				pass

			if jsonItem['transCost'] == "1":
				jsonItem['transCost'] = "One Swipe"

			#Add the JSON item to the array
			transactions.append(jsonItem)

		#Add the  array to the master dictionary (JSON object)
		userInfo['transactions'] = transactions

	else:
		#This should really never be triggered
		logger.warning("User with NetID hash: " + hashlib.sha256(user).hexdigest() + " has failed GET authentication negotiations")
		return

	#Logout
	shibboleth.logoutShibbolethService(get)
		
	#Return the data
	socket.write_message("[user_data_reply_get]" + json.dumps(userInfo))
	sessionManager.storeSessionValue(sessions, user, "get", userInfo)
	#socket.write_message("[user_data_reply_get]" + base64.b64encode(zlib.compress(json.dumps(userInfo),9)))