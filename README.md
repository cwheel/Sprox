##Sprox##

**Sprox you say?**

Indeed, Sprox! What is it you might ask? Well, Sprox is an experiment in web scraping, data aggregation and UI/UX. Sprox was built as a proof of a concept replacement for our Universities student information system (SIS). While not production worthy (Not its goal) Sprox works quite well in doing its job (However with different users your milage may vary...). Sprox can pull housing and parking information, class schedules, university maps, UCard funds and can even act as an all in one notebook.

Sprox is built atop the M.E.A.N stack. Before M.E.A.N Sprox was built in Python, and for short time prior to that even C#. With every iteration Sprox has become increasingly stable. However, Sprox will never be 100% stable and therefore will need additional customization on a per user basis for day to day use (At the moment, I am using Sprox daily however it was built with my account details in mind).

What is the source of Sprox's data? As there are no official API's for accessing data, Sprox acquires it's data using a headless browser run from the Phantom/Casper/Spooky stack. While complex to setup and get just right, it does work quite well overall. On the note of stability, we ask that those choosing to run Sprox do so locally or with a whitelist for only themselves.

**Installing**

 1. Clone the repository
 2. In the Sprox directory, run `npm install`
 3. Install Phantom and Casper with `npm install -g phantomjs casperjs`
 4. Install Grunt with `npm install -g grunt grunt-cli`
 4. Install mitmproxy with `pip install mitmproxy` (Used to pass TLS connections in the interm until a Phantom and Casper update. PhantomJS only speaks TLS 1.0 at the moment and some services are not too fond of that.)
 5. If running OS X, you'll need to update Pythons OpenSSL library to enable mitmproxy to handle TLS 1.2 connections. Run `pip install pyopenssl --upgrade` to update it.
 
Run `grunt` to start Sprox. Open `localhost:3000` in a browser and login with your NetID and password.
