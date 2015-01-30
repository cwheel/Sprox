#!/bin/bash

cd "$(dirname "$0")"

tput setf 2
tput bold
echo "Cleaning build target..."
tput sgr0

rm -rf $2
mkdir $2

tput setf 2
tput bold
echo "Copying build files..."
tput sgr0

cp -R $1/* $2

tput setf 2
tput bold
echo "Stripping un-minified code..."
tput sgr0

rm -rf $2/controllers
rm -rf $2/style
rm -f $2/*.js

tput setf 2
tput bold
echo "Stripping excess files..."
tput sgr0

rm -rf $2/stats
rm -r $2/sftp-config.json
rm -rf $2/build

tput setf 2
tput bold
echo "Compiling JS..."
tput sgr0

java -jar closure.jar --angular_pass --js $1/sprox.js $1/controllers/* config.js $1/idle.js --js_output_file $2/payload.js

tput setf 2
tput bold
echo "Compiling CSS..."
tput sgr0

STYLESHEETS=$1/style/*
for stylesheet in $STYLESHEETS
do
  	java -jar yui.jar $stylesheet >> $2/payload.css
done

tput setf 2
tput bold
echo "Patching required files..."
tput sgr0

cp index.html $2/index.html
cp 404.html $2/errors/404.html
cp 503.html $2/errors/503.html

if [ $3 = "--upload" ]; then
	tput setf 2
	tput bold
	echo "Sending to production server..."
	tput sgr0

	chmod 755 -R $2
	rsync -a  $2/* ladmin@sprox.net:/home/ladmin/frontend

	rsync -a  /media/cameron/SStore/Sprox/SproxService/*  ladmin@sprox.net:/home/ladmin
fi