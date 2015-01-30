from ghost import Ghost
import stats

def authShibbolethService(gh, p_url, netid, passwd):
	#Stats tracking
	stats.incrementCounter("shib_auths")

	#Request the auth page via the proper pointer url
	gh.open(p_url)
	gh.wait_for_page_loaded()

	#Fill out the generic Shibboleth login form for Umass
	gh.set_field_value("#netid_text", netid)
	gh.set_field_value("#password_text", passwd)

	#Submit and wait until we finish Shibboleth auth
	gh.fire_on('form', 'submit', expect_loading=True)

	#Wait for any future page to finish loading
	gh.wait_for_page_loaded()
	
	#Auth status
	if "Authentication Failed" in gh.content:
		return False
	else:
		return True

def logoutShibbolethService(gh):
	#Parking's was the first I found, any would work (i.e all Shibboleth)
	gh.open("https://parking.umass.edu/index.php/home/logout")