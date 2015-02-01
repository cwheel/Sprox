import MySQLdb
import json
import config

def clubsDB():
	db = MySQLdb.connect(host=config.sqlHost, user=config.sqlUser, passwd=config.sqlPassword, db=config.sqlDB)
	db.autocommit(True)
	return db.cursor()

def query(user, query, socket):
	results = {}

	cdb = clubsDB()
	cdb.execute('SELECT * FROM rsos WHERE organization LIKE "%' + query + '%"')

	#Attempt to decode the club description, many clubs have a weird obsession with using bizzare characters
	for result in cdb:
		desc = (result[2].decode('utf-8', 'ignore')[:200] + '...') if len(result[2].decode('utf-8', 'ignore')) > 200 else result[2].decode('utf-8', 'ignore')
		results[result[1]] = {'desc' : desc, 'url' : result[3]}
	
	cdb.close()
	socket.write_message("[club_search_reply]" + json.dumps(results))