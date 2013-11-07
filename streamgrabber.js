
var config = require('./common');
var net = require('net');
var fs = require('fs');
var stdio = require('console');
var path = require('path');

stdio.info(config.testDir);


var g_going_sessions = {};
var g_open_streams = {};


function next_file(user) {
	var user_dir = path.join(config.depository,user);
	try {
		var existingdir = fs.statSync(user_dir);
	} catch ( e ) {
		fs.mkdirSync(user_dir,0666);
	}

	var dater = new Date();
	var day = "_" + dater.getFullYear() + ":" + (dater.getMonth()+1) + ":" + dater.getDay() + ":" + dater.getHours() + ":" + dater.getMinutes()+ ":" + dater.getSeconds();

	var dfile_name = path.join( user_dir, "sesh" + day + ".strm" );
	var data_file = fs.createWriteStream(dfile_name);

	g_going_sessions[user] = dater;
	g_open_streams[user] = data_file;

	return(data_file);
}

var server = net.createServer(function (socket) {

    socket.once('data', function(data) {

		var defstring = data.toString('ascii',0,24);
		var defdata = defstring.split(':');

		var user = defdata[0];
		var password = defdata[1];

		var data_file = next_file(user);  // get a wrtie stream 
		socket.pipe(data_file);   /// just let the pipes do their thing.

		socket.on('data', function(data) {

			var userkey = user;
			var prev_date = g_going_sessions[userkey];

			var dater = new Date();

			var timelapse = (dater.getTime() - prev_date.getTime());
			var echostamp = "OK+-+" + timelapse;
			socket.write(echostamp + "\r\n");

			if ( timelapse > config.max_time_lapse ) {
				socket.write("OK+-+MAX+TIME+REACHED\r\n");
				//socket.end();
			}

			var tester = data.toString('ascii',0,4);
			if ( tester.substr(0,4) == "stop" ) {
				socket.end();
			}

		});
