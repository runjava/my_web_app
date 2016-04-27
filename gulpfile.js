var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var wiredep = require('wiredep').stream;
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var series = require('stream-series');

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var INJECT_OPTS = {
      addRootSlash : false,
      relative     : true
};



gulp.task('wiredep', function(){
  return gulp.src(['src/index.html'])
  .pipe(wiredep())
  .pipe(gulp.dest('build'));
});

gulp.task('wiredep:js:dist', function(){
  return gulp.src(require('wiredep')().js)
    .pipe($.concat('vendor.js'))
    .pipe($.uglify())
    .pipe(gulp.dest('dist/scripts'));
});

gulp.task('wiredep:css:dist', function(){
   return gulp.src(require('wiredep')().css)
    .pipe($.concat('vendor.css'))
    .pipe($.csso())
    .pipe(gulp.dest('dist/styles'));
});

gulp.task('styles', function(){
  return gulp.src(['src/styles/styles.scss'])
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      precision: 10,
      errLogToConsole: true
    }))
    .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('build/styles'));
});

gulp.task('styles:dist', function(){
  return gulp.src('build/styles/styles.css')
    .pipe($.csso())
    .pipe(gulp.dest('dist/styles'));
});

gulp.task('scripts', function(){
  return gulp.src('src/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe(gulp.dest('build'));
});

gulp.task('scripts:dist', function(){
  return gulp.src(['build/**/*.js'])
    .pipe($.concat('app.js'))
    .pipe($.uglify())
    .pipe(gulp.dest('dist/scripts'));
});

gulp.task('inject', function(){
  var assets = gulp.src(['build/**/*.css', 'build/**/*.js']);

  return gulp.src(['build/index.html'])
    .pipe($.inject(assets, INJECT_OPTS))
    .pipe(gulp.dest('build'));
});

gulp.task('inject:dist', function(){
  var vendor = gulp.src(['dist/scripts/vendor.js', 'dist/styles/vendor.css']);
  var app = gulp.src(['dist/scripts/app.js', 'dist/styles/styles.css']);

  return gulp.src(['dist/index.html'])
    .pipe($.inject(series(vendor, app), INJECT_OPTS))
    .pipe($.minifyHtml())
    .pipe(gulp.dest('dist'));
});

gulp.task('copy', function(){
  return gulp.src(['src/**/*.*', '!src/**/*.scss', '!src/**/*.js', '!src/index.html'])
    .pipe(gulp.dest('build'));
});

gulp.task('copy:dist', function(){
  return gulp.src(['build/**/*.*','!build/**/*.css', '!build/**/*.js', '!build/index.html', 'src/index.html'])
    .pipe(gulp.dest('dist'));
});

gulp.task('fonts', function(){
  return  gulp.src(['bower_components/fontawesome/fonts/**/*.*'])
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('build', function(){
  runSequence(['styles', 'wiredep', 'scripts'], ['inject', 'copy']);
});

function serveCallback() {
   browserSync({
    server: ['build', './']
  });
}

gulp.task('serve', function(){
  runSequence(['styles', 'scripts', 'wiredep'], ['copy','inject'], serveCallback);
  gulp.watch(['src/**/*.html'], ['watch:html']);
  gulp.watch(['src/**/*.scss'], ['styles', reload]);
  gulp.watch(['src/**/*.js'], ['scripts', 'copy', reload]);
});

gulp.task('watch:html', function(){
  runSequence('wiredep', 'inject', reload);
});

function serveDistCallback() {
    browserSync({
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: ['dist']
  });
}

gulp.task('serve:dist', function(){
  runSequence(['styles', 'scripts'],'copy', [ 'wiredep:css:dist', 'wiredep:js:dist', 'styles:dist', 'scripts:dist','copy:dist', 'fonts'], 'inject:dist', serveDistCallback);
});
