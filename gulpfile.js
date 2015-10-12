var gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins')
var $ = gulpLoadPlugins();
var del = require('del');


gulp.task('connectDev', function() {
	$.connect.server({
		root: 'src',
		port: '5000',
		livereload: true
	});
});

gulp.task('connectDist', function() {
	$.connect.server({
		root: 'dist',
		port: '5001',
		livereload: true
	});
});

gulp.task('clean', del.bind(null, ['dist']));

gulp.task('sass', function () {
	gulp.src('./src/styles/main.scss')
		.pipe($.sourcemaps.init())
		.pipe($.sass().on('error', $.sass.logError))
		.pipe($.autoprefixer({browsers: ['last 2 versions', 'ie >= 9']}))
		.pipe($.sourcemaps.write())
		.pipe(gulp.dest('./dist/styles'))
		.pipe(gulp.dest('./src/styles'))
		.pipe($.connect.reload());
});

gulp.task('icons', function(){
	gulp.src('./src/icons/*.svg')
		.pipe(gulp.dest('./dist/icons'));
});

gulp.task('images', function () {
    return gulp.src('./src/images/*')
        .pipe($.imagemin({
            progressive: true
        }))
        .pipe(gulp.dest('./dist/images'));
});

gulp.task('json', function(){
	gulp.src('./src/data/*.json')
		.pipe(gulp.dest('./dist/data'));
});

gulp.task('html', function(){
	gulp.src('./src/*.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('bootjs', function(){
	gulp.src('./src/boot.js')
		.pipe(gulp.dest('./dist'));
});

gulp.task('requirejs', $.shell.task(['r.js -o build.js']))

gulp.task('scripts', ['requirejs'], function() {
	// gulp.src('./src/scripts/vendor/requirejs/require.js')
	// 	.pipe(gulp.dest('./dist/scripts/vendor/requirejs'));
});

gulp.task('build', ['clean'], function(){
	gulp.start(['html', 'icons', 'images', 'json', 'bootjs', 'sass', 'scripts']);
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
});

gulp.task('default', ['build', 'connectDist', 'connectDev', 'watch']);

