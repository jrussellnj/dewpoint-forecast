const gulp = require('gulp');
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const rev = require('gulp-rev');
const revDel = require('rev-del');

// Sass compilation
sass.compiler = require('node-sass');

gulp.task('sass', function () {
  return gulp.src('css/site.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('css/compressed'));
});

gulp.task('sass:watch', function () {
  gulp.watch('css/*.scss', gulp.series('sass', 'revisioning'));
});

// Babel transpilation
gulp.task('babel', function() {
  return gulp.src('js/site.js')
    .pipe(babel({
      presets: [ '@babel/preset-react' ]
    }))
    .pipe(gulp.dest('js/compressed'))
});

gulp.task('babel:watch', function() {
  gulp.watch('./js/site.js', gulp.series('babel', 'revisioning'));
});

// Asset revisioning for cache-busting
gulp.task('revisioning', function() {
  return gulp.src([ 'css/compressed/site.css', 'js/compressed/site.js' ])
    .pipe(rev())
    .pipe(gulp.dest('assets'))
    .pipe(rev.manifest())
    .pipe(revDel({ dest: 'assets' }))
    .pipe(gulp.dest('assets'))
});

// The 'watch' task will watch both sass and babel and revision accordingly
gulp.task('watch', gulp.parallel('sass:watch', 'babel:watch'))
