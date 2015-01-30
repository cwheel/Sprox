import time

def log(mssg, suppress):
	_mssg = "[" + time.strftime("%m/%d/%Y %H:%M:%S") + "]" + mssg

	if not suppress: print _mssg

	with open("sprox.log", "a") as log:
		log.write(_mssg + "\n")

def debug(mssg):
	log(" DEBUG: " + mssg, False)

def info(mssg):
	log(" INFO: " + mssg, False)

def warning(mssg):
	log(" WARNING: " + mssg, False)

def error(mssg):
	log(" ERROR: " + mssg, False)

def critical(mssg):
	log(" CRITICAL: " + mssg, False)

def suppressed(mssg):
	log(" INFO: " + mssg, True)