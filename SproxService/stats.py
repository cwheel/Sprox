import MySQLdb
import json

def statsDB():
	#Connect to the SAS DB
	db = MySQLdb.connect(host="localhost", user="root", passwd="7145a7dfd5a6cfad8cf7c2221590cc24567e171dc9c7bfb62", db="Sprox")
	db.autocommit(True)
	return db.cursor()

def incrementCounter(counterKey):
	sdb = statsDB()
	sdb.execute('SELECT * FROM stats WHERE skey="' + counterKey + '"')

	#Check if any rows (counters) came back
	if int(sdb.rowcount) > 0:
		#Close the DB connection from the initial search
		sdb.close()
		sdb = statsDB()

		#We found a counter already, just increment its value
		sdb.execute('UPDATE stats SET value=value+1 WHERE skey="' + counterKey + '"')
		sdb.close()
	else:
		#Close the DB connection from the initial search
		sdb.close()
		sdb = statsDB()

		#We didn't find a counter yet, make a new one
		sdb.execute('INSERT INTO stats (skey,value) VALUES("' + counterKey + '", 1)')
		sdb.close()

def getCounter(statKey):
	sdb = statsDB()

	#Select the matching counter and return its value
	sdb.execute('SELECT * FROM stats WHERE skey="' + statKey + '"')
	return sdb.fetchone()[2]

def sendStats(socket):
	sdb = statsDB()
	sdb.execute('SELECT * FROM notes')

	stats = {'ssc' : getCounter("shib_auths"), 'sasc' : getCounter("spire_auths"), 'car' : getCounter("caches_read"), 'np' : str(int(sdb.rowcount))}
	socket.write_message("[sprox_statistics]" + json.dumps(stats))