var gulp = require('gulp');
var fs = require('fs');
var env = require('jsdom').env
var request = require('request');
var spreadsheetJsonUrl = 'https://spreadsheets.google.com/feeds/list/1HZUxbXVMdzPHRS-UrgOQP6yILPcUkTWAmR0nswDqxBw/od6/public/basic?alt=json';
var spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1HZUxbXVMdzPHRS-UrgOQP6yILPcUkTWAmR0nswDqxBw/pubhtml';

var base = {
	"headerTitle": "The Best<br /> of Canada",
	"headerDescription": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.<br /><br />Select categories",
	"categories": [
		{
			"id": 1,
			"text": "best to see",
			"icon": "eye"
		},
		{
			"id": 2,
			"text": "best to Eat",
			"icon": "cutlery"
		},
		{
			"id": 3,
			"text": "best to Do",
			"icon": "walk"
		}
	]
};


function parseResponse(data) {

	var tiles = [];

	env(data, function (errors, window) {
		var $ = require('jquery')(window);
		var $rows = $(data).find('table tbody tr');
		for (var i = 0; i < $rows.length; i++) {
			if(i > 1) {
				tiles.push( formatData($rows.eq(i).find('td')) );
			}
		}
		tiles[1].isBig = true;
		base.tiles = tiles;

		fs.writeFileSync('./src/data/data.json', JSON.stringify(base));
	});
}

function formatData($cells) {
	var obj = {};

	if($cells.eq(0).text()) { obj.name = $cells.eq(0).text(); }
	if($cells.eq(1).text()) { obj.date = $cells.eq(1).text(); }
	if($cells.eq(2).text()) { obj.description = $cells.eq(2).text(); }
	if($cells.eq(3).text() || $cells.eq(5).text()) {
		obj.links = [];

		if($cells.eq(3).text()) {
			obj.links.push({
				"text": $cells.eq(3).text(),
				"url": $cells.eq(4).text()
			});
		}

		if($cells.eq(5).text()) {
			obj.links.push({
				"text": $cells.eq(5).text(),
				"url": $cells.eq(6).text()
			});
		}
	}
	if($cells.eq(7).text()) { obj.location = $cells.eq(7).text(); }
	if($cells.eq(8).text()) { obj['location-marker-x'] = $cells.eq(8).text(); }
	if($cells.eq(9).text()) { obj['location-marker-y'] = $cells.eq(9).text(); }
	if($cells.eq(10).text()) { obj.categoryId = $cells.eq(10).text(); }
	if($cells.eq(11).text()) { obj.imgUrl = 'images/' + $cells.eq(11).text(); }
	if($cells.eq(12).text()) { obj.imgAlt = $cells.eq(12).text(); }
	if($cells.eq(13).text()) { obj.videoUrl = 'videos/' + $cells.eq(13).text(); }

	return obj;
}

gulp.task('createJson', function() {
	request(spreadsheetUrl, function (error, response, body) {
	if (!error && response.statusCode == 200) {
			parseResponse(body);
		}
	})

});

