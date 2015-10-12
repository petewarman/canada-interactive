define([
	'jquery',
	'underscore',
	'packery',
	'bridget'
], function(
	$,
	_,
	Packery,
	bridget
) {
	'use strict';

	Packery.prototype.sortItems = function () {
		var $items = $(this.element).find(this.options.itemSelector),
			sortedItems = [],
			sourceOrder = 0,
			item;

		for (var i = 0, len = this.items.length; i < len; i++) {
			item = this.items[i];
			sourceOrder = $items.index( item.element );
			sortedItems[sourceOrder] = item;
		}

		this.items = sortedItems;
	}

	bridget( 'packery', Packery );

	var app = {

		"init": function(options) {

			var defaults = {
			};

			this.options = _.extend(defaults, options); 

			this.getElementRefs();
			this.setOrientation();
			this.setDimensions();
			this.initializePackery();
			this.addEventListeners();
		},

		"addEventListeners": function (){
			$(window).on('resize', _.debounce(this.onResize, 300));
			this.$catButtons.on('click', this.onCategoryButtonClick);
			this.$scrollRightButton.on('click', this.scrollRight);
			this.$scrollLeftButton.on('click', this.scrollLeft);
			$(document).on('keydown', this.options.interactiveContainerSelector, this.onKeyUp);
			this.$container.on('scroll', _.debounce(this.onScroll, 200));
		},

		"getElementRefs": function() {
			this.$tiles = $(this.options.tileSelector);
			this.$interactiveContainer = $(this.options.interactiveContainerSelector);
			this.$gallery = $(this.options.gallerySelector);
			this.$container = $(this.options.containerSelector);
			this.$header = $(this.options.headerSelector);
			this.$catButtons = $(this.options.catButtonSelector);
			this.$scrollRightButton = $(this.options.scrollRightButtonSelector);
			this.$scrollLeftButton = $(this.options.scrollLeftButtonSelector);
		},

		"onScroll": function() {
			if (this.orientation === 'portrait') { return; }

			var scrollLeft = this.$container.scrollLeft();

			if(scrollLeft <= 0) {
				this.$interactiveContainer.focus();
				this.$scrollLeftButton.addClass('is-inactive');
			} else {
				this.$scrollLeftButton.removeClass('is-inactive');
			}

			if(scrollLeft >= this.rightScrollBounds) {
				this.$interactiveContainer.focus();
				this.$scrollRightButton.addClass('is-inactive');
			} else {
				this.$scrollRightButton.removeClass('is-inactive');
			}
		},

		"onKeyUp": function(e) {
			if (e.which === 39) {
				this.scrollRight();
			}

			if (e.which === 37) {
				this.scrollLeft();
			}
		},

		"scrollRight": function() {
			if (this.orientation === 'portrait') { return; }

			this.$container.stop(true, false).animate({'scrollLeft': '+=' + (this.containerWidth * 2/3) + 'px'});
		},

		"scrollLeft": function() {
			if (this.orientation === 'portrait') { return; }

			this.$container.stop(true, false).animate({'scrollLeft': '-=' + (this.containerWidth * 2/3) + 'px'});
		},

		"determineOrientation": function() {
			this.winHeight = $(window).height();
			this.containerWidth = this.$container.width();

			return (this.winHeight > this.containerWidth) ? 'portrait' : 'landscape';
		},

		"getPackeryOptions": function() {
			var options = {
				"itemSelector": this.options.tileSelector,
				"gutter": this.options.gutter,
				"stamp": this.options.headerSelector,
				isInitLayout: false
			};

			if (this.orientation === 'landscape') {
				options.isHorizontal = true;
			}

			return options;
		},

		"initializePackery": function() {
			this.$gallery.packery(this.getPackeryOptions());
			this.$gallery.packery('on', 'layoutComplete', this.onLayoutComplete);
			this.$gallery.packery('on', 'fitComplete', this.onFitComplete);
			this.$gallery.packery();
			this.$gallery.on('click', this.options.tileSelector, this.onClick);
		},

		"onFitComplete": function() {
			this.scrollToTile(this.$tiles.filter('.is-selected'));
		},

		"onLayoutComplete": function() {
			this.$gallery.addClass('layout-complete');
			_.defer(this.setRightScrollBounds);
		},

		"scrollToTile": function($tile) {
			if (this.orientation === 'landscape' && $tile.length > 0) {
				this.$container.stop(true, false).animate({'scrollLeft': $tile.position().left - ((this.$container.width() - $tile.width()) / 2)})
			}
		},

		"destroyPackery": function() {
			this.$gallery.removeClass('layout-complete');
			this.$gallery.off( 'click', this.options.tileSelector, this.onClick);
			this.$gallery.packery('destroy');
		},

		"onResize": function() {
			var orientation = this.determineOrientation();

			if (this.orientation !== orientation) {
				this.setOrientation(orientation);
				this.onOrientationChange();
			}

			this.setDimensions();
			this.$gallery.packery();
		},

		"setOrientation": function(orientation) {
			this.orientation = orientation || this.determineOrientation();

			this.$gallery
				.removeClass('is-portrait is-landscape')
				.addClass('is-' + this.orientation);
		},

		"onOrientationChange": function() {
			this.destroyPackery();
			this.initializePackery();
		},

		"setDimensions": function() {
			var tilesPerAxis, //number of tiles per column or row
				bigTileRatio; //ratio of big tiles to small tiles

			if (this.orientation === 'landscape') {
				this.gallerySize = parseInt(this.winHeight - (this.options.gutter * 2), 10);

				if (this.options.landscapeMaxHeight) { 
					this.gallerySize = Math.min(this.gallerySize, this.options.landscapeMaxHeight); 
				}

			} else {
				this.gallerySize = parseInt(this.$gallery.width(), 10);
			}

			tilesPerAxis = (this.gallerySize > this.options.tilesPerAxisBreakPoint) ? 3 : 2;
			bigTileRatio = (this.gallerySize > this.options.tilesPerAxisBreakPoint) ? 2 : 1;

			this.tileSize = this.getTileSize(this.gallerySize, tilesPerAxis, this.options.gutter);
			this.bigTileSize = (this.tileSize * bigTileRatio) + (this.options.gutter * (bigTileRatio - 1));
			this.selectedTileSize = this.gallerySize;

			this.setGalleryDims();
			this.setTileDims();
			this.setHeaderDims();
		},

		"setTileDims": function () {
			this.setTileWidth(this.$tiles.filter('.is-selected'), this.selectedTileSize);
			this.setTileWidth(this.$tiles.not('.is-selected').not('.tile--big'), this.tileSize);
			this.setTileWidth(this.$tiles.not('.is-selected').filter('.tile--big'), this.bigTileSize);
		},

		"setRightScrollBounds": function() {
			this.rightScrollBounds = this.$gallery.outerWidth() - this.$container.width();
			this.onScroll();
		},

		"setHeaderDims": function() {
			if (this.orientation === 'landscape') {
				if (this.gallerySize > this.options.tilesPerAxisBreakPoint) {
					this.$header.width(this.tileSize).height(this.bigTileSize);
				} else {
					this.$header.width(this.tileSize).height((this.tileSize * 2) + this.options.gutter);
				}
			} else {
				this.$header.width('auto').height('auto');
			}
		},

		"setGalleryDims": function() {
			if (this.orientation === 'landscape') {
				this.$gallery.height(this.gallerySize);
			} else {
				this.$gallery.height('auto');
			}
		},

		"getTileSize": function(gallerySize, tilesPerAxis, gutter) {
			return parseInt((gallerySize - (gutter * (tilesPerAxis-1))) * (1 / tilesPerAxis), 10);
		},

		"onClick": function(event) {
			if (this.$tiles.hasClass('is-selected')) {
				this.deselectTile();
			} else {
				if (!$(event.currentTarget).hasClass('is-inactive')) {
					this.selectTile($(event.currentTarget));
				}
			}
		},

		"setTileWidth": function($tile, width) {
			$tile.width(width).height(width);
			$tile.find('.tile__img-holder').width(width).height(width);
		},

		"deselectTile": function() {
			this.$tiles.removeClass('is-selected');
			this.setTileWidth(this.$tiles.not('.tile--big'), this.tileSize);
			this.setTileWidth(this.$tiles.filter('.tile--big'), this.bigTileSize);
			this.$gallery.packery('sortItems');
			this.$gallery.packery();
		},

		"selectTile": function($tile) {
			var currColumn,
				targetOffset,
				$tileInner = $tile.children('.tile__img-holder');

			$tile.addClass('is-selected');

			this.setTileWidth($tile, this.selectedTileSize);

			if (this.orientation === 'landscape') {
				this.$gallery.packery('fit', $tile[0], $tile.position().left, 0);
			} else {
				this.$gallery.packery('fit', $tile[0], 0);
			}
			//this.$gallery.packery('sortItems');
			this.$gallery.packery();
		},

		"onCategoryButtonClick": function(event) {
			var $button = $(event.currentTarget);
			var selectedClasses = [];

			$button.toggleClass('is-selected');

			this.$catButtons.each(function(ind, catButton){
				var $catButton = $(catButton);

				if ($catButton.hasClass('is-selected')) {
					selectedClasses.push('.' + $catButton.attr('data-tile-class'));
				}
			});

			this.$tiles.removeClass('is-inactive');

			if (selectedClasses.length > 0) {
				this.$tiles.not(selectedClasses.join(', ')).addClass('is-inactive');
			}
		}

	};

	_.bindAll(app, 'init', 'onClick', 'onResize', 'onLayoutComplete', 'onCategoryButtonClick', 'scrollRight', 'scrollLeft', 'onKeyUp', 'onScroll', 'setRightScrollBounds', 'onFitComplete');

	return app;

})