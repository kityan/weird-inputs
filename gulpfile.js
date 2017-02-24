var gulp = require('gulp'),
	connect = require('gulp-connect'),
	open = require('gulp-open'),
	del = require('del'),
	sourceMaps = require('gulp-sourcemaps'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	less = require('gulp-less'),
	gulpIf = require('gulp-if'),
	cleanCSS = require('gulp-clean-css'),
	replace = require('gulp-replace'),
	runSequence = require('run-sequence');


var mode = 'development';

// http://stackoverflow.com/questions/27253597/is-it-possible-to-assign-a-variable-in-a-gulp-task-before-running-dependencies

/*
gulp.task('set-production', function() {
  env = 'production';
});

var runSequence = require('run-sequence');
gulp.task('build', function(callback) {
  runSequence('set-production', ['scripts', 'styles', 'otherstuff'], callback);
});
*/


gulp.task('webserver', function () {
	connect.server({
		root: '.',
		livereload: true
	});
});

gulp.task('reload', ['copy', 'concatJS', 'concatCSS'], function () {
	return gulp.src(__filename, {read: false})
		.pipe(connect.reload());
});


gulp.task('clean', function (cb) {
	del.sync(['./dist/**/*']);
	cb();
});



gulp.task('copy', ['clean'], function () {
	return gulp.src([
		'./src/**/*.js',
		'!./src/lineChartInput.js'
	])
	.pipe(gulp.dest('./dist/'));
});


gulp.task('watch', function () {
	gulp.watch('src/**/*.*', ['reload']);
});

gulp.task('concatJS',  function () {
	var files = [
		'./src/lineChartInput.js'
	];
	return gulp.src(files)
		.pipe(sourceMaps.init())	
		.pipe(concat('lineChartInput.js'))
		.on('error', swallowError)			
		.pipe(uglify())
		.on('error', swallowError)			
		.pipe(sourceMaps.write())
		.pipe(gulp.dest('./dist/'));		
});




gulp.task('concatCSS', function () {
	var files = [
		'./src/**.*'
	];
	return gulp.src(files)
		.pipe(gulpIf('**/*.less', less({}))) 
		.on('error', swallowError)			
		.pipe(sourceMaps.init())	
		.pipe(concat('lineChartInput.css'))
		.pipe(cleanCSS())
		.pipe(sourceMaps.write())
		.pipe(gulp.dest('./dist/'));
});

gulp.task('concatCSS_production', function () {
	var files = [
		'./src/**.*'
	];
	return gulp.src(files)
		.pipe(gulpIf('**/*.less', less({}))) 
		.on('error', swallowError)			
		.pipe(concat('lineChartInput.css'))
		.pipe(cleanCSS())
		.pipe(gulp.dest('./dist/'));
});

gulp.task('concatJS_production', function () {

	var files = [
		'./src/lineChartInput.js'
	];

	return gulp.src(files)
		.pipe(concat('lineChartInput.js'))
		.on('error', swallowError)			
		.pipe(uglify())
		.on('error', swallowError)			
		.pipe(gulp.dest('./dist/'));

});



gulp.task('devView', ['copy', 'concatJS', 'concatCSS', 'webserver', 'watch'], function(){
	return gulp.src(__filename, {read: false})
		.pipe(open({ uri: 'http://localhost:8080/demo/index.html', app: 'chrome' }));
});


// https://www.npmjs.com/package/run-sequence


function swallowError(error) {
	console.log(error.toString())
	this.emit('end')
}


gulp.task('default', function(callback) {
  runSequence('devView', callback);
});


// gulp.task('default', ['devView']);

gulp.task('production', ['clean', 'copy', 'concatCSS_production', 'concatJS_production']);

