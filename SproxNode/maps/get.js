module.exports = {
	entryURL : "https://get.cbord.com/umass/full/login.php",
	redirectsDone : ".date",
	authFailure: "Authentication Failed",
	valueClass : "balance",

	userTags : {
		"Student Debit Plan" : "debit",
		"UMass Dining Dollars" : "dd",
		"E Unlimited Plan" : "swipes",
		"Guest Meals" : "guests"
	},

	rowTypes : [
		"even",
		"odd"
	],

	transactionAttribs : {
		"date" : {	
			"mainElem" : "date_time",
			"time" : "time",
			"date" : "date"
		},
		"location" : "activity_details",
		"cost" : "amount_points",
		"swipe" : "- 1",
		"admin" : "Meal Plan Office",
		"admin2" : "Patronimport Location"
	},
};
