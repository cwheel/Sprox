import MySQLdb
import json
import hashlib
import base64
import zlib
import config
from SimpleAES import SimpleAES

def notesDB():
	#Connect to the SAS DB
	db = MySQLdb.connect(host=config.sqlHost, user=config.sqlUser, passwd=config.sqlPassword, db=config.sqlDB)
	db.autocommit(True)
	return db.cursor()

def saveNote(netid, notebookSection, page, pageContents, socket):
	ndb = notesDB()

	#Get a cryptor (Security through obscurity! Technically the netid isn't really known so..... :) )
	cryptor = SimpleAES(hashlib.sha512(netid).hexdigest())

	#Select all pages that appear to be the same as the on we're saving
	ndb.execute('SELECT * FROM notes WHERE notebookSection="' + notebookSection + '" AND pageTitle="' + page + '" AND user="' + hashlib.sha512(netid).hexdigest() + '"')

	#Quick n' dirty.... (Fix some JS problems)
	if (notebookSection == "Sections"): return
	if (pageContents == "bnVsbA=="): return

	#Check if any rows (pages) came back
	if int(ndb.rowcount) > 0:
		#Close the DB connection from the initial search
		ndb.close()
		ndb = notesDB()

		#We found a page already, just update it's contents
		ndb.execute('UPDATE notes SET pageContents="' + base64.b64encode(zlib.compress(cryptor.encrypt(pageContents),9)) + '" WHERE notebookSection="' + notebookSection + '" AND user="' + hashlib.sha512(netid).hexdigest() + '" AND pageTitle="' + page + '"')
		ndb.close()
	else:
		#Close the DB connection from the initial search
		ndb.close()
		ndb = notesDB()

		#We didn't find any page yet, make a new one
		ndb.execute('INSERT INTO notes (user,notebookSection,pageTitle,pageContents) VALUES("' + hashlib.sha512(netid).hexdigest() + '", "' + notebookSection + '", "' + page + '", "' + base64.b64encode(zlib.compress(cryptor.encrypt(pageContents),9)) + '")')
		ndb.close()

	socket.write_message("[notes_save_reply][save_complete]");

def sharePage(netid, notebookPage, pageSection, withUser, intoSection):
	ndb = notesDB()

	#Get a cryptor for the share from user
	cryptorFrom = SimpleAES(hashlib.sha512(netid).hexdigest())

	#Get a cryptor for the share to user
	cryptorTo = SimpleAES(hashlib.sha512(withUser).hexdigest())

	#Check for page name collisions in withUsers notebook
	ndb.execute('SELECT * FROM notes WHERE notebookSection="' + intoSection + '" AND user="' + hashlib.sha512(withUser).hexdigest() + '" AND pageTitle="' + notebookPage + '"')
	
	appendPage = ""
	if (ndb.fetchone() != None):
		pageInc = 1
		found = True

		while found == True:
			ndb.close()
			ndb = notesDB()
			ndb.execute('SELECT * FROM notes WHERE notebookSection="' + intoSection + '" AND user="' + hashlib.sha512(withUser).hexdigest() + '" AND pageTitle="' + notebookPage + ' (' + str(pageInc) + ')' + '"')
			if (ndb.fetchone() == None):
				found = False
			pageInc = pageInc + 1

		appendPage = " (" + str(pageInc) + ")"
		
	ndb.close()
	ndb = notesDB()

	#Load the note to be shared
	ndb.execute('SELECT * FROM notes WHERE notebookSection="' + pageSection + '" AND user="' + hashlib.sha512(netid).hexdigest() + '" AND pageTitle="' + notebookPage + '"')

	#Decrypt its contents
	noteDec = cryptorFrom.decrypt(zlib.decompress(base64.b64decode(str(ndb.fetchone()[4]))))

	ndb.close()
	ndb = notesDB()

	#Encrypt the contents with the other users key and insert into the DB
	ndb.execute('INSERT INTO notes (user,sharedBy,notebookSection,pageTitle,pageContents) VALUES("' + hashlib.sha512(withUser).hexdigest() + '", "' + netid + '", "' + intoSection + '", "' + notebookPage + appendPage + '", "' + base64.b64encode(zlib.compress(cryptorTo.encrypt(noteDec),9)) + '")')
	ndb.close()

