import MySQLdb
import hashlib
import calendar
import config

def sproxDB():
	db = MySQLdb.connect(host=config.sqlHost, user=config.sqlUser, passwd=config.sqlPassword, db=config.sqlDB)
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