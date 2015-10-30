var gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins')
var $ = gulpLoadPlugins();
var del = require('del');
var fs = require('fs');
var settings = require('./settings.js');

var requireDir = require('require-dir');
requireDir('./tasks');

var options = {
	"env": "local"
};


gulp.task('connect', function() {
	$.connect.server({
		root: 'local-dist',
		port: '5000',
		livereload: false
	});
});

gulp.task('clean', del.bind(null, ['local-dist']));
gulp.task('clean-remote', del.bind(null, ['remote-dist']));

gulp.task('sass', function () {
	gulp.src('./src/styles/main.scss')
		.pipe($.sass().on('error', $.sass.logError))
		.pipe($.autoprefixer({browsers: ['last 2 versions', 'ie >= 9']}))
		.pipe($.replace("url(\"//", "url(\"http://"))
		.pipe($.replace("url(../", "url(" + settings.root[options.env]))
		.pipe($.minifyCss())
		.pipe(gulp.dest('./' + options.env + '-dist/styles'));
});

gulp.task('icons', function(){
	gulp.src('./src/icons/*')
		.pipe(gulp.dest('./' + options.env + '-dist/icons'));
});

gulp.task('images', function () {
	return gulp.src('./src/images/**')
		.pipe($.imagemin({
			progressive: true
		}))
		.pipe(gulp.dest('./' + options.env + '-dist/images'));
});

gulp.task('videos', function () {
	return gulp.src('./src/videos/**')
		.pipe(gulp.dest('./' + options.env + '-dist/videos'));
});

gulp.task('json', function(){
	gulp.src('./src/data/*.json')
		.pipe(gulp.dest('./' + options.env + '-dist/data'));
});

gulp.task('html', function(){
	gulp.src('./src/*.html')
		.pipe(gulp.dest('./' + options.env + '-dist'));
});

gulp.task('bootjs', function(){
	gulp.src('./src/boot.js')
		.pipe($.replace("{{rootPath}}", settings.root[options.env]))
		.pipe(gulp.dest('./' + options.env + '-dist'));
});

gulp.task('requirejs', function() {
	if(options.env === 'local') {
		gulp.start(['requirejs-local'])
	} else {
		gulp.start(['requirejs-remote']);
	}
});

gulp.task('requirejs-local', $.shell.task(['r.js -o build-local.js']));
gulp.task('requirejs-remote', $.shell.task(['r.js -o build-remote.js']));

gulp.task('scripts', ['requirejs'], function() {
	gulp.src('./src/vendor/requirejs/require.js')
		.pipe(gulp.dest('./' + options.env + '-dist/vendor/requirejs'));
});

gulp.task('build', ['clean'], function(){
	console.log('Clean up complete. Build ' + options.env);
	gulp.start(['html', 'icons', 'images', 'videos', 'json', 'bootjs', 'sass', 'scripts']);
});

gulp.task('build-remote', ['clean-remote'], function(){
	options.env = "remote";
	console.log('Clean up complete. Build ' + options.env);
	gulp.start(['html', 'icons', 'images', 'videos', 'json', 'bootjs', 'sass', 'scripts']);
});


gulp.task('watch', function () {
	gulp.watch(['./src/styles/*.scss'], ['sass']);
	gulp.watch(['./src/scripts/*.js'], ['scripts']);
	gulp.watch(['./src/*.html'], ['html']);
	gulp.watch(['./src/templates/*.hbs'], ['scripts']);
	gulp.watch(['./src/boot.js'], ['bootjs']);
	gulp.watch(['./src/data/*.json'], ['json']);
	gulp.watch(['./src/icons/*.svg'], ['icons']);
	gulp.watch(['./src/images/*'], ['images']);
	gulp.watch(['./src/videos/*'], ['videos']);
});


gulp.task('default', ['build', 'connect', 'watch']);
