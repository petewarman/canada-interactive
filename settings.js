module.exports = {
	"assetSizes": {
		"images": [750, 640, 480, 320, 240, 160, 100], //size in css reference pixels
		"pixelDensities": [1, 2],
		"videos": [1080, 720] //videos are not resized by gulp. This is just a list of the directories in /src/videos
	},
	"spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1HZUxbXVMdzPHRS-UrgOQP6yILPcUkTWAmR0nswDqxBw/pubhtml",
	"root": {
		"remote": "http://labs.theguardian.com/2015/oct/best-of-canada/",
		"local": "http://localhost:5000/"
	},
	"ui": {
		"tilesPerAxisBreakPoint": 500, //breakpoint between 2 rows or columns and 3 rows or columns
		"gutter": 10, //space between tiles
		"landscapeMaxHeight": 750 //max height of gallery in landscape view
	}
}
