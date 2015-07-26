console.log('Loading a web page');
var page = require('webpage').create();
var url = "http://get.cbord.com/umass/full/login.php";
page.open(url, function (status) {
  console.log(status);
  //Page is loaded!
  phantom.exit();
});