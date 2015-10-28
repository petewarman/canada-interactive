var gulp = require('gulp');
var imageResize = require('gulp-image-resize');
var rename = require("gulp-rename");
var del = require('del');
var settings = require('../settings.js');
var sizes = settings.assetSizes.images;
var pixelDensities = settings.assetSizes.pixelDensities
var data = require('../src/data/data.json');

gulp.task('imageResize', function () {

	del(['src/images/**', '!src/images']);

	for(var j=0;j<data.tiles.length;j++) {
		for(var i=0; i<sizes.length; i++) {
			for(var k=0; k<pixelDensities.length; k++) {
				resize(data.tiles[j].img, sizes[i], Math.pow(0.75, pixelDensities[k]), pixelDensities[k]);
			}
		}
	}

});

function resize(file, size, quality, scalingFactor) {
	scalingFactor = scalingFactor || 1;

	var opts = {
		width: size * scalingFactor,
		height: size * scalingFactor,
		crop: true,
		upscale: false,
		quality: quality
	};

	if(scalingFactor === 1) {

		console.log('resizing '+ file + ' to: ' + size + 'px' );

		gulp.src('./original_assets/' + file)
			.pipe(imageResize(opts))
			.pipe(gulp.dest('src/images/' + size ));

	} else {

		console.log('resizing '+ file + ' to: ' + size + 'px @' + scalingFactor + 'x' );

		gulp.src('./original_assets/' + file)
			.pipe(imageResize(opts))
			.pipe(rename({
				suffix: "@" + scalingFactor + "x",
			}))
			.pipe(gulp.dest('src/images/' + size ));

	}
} 