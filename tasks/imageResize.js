var gulp = require('gulp');
var imageResize = require('gulp-image-resize');
var rename = require("gulp-rename");
var del = require('del');
var settings = require('../settings.js');
var sizes = settings.assetSizes.images;

gulp.task('imageResize', function () {

	del(['src/images/**', '!src/images']).then(function (paths) {
		console.log('Deleted files/folders:\n', paths.join('\n'));
	});

	for(var i=0; i<sizes.length; i++) {
		resize(sizes[i], 0.75);
		resize(sizes[i], 0.5, 2);
	}

});

function resize(size, quality, scalingFactor) {
	scalingFactor = scalingFactor || 1;

	var opts = {
		width: size * scalingFactor,
		height: size * scalingFactor,
		crop: true,
		upscale: false,
		quality: quality
	};

	if(scalingFactor === 1) {
		console.log('resizing: ' + size + 'px' );

		gulp.src('./original_assets/*.jpg')
			.pipe(imageResize(opts))
			.pipe(gulp.dest('src/images/' + size ));
	} else {
		console.log('resizing: ' + size + 'px @' + scalingFactor + 'x');

		gulp.src('./original_assets/*.jpg')
			.pipe(imageResize(opts))
			.pipe(rename({
				suffix: "@" + scalingFactor + "x",
			}))
  			.pipe(gulp.dest('src/images/' + size ));
	}
} 