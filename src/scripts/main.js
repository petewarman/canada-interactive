define([
	'app',
	'hbs!../templates/gallery'
],function(
	app,
	template
){

	'use strict';

	var interactiveEl;
	var rootPath;

	function requestData() {
		$.getJSON(rootPath + 'data/data.json')
			.done(onDataLoaded)
			.fail(function(){
				console.log('failed to load data.json', arguments);
			});
	};

	function onDataLoaded(data) {
		data.rootPath = rootPath;

		$(interactiveEl).append(template(data));

		app.init({
			"interactiveEl": interactiveEl,
			"rootPath": rootPath,
			"tileSelector": ".tile",
			"tileImgHolderSelector": ".tile__img-holder",
			"gallerySelector": '.gallery',
			"containerSelector": ".gallery-container",
			"interactiveContainerSelector": ".interactive-container",
			"headerSelector": ".header",
			"catButtonSelector": ".header__category-button",
			"tileCollapseButtonSelector": ".tile__expander",
			"tileVideoControlSelector": ".tile__video-control",
			"scrollRightButtonSelector": ".gallery__next",
			"scrollLeftButtonSelector": ".gallery__prev",
			"resetButtonSelector": ".header__reset",
			"tilesPerAxisBreakPoint": data.ui.tilesPerAxisBreakPoint,
			"gutter": data.ui.gutter,
			"landscapeMaxHeight": data.ui.landscapeMaxHeight,
			"assetSizes": data.assetSizes
		});

		startTracking();
	};

	function startTracking(){
		window._satellite.pageBottom();
	}

	function init(el, root) {
		interactiveEl = el;
		rootPath = root;

		requestData();
	};

	return {
		init: init
	};

});