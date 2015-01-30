import MySQLdb
import hashlib
import calendar

def sproxDB():
	db = MySQLdb.connect(host="localhost", user="root", passwd="7145a7dfd5a6cfad8cf7c2221590cc24567e171dc9c7bfb62", db="Sprox")
	db.autocommit(True)
	return db.cursor()

def userFailedAuth(user):
	#Return codes: 0 - blacklisted, 1 - Logged failure
	sdb = sproxDB()
	sdb.execute('SELECT * FROM authFailures WHERE username="' + hashlib.sha512(user).hexdigest() + '"')

	if int(sdb.rowcount) > 0:
		row = sdb.fetchone()
		if row[3] == 6:
			sdb.execute('INSERT INTO blacklist (username) VALUES("' + hashlib.sha512(user).hexdigest() + '")')
			return 0
		elif row[3] <= 5:
			if calendar.timegm(time.gmtime()) - int(row[2]) > 60*3:
				sdb.execute('UPDATE authFailures SET count=1 AND time="' + calendar.timegm(time.gmtime()) + '" WHERE username="' + hashlib.sha512(user).hexdigest() + '"')
				return 1
			else: 
				sdb.execute('UPDATE authFailures SET count=count+1 AND time="' + calendar.timegm(time.gmtime()) + '" WHERE username="' + hashlib.sha512(user).hexdigest() + '"')
			return 1

def isUserBlacklisted(user):
	sdb = sproxDB()
	sdb.execute('SELECT * FROM blacklist WHERE username="' + hashlib.sha512(user).hexdigest() + '"')

	if int(sdb.rowcount) > 0:
		return True
	else:
		return False