// Load plugins
var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    minifyCSS = require('gulp-minify-css'),
    header = require('gulp-header'),
    concat = require('gulp-concat'),
    gutil = require('gulp-util'),
    notify = require('gulp-notify'),

    pkg = require('./package.json');

var banner = [
    '/**',
    ' * <%= pkg.name %> - <%= pkg.description %> - ' + gutil.date('dd/mm/yyyy HH:MM:ss'),
    ' * @version v<%= pkg.version %>',
    ' **/',
    ''].join('\n');

//------------------------------------------------------
// Minify JS files
//------------------------------------------------------
gulp.task('minify-js', function () {
    gulp
        .src([
            'src/django_ajax/dev/js/**/*.js'
        ])
        .pipe(concat(pkg.name + '.min.js'))
        .pipe(uglify())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('src/django_ajax/static/viking-fw/js/'));
});

gulp.task('scripts', function() {
    gulp
        .src([
            'src/django_ajax/dev/js/**/*.js'
        ])
        //.pipe(jshint())
        //.pipe(jshint.reporter(stylish))
        .pipe(concat(pkg.name + '.min.js'))
        .pipe(uglify())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('src/django_ajax/static/ajax-utilities/js/'));
});

//------------------------------------------------------
// Minify CSS files
//------------------------------------------------------
gulp.task('minify-css', function() {
    return gulp
        .src([
            'src/django_ajax/dev/css/**/*.css'
        ])
        .pipe(minifyCSS())
        .pipe(concat(pkg.name + '.min.css'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('src/django_ajax/static/ajax-utilities/css/'));
});

gulp.task('styles', function() {
    return gulp
        .src([
            'src/django_ajax/dev/css/**/*.css'
        ])
        .pipe(minifyCSS())
        .on('error', notify.onError({
            message: "Error: <%= error.message %>",
            title: "Error running something"
        }))
        .pipe(concat(pkg.name + '.min.css'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('src/django_ajax/static/ajax-utilities/css/'));
});


gulp.task('watch', function() {
    gulp.watch(['dev/js/**/*.js'], ['minify-js']);
    gulp.watch(['dev/css/**/*.css'], ['styles']);
});


//------------------------------------------------------
// General tasks to Gulp
//------------------------------------------------------
gulp.task('default', ['styles', 'scripts']);
