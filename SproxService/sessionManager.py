import json
import logger
import hashlib

def restoreSession(user, socket, sessions):
	socket.write_message("[session_restore]" + sessions[user])

def endSession(user, sessions, tokens):
	del sessions[user]
	del tokens[user]

def storeSessionValue(sessions, user, key, value):
	if user not in sessions:
		sessions[user] = "{}"

	userSession = json.loads(sessions[user])
	userSession[key] = value
	sessions[user] = json.dumps(userSession)

def manageSessions(sessions, tokens, timeout):
	if len(tokens) > 0:
		for session in tokens:
			print session
			if (datetime.datetime.now()-session['issued']) > timeout:
				endSession(session[user], sessions, tokens)
				logger.info('Ended user session for inactivity: ' + hashlib.sha256(session[user]).hexdigest())