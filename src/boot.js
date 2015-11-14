define( [], function () {

  'use strict';

  // Get paths for assets (css + js)
  var rootPath = "{{rootPath}}";

  function addCSS( url ) {
    var head = document.querySelector( 'head' );
    var link = document.createElement( 'link' );
    link.setAttribute( 'rel', 'stylesheet' );
    link.setAttribute( 'type', 'text/css' );
    link.setAttribute( 'href', url );
    head.appendChild( link );
  }

  function addTrackingScript() {
    var head = document.querySelector( 'head' );
    var script = document.createElement( 'script' );
    script.setAttribute( 'src', 'http://assets.adobedtm.com/4d9ab377f23d816bd320d12dce88aed259ed54d9/satelliteLib-6d8088bbff464992e5005a1d17e4628bae869938.js' );
    head.appendChild( script );
  }

  return {
    boot: function ( el, context, config, mediator ) {
      // Load CSS
      addCSS( rootPath + 'styles/main.css' );
      addTrackingScript();

      // Load main application
      require( [ rootPath + 'scripts/main.js'], function ( req ) {
        // Main app returns a almond instance of require to avoid
        // R2 / NGW inconsistencies.
        req( ['main'], function ( main ) {

          main.init( el, rootPath );

        } );
      }, function ( err ) {
        console.error( 'Error loading boot.', err );
      } );
    }
  };
} );
