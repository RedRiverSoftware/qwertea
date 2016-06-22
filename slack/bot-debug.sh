#!/bin/bash
log=`sudo forever logs | grep -Eo 'app.js (.*)' | awk '{print $2}'`
if [ "$log" == "" ]
then
	sudo ./bot.sh
	log=`sudo forever logs | grep -Eo 'app.js (.*)' | awk '{print $2}'`
	sudo sudo tail -f "$log"
else
	sudo tail -f "$log"
fi