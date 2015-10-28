var gulp = require('gulp');
var fs = require('fs');
var env = require('jsdom').env
var request = require('request');
var settings = require('../settings.js');
var spreadsheetUrl = settings.spreadsheetUrl;
//'https://docs.google.com/spreadsheets/d/1HZUxbXVMdzPHRS-UrgOQP6yILPcUkTWAmR0nswDqxBw/pubhtml';

var base = {
	"assetSizes": settings.assetSizes,
	"ui": settings.ui
};

function parseResponse(data) {

	var tiles = [];
	var cats = [];

	env(data, function (errors, window) {
		var $ = require('jquery')(window);
		var $tileRows = $(data).find('table:first tbody tr');
		var $catRows = $(data).find('table:eq(1) tbody tr');
		for (var i = 0; i < $tileRows.length; i++) {
			if(i > 1) {
				var tile = formatTileData($tileRows.eq(i).find('td'));
				if(tile.img && tile.categoryId) {
					tiles.push(tile);
				}
			}
		}

		for (var i = 0; i < $catRows.length; i++) {
			if(i > 0) {
				cats.push( formatCatData($catRows.eq(i).find('td')) );
			}
		}

		//make first tile big
		tiles[0].isBig = true;

		base.tiles = tiles;
		base.categories = cats;

		fs.writeFileSync('./src/data/data.json', JSON.stringify(base));
	});
}

function formatCatData($cells) {
	var obj = {};

	if($cells.eq(0).text()) { obj.id = $cells.eq(0).text(); }
	if($cells.eq(1).text()) { obj.text = $cells.eq(1).text(); }
	if($cells.eq(2).text()) { obj.icon = $cells.eq(2).text(); }

	return obj;

}

function formatTileData($cells) {
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
	if($cells.eq(11).text()) { obj.img = $cells.eq(11).text(); }
	if($cells.eq(12).text()) { obj.imgAlt = $cells.eq(12).text(); }
	if($cells.eq(13).text()) { obj.video = $cells.eq(13).text(); }

	return obj;
}

gulp.task('createJson', function() {
	request(spreadsheetUrl, function (error, response, body) {
	if (!error && response.statusCode == 200) {
			parseResponse(body);
		}
	})

});

