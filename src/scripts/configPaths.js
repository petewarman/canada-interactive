// Library paths
// If you want to use a new library, add it here.
require.config({
  shim: {
    underscore: {
      exports: '_'
    }
  },
  paths: {
    'jquery': '../vendor/jquery/dist/jquery',
    'underscore': '../vendor/underscore/underscore',
    'main': 'main',
    'app': 'app',
    'packery': '../vendor/packery/dist/packery.pkgd', 
    'bridget': '../vendor/jquery-bridget/jquery.bridget', 
    'hbs': '../vendor/require-handlebars-plugin/hbs'
  },
  hbs: { // optional
      'helpers': true,            // default: true
      'templateExtension': 'hbs', // default: 'hbs'
      'partialsUrl': ''           // default: ''
  }
});

