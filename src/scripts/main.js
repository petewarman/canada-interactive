define([
	'app',
	'hbs!../templates/gallery'
],function(
	app,
	template
){

	'use strict';

	var interactiveEl;

	function requestData() {
		$.getJSON('data/data.json')
			.done(onDataLoaded)
			.fail(function(){
				console.log('failed to load data.json', arguments);
			});
	};

	function onDataLoaded(data) {
		$(interactiveEl).append(template(data));

		app.init({
			"interactiveEl": interactiveEl,
			"tileSelector": ".tile",
			"tileImgHolderSelector": ".tile__img-holder",
			"gallerySelector": '.gallery',
			"containerSelector": ".gallery-container",
			"interactiveContainerSelector": ".interactive-container",
			"headerSelector": ".header",
			"catButtonSelector": ".header__category-button",
			"tileCollapseButtonSelector": ".tile__expander",
			"scrollRightButtonSelector": ".gallery__next",
			"scrollLeftButtonSelector": ".gallery__prev",
			"tilesPerAxisBreakPoint": 500,
			"gutter": 10,
			"landscapeMaxHeight": 750
		});
	};

	function init(el) {
		interactiveEl = el;
		requestData();
	};

	return {
		init: init
	};

});