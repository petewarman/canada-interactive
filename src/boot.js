define( [], function () {

  'use strict';

  // Get paths for assets (css + js)
  var rootPath = isLocal() ? "" : "{{remote-root}}";

  function isLocal() {
    //return window.location.hostname === 'localhost'; 
    return true;
  }

  function addCSS( url ) {
    var head = document.querySelector( 'head' );
    var link = document.createElement( 'link' );
    link.setAttribute( 'rel', 'stylesheet' );
    link.setAttribute( 'type', 'text/css' );
    link.setAttribute( 'href', url );
    head.appendChild( link );
  }

  return {
    boot: function ( el, context, config, mediator ) {
      // Load CSS
      addCSS( rootPath + 'styles/main.css' );

      // Load main application
      require( [ rootPath + 'scripts/main.js'], function ( req ) {
        // Main app returns a almond instance of require to avoid
        // R2 / NGW inconsistencies.
        req( ['main'], function ( main ) {

          main.init( el, context, config, mediator );

        } );
      }, function ( err ) {
        console.error( 'Error loading boot.', err );
      } );
    }
  };
} );
