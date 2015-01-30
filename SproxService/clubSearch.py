import MySQLdb
import json

def clubsDB():
	db = MySQLdb.connect(host="localhost", user="root", passwd="7145a7dfd5a6cfad8cf7c2221590cc24567e171dc9c7bfb62", db="Sprox")
	db.autocommit(True)
	return db.cursor()

def query(query, socket):
	results = {}

	cdb = clubsDB()
	cdb.execute('SELECT * FROM rsos WHERE organization LIKE "%' + query + '%"')

	#Attempt to decode the club description, many clubs have a weird obsession with using bizzare characters
	for result in cdb:
		desc = (result[2].decode('utf-8', 'ignore')[:200] + '...') if len(result[2].decode('utf-8', 'ignore')) > 200 else result[2].decode('utf-8', 'ignore')
		results[result[1]] = {'desc' : desc, 'url' : result[3]}
	
	cdb.close()
	socket.write_message("[club_search_reply]" + json.dumps(results))