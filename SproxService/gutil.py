from ghost import Ghost
import re

def getDiv(gh, _id):
	content = gh.evaluate('document.getElementById("' + _id + '").innerHTML')
	if content[0] == None: return ""
	return str(content[0].replace("<br>","").replace("</br>",""))

def ssplit(string, delimiter, index):
	if string == None:
		return ""
	
	splits = string.split(delimiter)
	if len(splits)-1 <  index:
		return ""
	else:
		return splits[index]