from ghost import Ghost
from operator import itemgetter
import tornado.websocket
import json
import re
import datetime
import time
import random
import copy
import zlib
import base64
import gutil
import authFailure
import cacheManager
import hashlib
import uuid
import logger
import sessionManager

def spireDay(_next):
	day = datetime.datetime.today().weekday()

	if day == 6 and _next:
		day = 0
	elif _next:
		day += 1

	return ["Mo","Tu","We","Th","Fr","Sa","Su"][day]

#Spire time string to 4 characterer 24 hour timestamp
def calTfh(_time):
	tfh = [None] * 2
	time = _time.replace(_time.split(' ')[0], "").replace(" ","")
	start = time.split('-')[0]
	end = time.split('-')[1]

	if "AM" in start:
		tfh[0] = int(start.replace("AM","").replace(":",""))
	elif "PM" in start:
		tfh[0] = int(start.replace("PM", "").replace(":", ""))

		if tfh[0] < 1200: tfh[0] = tfh[0] + 1200
	
	if "AM" in end:
		tfh[1] = int(end.replace("AM", "").replace(":", ""))
	elif "PM" in end:
		tfh[1] = int(end.replace("PM", "").replace(":", ""))
	
	return tfh

def caltwelveh(_time):
	twelveh = [None] * 2
	time = _time.replace(_time.split(' ')[0], "").replace(" ","")
	start = time.split('-')[0]
	end = time.split('-')[1]
	start = start[0:-2] + " " + start[-2:]
	end = end[0:-2] + " " + end[-2:]
	twelveh[0] = start
	twelveh[1] = end	

	return twelveh


def spireSemester():
	month = int(datetime.datetime.now().strftime("%m"))
	year = datetime.datetime.now().strftime("%Y")
	season = ""

	if month <= 5 and month >= 1:
		season = "Spring"
	elif month <= 9 and month > 5:
		season = "Summer"
	elif month <= 12 and month > 9:
		season = "Fall"

	return season + " " + year

def logout(_spire):
	_spire.open("https://www.spire.umass.edu/psp/heproda/EMPLOYEE/HRMS/?cmd=logout")

