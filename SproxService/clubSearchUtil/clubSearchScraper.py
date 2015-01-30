from ghost import Ghost
import re
import os
import time
from HTMLParser import HTMLParser


page = 1
linkRe = re.compile(r'<a href="http://umassam.*?<\/a>', re.IGNORECASE)
pRe = re.compile(r'<p>.*?</p>', re.IGNORECASE)
sqlOutput = ""

class MLStripper(HTMLParser):
    def __init__(self):
        self.reset()
        self.fed = []
    def handle_data(self, d):
        self.fed.append(d)
    def get_data(self):
        return ''.join(self.fed)

def strip_tags(html):
    s = MLStripper()
    s.feed(html)
    return s.get_data()

def processPage():
	_sqlOutput = ""
	clubLinks = linkRe.findall(g.content.replace("\n","")) 
	for link in clubLinks:
		url = link.split('/">')[0].replace('<a href="',"")
		club = link.split('/">')[1].replace('</a>', "")
		print "Found Organization: " + club
		_sqlOutput = _sqlOutput + "INSERT INTO rsos (organization,description,url) VALUES(\"" + club + '","' + getDescription(url) + '","' + url + "\");\n"
		time.sleep(10)

	return _sqlOutput

def getDescription(url):
	url = url + "/about"
	g.open(url)
	g.wait_for_page_loaded()
	pTags = pRe.findall(g.content.replace("\n",""))
	return strip_tags(pTags[1])

g = Ghost(download_images=False, wait_timeout=20)
gpage = g.open("https://www.umass.edu/studentlife/involved/registered-student-organizations")
g.wait_for_page_loaded()

sqlOutput = sqlOutput + processPage()

gpage = g.open("https://www.umass.edu/studentlife/involved/registered-student-organizations")
while str(g.evaluate('String(document.getElementsByClassName("pager-next")[0])')[0]) != "undefined":
	print "Reading page: " + str(page)
	gpage = g.open("https://www.umass.edu/studentlife/involved/registered-student-organizations?page=" + str(page))
	g.wait_for_page_loaded()
	page = page + 1
	sqlOutput = sqlOutput + processPage()
	gpage = g.open("https://www.umass.edu/studentlife/involved/registered-student-organizations?page=" + str(page))

f = open("orgs.sql", "w")
f.write(sqlOutput.encode('utf8'))
f.close()