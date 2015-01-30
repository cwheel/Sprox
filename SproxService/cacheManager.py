import MySQLdb
import hashlib
import base64
import stats
import zlib
from SimpleAES import SimpleAES

def cacheDB():
	db = MySQLdb.connect(host="localhost", user="root", passwd="7145a7dfd5a6cfad8cf7c2221590cc24567e171dc9c7bfb62", db="Sprox")
	db.autocommit(True)
	return db.cursor()

def generateStorageKey(netid, password):
	skey = ""
	for char in netid:
		skey = hashlib.sha256(skey + password + char).hexdigest()
	return hashlib.sha512(skey).hexdigest()

def userRequestedCaching(netid):
	cdb = cacheDB()
	cdb.execute('INSERT INTO cacheRequests (username) VALUES("' + hashlib.sha512(netid).hexdigest() + '")')
	cdb.close()

def userRequestedNeverCaching(netid):
	cdb = cacheDB()
	cdb.execute('INSERT INTO neverCache (username) VALUES("' + hashlib.sha512(netid).hexdigest() + '")')
	cdb.close()

#0 - Not cached at the moment, 1 - Not cached but wants to be, 2- Cached and wanted to be, 3 - Don't promot for caching, ever again
def userCacheState(netid):
	cdb = cacheDB()
	cdb.execute('SELECT * FROM userCaches WHERE username="' + hashlib.sha512(netid).hexdigest() + '"')

	if int(cdb.rowcount) > 0:
		cdb.close()
		return 2
	else:
		cdb = cacheDB()
		cdb.execute('SELECT * FROM cacheRequests WHERE username="' + hashlib.sha512(netid).hexdigest() + '"')
		if int(cdb.rowcount) > 0:
			cdb.close()
			return 1
		else:
			cdb = cacheDB()
			cdb.execute('SELECT * FROM neverCache WHERE username="' + hashlib.sha512(netid).hexdigest() + '"')
			if int(cdb.rowcount) > 0:
				cdb.close()
				return 3
				
	return 0

def setCacheForUserService(netid, service, cache, password):
	cdb = cacheDB()
	cryptor = SimpleAES(generateStorageKey(netid, password))
	cdb.execute('SELECT * FROM userCaches WHERE username="' + hashlib.sha512(netid).hexdigest() + '" AND service="' + service + '"')
	if int(cdb.rowcount) > 0:
		cdb.close()
		cdb = cacheDB()
		cdb.execute('UPDATE userCaches SET cache="' + base64.b64encode(zlib.compress(cryptor.encrypt(cache),9)) + '" WHERE username="' + hashlib.sha512(netid).hexdigest() + '" AND service="' + service + '"')
		cdb.close()
	else:
		cdb.close()
		cdb = cacheDB()
		cdb.execute('INSERT INTO userCaches (username,service,cache) VALUES("' + hashlib.sha512(netid).hexdigest() + '","' + service + '","' + base64.b64encode(zlib.compress(cryptor.encrypt(cache),9)) + '")')
		cdb.close()

def getCacheForUserService(netid, service, password):
	stats.incrementCounter("caches_read")
	
	cdb = cacheDB()
	cryptor = SimpleAES(generateStorageKey(netid, password))
	cdb.execute('SELECT * FROM userCaches WHERE username="' + hashlib.sha512(netid).hexdigest() + '" AND service="' + service + '"')

	if int(cdb.rowcount) > 0:
		try:
			return cryptor.decrypt(zlib.decompress(base64.b64decode(str(cdb.fetchone()[3]))))
		except:
			return None
	else:
		return None

def getDeveloperState(netid, service):
	cdb = cacheDB()
	cdb.execute('SELECT * FROM userCaches WHERE username="' + hashlib.sha512(netid).hexdigest() + '" AND service="' + service + '"')

	if int(cdb.rowcount) > 0:
		return str(cdb.fetchone()[4])
	else:
		return "0"