def sectionsForUser(netid, socket):
	ndb = notesDB()
	sections = ""
	
	#Get every page the user has
	ndb.execute('SELECT * FROM notes WHERE user="' + hashlib.sha512(netid).hexdigest() + '"')

	#Iterate over the pages and add each section
	for page in ndb:
		if page[2] not in sections and sections != "": sections = sections + "," + page[2]
		if page[2] not in sections: sections = page[2]
	
	#If we didn't find a user
	if sections == "": sections = "none"

	#Send the sections back to the user
	socket.write_message("[notes_sections_reply]" + sections)

def loadNotesPage(netid, notebookSection, page, socket):
	ndb = notesDB()

	#Get a cryptor (Security through obscurity! Technically the netid isn't really known so..... :) )
	cryptor = SimpleAES(hashlib.sha512(netid).hexdigest())

	#Select the exact note based on the query prams
	ndb.execute('SELECT * FROM notes WHERE notebookSection="' + notebookSection + '" AND user="' + hashlib.sha512(netid).hexdigest() + '" AND pageTitle="' + page + '"')

	#Send its contents back to the user
	#Encode it as JSON, it seems likely that some other property will be added to it at some point...
	socket.write_message("[notes_page_reply]" + json.dumps({"content" : cryptor.decrypt(zlib.decompress(base64.b64decode(str(ndb.fetchone()[4]))))}))

#Loads a skeleton layout of the notebook, no page contents are sent to save bandwidth
def loadNotesLayout(netid, socket):
	ndb = notesDB()
	notebookLayout = {}

	#Get every page the user has
	ndb.execute('SELECT * FROM notes WHERE user="' + hashlib.sha512(netid).hexdigest() + '"')

	for page in ndb:
		#If some pages section doesnt exist in our layout, add it as a new dict
		if page[2] not in notebookLayout: notebookLayout[page[2]] = {}

		#If some page doesn't exist in our layout, add it as a new k/v pair with a value of 'Loading...'
		if page[3] not in notebookLayout[page[2]]: notebookLayout[page[2]][page[3]] = "Loading..."

		#Add the section color
		if "color" not in notebookLayout[page[2]]: notebookLayout[page[2]]["color"] = page[6]
	
	#Encode the layout as a json object and send it to the user
	socket.write_message("[notes_layout_reply]" + json.dumps(notebookLayout))

def updateSectionColor(netid, section, color):
	ndb = notesDB()

	#Updates the color of every page in a specified section
	ndb.execute('UPDATE notes SET color="' + color + '" WHERE user="' + hashlib.sha512(netid).hexdigest() + '" AND notebookSection="' + section + '"')
	ndb.close()

def removeSection(netid, notebookSection):
	ndb = notesDB()

	#Delete the specified section
	ndb.execute('DELETE FROM notes WHERE notebookSection="' + notebookSection + '" AND user="' + hashlib.sha512(netid).hexdigest() + '"')
	ndb.close()

def renameSection(netid, notebookSectionOld, notebookSectionNew):
	ndb = notesDB()

	#Updates the name of every page in a specified section
	ndb.execute('UPDATE notes SET notebookSection="' + notebookSectionNew + '" WHERE user="' + hashlib.sha512(netid).hexdigest() + '" AND notebookSection="' + notebookSectionOld + '"')
	ndb.close()

def removeSectionPage(netid, notebookSection, page):
	ndb = notesDB()

	#Remove a page (from a section of course)
	ndb.execute('DELETE FROM notes WHERE user="' + hashlib.sha512(netid).hexdigest() + '" AND notebookSection="' + notebookSection + '" AND pageTitle="' + page + '"')
	ndb.close()