def authOnSpireWebsite(user, passwd, socket, cstate, tokens, sessions):
	#Authenticate against Spire website
	spire = Ghost(download_images=False, wait_timeout=20)
	userInfo = {}

	#Open Spire and set the proper values
	spire.open("https://www.spire.umass.edu/psp/heproda/?cmd=login&languageCd=ENG")

	spire.set_field_value("#userid", user)
	spire.set_field_value("#pwd", passwd)

	#Wait until something loads (Either SC or login failure), if we don't wait Spire throws a (40,20) error
	spire.fire_on('form', 'submit', expect_loading=True)

	if not "Your User ID and/or Password are invalid." in spire.content:
		#Not really Spire's job, but keep it within an authblock for security
		socket.write_message("[cache_status]" + str(cacheManager.userCacheState(user)))
		socket.write_message("[uuid]" + tokens[user]['uuid'])

		#Set status
		socket.write_message("[auth_status]Fetching Student Center...")

		#Redirect to SC and scrape
		spire.open("https://www.spire.umass.edu/psc/heproda/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL?PortalActualURL=https%3a%2f%2fwww.spire.umass.edu%2fpsc%2fheproda%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL&PortalContentURL=https%3a%2f%2fwww.spire.umass.edu%2fpsc%2fheproda%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL&PortalContentProvider=HRMS&PortalCRefLabel=Student%20Center&PortalRegistryName=EMPLOYEE&PortalServletURI=https%3a%2f%2fwww.spire.umass.edu%2fpsp%2fheproda%2f&PortalURI=https%3a%2f%2fwww.spire.umass.edu%2fpsc%2fheproda%2f&PortalHostNode=HRMS&NoCrumbs=yes&PortalKeyStruct=yes")
		spire.wait_for_page_loaded()

		#School Address
		userInfo["schoolAddress"] = gutil.getDiv(spire, "DERIVED_SSS_SCL_SSS_LONGCHAR_1")

		#Home Address
		userInfo["homeAddress"] = gutil.getDiv(spire, "DERIVED_SSS_SCL_SSS_LONGCHAR_2")

		#Email
		userInfo["email"] = gutil.getDiv(spire, "DERIVED_SSS_SCL_EMAIL_ADDR")

		#Student Name
		userInfo["studentName"] = gutil.getDiv(spire, "DERIVED_SSS_SCL_TITLE1$78$").replace("'s Student Center", "")

		#Graduation Term
		userInfo["gradTerm"] = gutil.getDiv(spire, "UM_EXP_GRAD_TRM_DESCR")

		#Major
		userInfo["major"] = "Unknown"
		try:
			userInfo["major"] = re.search(r'is:<b>.*?</b>', gutil.getDiv(spire, "win0divUM_DERIVED_SS_UM_SSS_ADV_MSG").replace("\n","")).group(0).replace("is:<b> ","").replace("</b>","")
		except:
			logger.warning("Regex failed, could not capture student's major, maybe a double major?")
			
		#Schedule
		classes = []

		i = 0;
		while not gutil.getDiv(spire, "CLASS_NAME$span$" + str(i)) == "":
			
			newClass = {
						"name" : gutil.getDiv(spire, "CLASS_NAME$span$" + str(i)), 
						"time" : gutil.ssplit(gutil.getDiv(spire, "DERIVED_SSS_SCL_SSR_MTG_SCHED_LONG$" + str(i)), "\n", 0),
						"location" : gutil.ssplit(gutil.getDiv(spire, "DERIVED_SSS_SCL_SSR_MTG_SCHED_LONG$" + str(i)), "\n", 1)
					   }
			i += 1
			classes.append(newClass)

		#Sort all classes for the week
		userInfo["classesWeekly"] = {}
		
		for day in ["Su","Mo","Tu","We","Th","Fr","Sa"]:
			userInfo["classesWeekly"][day] = []
			for i in xrange(len(classes)):
				if day in classes[i]['time']:
					userInfo["classesWeekly"][day].append(copy.copy(classes[i]))

			for i in xrange(len(userInfo["classesWeekly"][day])):
				times = calTfh(userInfo["classesWeekly"][day][i]['time'])
				twelvetimes = caltwelveh(userInfo["classesWeekly"][day][i]['time'])
				userInfo["classesWeekly"][day][i]['tfh_s'] = times[0]
				userInfo["classesWeekly"][day][i]['tfh_e'] = times[1]
				userInfo["classesWeekly"][day][i]['th_s'] = twelvetimes[0]
				userInfo["classesWeekly"][day][i]['th_e'] = twelvetimes[1]

				userInfo["classesWeekly"][day][i]['time'] = userInfo["classesWeekly"][day][i]['time'].replace(userInfo["classesWeekly"][day][i]['time'].split(' ')[0], "");

			userInfo["classesWeekly"][day] = sorted(userInfo["classesWeekly"][day], key=itemgetter('tfh_s'))

		#Switch to the Bill Pay page#
		#############################

		#Set status
		socket.write_message("[auth_status]Fetching Spire ID...")

		spire.open("https://www.spire.umass.edu/psc/heproda/EMPLOYEE/HRMS/c/UM_STUDENT_FINANCIALS.UM_QUICKPAY.GBL?FolderPath=PORTAL_ROOT_OBJECT.HCCC_FINANCES.UM_QUICKPAY_GBL&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder")
		spire.wait_for_page_loaded()

		#Spire ID
		userInfo["spireId"] = gutil.getDiv(spire, "SS_FA_AID_SRCH_EMPLID")

		#Switch to the Housing page#
		############################

		#Set status
		socket.write_message("[auth_status]Fetching Housing...")

		spire.open("https://www.spire.umass.edu/psc/heproda/EMPLOYEE/HRMS/c/UM_H_SELF_SERVICE.UM_H_SS_ASNNOTIF.GBL?FolderPath=PORTAL_ROOT_OBJECT.HOUSING.UM_H_SS_ASNNOTIF_GBL&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder")
		spire.wait_for_page_loaded()

		#Mailbox Combination
		userInfo["mailbox"] = gutil.getDiv(spire, "UM_H_DRV_ASN_NT_UMH_BOX_CD")

		#Building 
		userInfo["building"] = gutil.getDiv(spire, "UM_H_BLDG_DESCR")

		#Room 
		userInfo["room"] = gutil.getDiv(spire, "UM_H_DRV_ASN_NT_UMH_ROOM")

		#Room Type 
		userInfo["roomType"] = gutil.getDiv(spire, "UM_H_DRV_ASN_NT_UMH_ROOM_TYPE")

		#Room Phone
		userInfo["roomPhone"] = gutil.getDiv(spire, "UM_H_DRV_ASN_NT_PHONE")

		#Roomate 
		userInfo["roomate"] = gutil.ssplit(gutil.getDiv(spire, "HCR_PERSON_NM_I_NAME$0"),  ',', 1) + " " + gutil.ssplit(gutil.getDiv(spire, "HCR_PERSON_NM_I_NAME$0"), ',', 0)

		#Roomate Address 
		userInfo["roomateAddress"] = gutil.getDiv(spire, "UM_H_RMMT_ADRVW_ADDRESS1$0") + ", " + gutil.getDiv(spire, "UM_H_RMMT_ADRVW_CITY$0") + " " + gutil.getDiv(spire, "UM_H_RMMT_ADRVW_STATE$0") + " " + gutil.getDiv(spire, "UM_H_RMMT_ADRVW_POSTAL$0")

		#Roomate Email
		userInfo["roomateEmail"] = gutil.getDiv(spire, "UM_H_ASNOTEM_VW_EMAIL_ADDR$0")

		#Student Fullname
		userInfo["studentFullname"] = gutil.getDiv(spire, "UM_H_DRV_ASN_NT_PERSON_NAME")

		#Switch to the UCard page#
		############################

		#Set status
		socket.write_message("[auth_status]Fetching UCard...")

		spire.open("https://www.spire.umass.edu/psc/heproda/EMPLOYEE/HRMS/c/UM_SELF_SERVICE.UM_LIB_BARCODE.GBL?FolderPath=PORTAL_ROOT_OBJECT.HCCC_PERS_PORTFOLIO.UM_LIB_BARCODE_GBL&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder")
		spire.wait_for_page_loaded()

		#Ucard Run Number 
		userInfo["ucardRunNumber"] = gutil.getDiv(spire, "UM_ISO_NBR_EFF_UM_ISO_NUMBER$0")
		userInfo["ucardLibraryBarcode"] = gutil.getDiv(spire, "UM_DRV_SS_LIBRY_UM_BARCODE$0")

		#Switch to the Finals page#
		############################

		#Set status
		socket.write_message("[auth_status]Fetching Finals...")

		spire.open("https://www.spire.umass.edu/psc/heproda/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSR_SSENRL_EXAM_L.GBL")
		spire.wait_for_page_loaded()

		userInfo["finals"] = []

		if not "An exam schedule is not available for this term." in spire.content:
			if gutil.getDiv(spire, "CLASS_NAME$" + str(i)) == "":
				#Determine the index for the 'current' (er, um.. winter semester kind of doesn't happen) semester
				curSem = spireSemester()
				
				j = 0
				curSemIndex = 0
				while not gutil.getDiv(spire, "TERM_VAL$" + str(j)) == "":
					if curSem == gutil.getDiv(spire, "TERM_VAL$" + str(j)):
						curSemIndex = j

					j += 1
						
				#Select the appropriate buttons
				spire.evaluate("document.getElementById('SSR_DUMMY_RECV1$sels$" + str(curSemIndex) + "$$0').click();", expect_loading=False)
				spire.evaluate("document.getElementById('DERIVED_SSS_SCT_SSR_PB_GO').click();", expect_loading=False)

				#Wait for the (presumably) XHR requests to complete
				spire.wait_for_selector(".PSLEVEL1GRIDWBO")

			i = 0
			while not gutil.getDiv(spire, "CLASS_NAME$" + str(i)) == "":
				fDate = ["Mo","Tu","We","Th","Fr","Sa","Su"][datetime.datetime.strptime(gutil.getDiv(spire, "SS_EXAMSCH1_VW_EXAM_DT$" + str(i)), '%m/%d/%Y').weekday()]
				newFinal = {
							"name" : gutil.getDiv(spire, "CLASS_NAME$" + str(i)), 
							"description" : gutil.getDiv(spire, "DERIVED_REGFRM1_DESCR45$" + str(i)), 
							"location" : gutil.getDiv(spire, "DERIVED_REGFRM1_SSR_MTG_LOC_LONG$" + str(i)),
							"day" : fDate,
							"date" : gutil.getDiv(spire, "SS_EXAMSCH1_VW_EXAM_DT$" + str(i)),
							"time" : gutil.getDiv(spire, "DERIVED_REGFRM1_SSR_MTG_SCHED_LONG$" + str(i))
						   }
				i += 1
				userInfo["finals"].append(newFinal)

		if cstate == 1:
			cacheManager.setCacheForUserService(user, "spire", json.dumps(userInfo), passwd)

		#End our session
		logout(spire)
		spire.wait_for_page_loaded()
	else:
		logger.warning("[FAIL] User with NetID hash: " + hashlib.sha256(user).hexdigest() + " has failed Spire authentication negotiations")

		#Remove the token, they don't need it anymore
		del tokens[user]

		if authFailure.userFailedAuth(user) == 0:
			socket.write_message("[authentication_failure_blacklist]")
		else:
			socket.write_message("[authentication_failure]")

		return

	socket.write_message("[user_data_reply]" + json.dumps(userInfo))
	sessionManager.storeSessionValue(sessions, user, "spire", userInfo)

def authSpire(user, passwd, socket, tokens, sessions):
	cacheState = cacheManager.userCacheState(user)

	#Send the developer status
	socket.write_message("[dev]" + cacheManager.getDeveloperState(user, "spire"))
	
	#Generate a token
	tokens[user] = {'uuid' : str(uuid.uuid4()), 'issued' : datetime.datetime.now()}

	if cacheState == 2:
		cache = cacheManager.getCacheForUserService(user, "spire", passwd)
		if cache is None:
			#Failed to auth on the local data store, maybe the user changed the university password?
			cacheState = 1
			authOnSpireWebsite(user, passwd, socket, cacheState, tokens, sessions)
		else:
			socket.write_message("[cache_status]" + str(cacheState))
			socket.write_message("[uuid]" + tokens[user]['uuid'])
			socket.write_message("[user_data_reply]" + cache)
			sessionManager.storeSessionValue(sessions, user, "spire", cache)
	else:
		authOnSpireWebsite(user, passwd, socket, cacheState, tokens, sessions)