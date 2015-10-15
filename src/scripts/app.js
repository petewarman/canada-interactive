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

	Packery.Item.prototype.positionPlaceRect = function( x, y, isMaxOpen ) {
		this.placeRect.x = this.getPlaceRectCoord( x, true, isMaxOpen );
		this.placeRect.y = this.getPlaceRectCoord( y, false, isMaxOpen );
	};

	bridget( 'packery', Packery );

	var app = {

		"init": function(options) {

			var defaults = {};

			this.options = _.extend(defaults, options); 

			this.getElementRefs();
			this.setOrientation();
			this.setDimensions();
			this.initializePackery();
			this.setScrollButtonStates();
			this.addEventListeners();
		},

		"addEventListeners": function (){
			$(window).on('resize', _.debounce(this.onResize, 300));
			this.$catButtons.on('click', this.onCategoryButtonClick);
			this.$scrollRightButton.on('click', this.scrollRight);
			this.$scrollLeftButton.on('click', this.scrollLeft);
			$(document).on('keydown', this.options.interactiveContainerSelector, this.onKeyUp);
			this.$tileImgHolders.on('transitionend', _.debounce(this.onTileTransitionend, 200))
			this.$gallery.on('transitionend', this.onGalleryTransitionend);
		},

	/* Event Handlers */

		"onTileTransitionend": function (e) {
			if($(e.target).hasClass(this.options.tileImgHolderClass)) {
				this.$tiles.not('.is-selected').removeClass('is-enlarged');
				_.defer(this.setScrollButtonStates);
			}
		},

		"onGalleryTransitionend": function(e) {
			if(e.target === this.$gallery.get(0)) {
				this.setScrollButtonStates();
			}
		},

		"onLayoutComplete": function() {
			this.$gallery.addClass('layout-complete');
		},

		"onResize": function() {
			var orientation = this.determineOrientation();

			if (this.orientation !== orientation) {
				this.setOrientation(orientation);
				this.onOrientationChange();
			}

			this.setDimensions();
			this.$gallery.packery();
			_.defer(this.checkGalleryOffset);
		},

		"onOrientationChange": function() {
			this.destroyPackery();
			this.initializePackery();
		},

		"onTileClick": function(event) {
			var $tile = $(event.currentTarget);

			if($tile.hasClass('is-selected')) {
				this.tryToPlayOrPauseTileVideo($tile);
				return;
			} else if (this.$tiles.hasClass('is-selected')) {
				this.tryToPauseTileVideo(this.$tiles.filter('.is-selected'));
				this.deselectTile();
			} else {
				if (!$tile.hasClass('is-inactive')) {
					this.selectTile($tile);
				}
			}
			this.scrollToTile($tile);
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
		},

		"onKeyUp": function(e) {
			if (e.which === 39) {
				this.scrollRight();
			}

			if (e.which === 37) {
				this.scrollLeft();
			}
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
			this.$tileImgHolders = $('.' + this.options.tileImgHolderClass);
		},

		"setScrollButtonStates": function() {
			var bounds = this.getGalleryOffsetBounds();
			var offset = this.getCurrGalleryOffset();

			if(offset >= bounds.upper) {
				this.$interactiveContainer.focus();
				this.$scrollLeftButton.addClass('is-inactive');
			} else {
				this.$scrollLeftButton.removeClass('is-inactive');
			}

			if (offset <= bounds.lower) {
				this.$interactiveContainer.focus();
				this.$scrollRightButton.addClass('is-inactive');
			} else {
				this.$scrollRightButton.removeClass('is-inactive');
			}
		},

		"getCurrGalleryOffset": function() {
			return this.$gallery.data('offset') || 0;
		},

		"getGalleryOffsetBounds": function() {
			return {
				"upper": 0,
				"lower": this.$container.width() - this.$gallery.outerWidth()
			};
		},

		"constrainGalleryOffset": function(offset) {
			var bounds = this.getGalleryOffsetBounds();

			return Math.min(bounds.upper, Math.max(bounds.lower, offset));
		},

		"scrollTo": function(offset) {
			//this.$gallery.css({'left': this.constrainGalleryOffset(offset) + 'px'});
			var newOffset = this.constrainGalleryOffset(offset);
			this.$gallery.css({'transform': 'translateX(' + newOffset + 'px)'}).data('offset', newOffset);
		},

		"scrollRight": function() {
			if (this.orientation === 'portrait') { return; }

			var currOffset = this.getCurrGalleryOffset(),
				decrement = this.containerWidth * 2/3;

			this.scrollTo(currOffset - decrement);
		},

		"scrollLeft": function() {
			if (this.orientation === 'portrait') { return; }

			var currOffset = this.getCurrGalleryOffset(),
				increment = this.containerWidth * 2/3;

			this.scrollTo(currOffset + increment);
		},

		"scrollToTile": function($tile) {
			if (this.orientation === 'landscape' && $tile.length > 0) {
				this.scrollTo(($tile.position().left * -1) + ((this.$container.width() - $tile.width()) / 2));
			} else {
				$('html, body').stop(true, false).animate({'scrollTop': $tile.offset().top - ((this.winHeight - $tile.width()) / 2)}, 400, 'linear');
			}
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
			//this.$gallery.packery();
			this.$gallery.on('click', this.options.tileSelector, this.onTileClick);
			this.$gallery.packery();
		},

		"destroyPackery": function() {
			this.$gallery.removeClass('layout-complete');
			this.$gallery.off( 'click', this.options.tileSelector, this.onTileClick);
			this.$gallery.packery('destroy');
		},

		"checkGalleryOffset": function() {
			var offset = this.getCurrGalleryOffset(),
				newOffset = this.constrainGalleryOffset(offset);

			if(offset !== newOffset) {
				this.scrollTo(newOffset);
			} else {
				this.setScrollButtonStates();
			}
		},

		"setOrientation": function(orientation) {
			this.orientation = orientation || this.determineOrientation();

			this.$interactiveContainer
				.removeClass('is-portrait is-landscape')
				.addClass('is-' + this.orientation);
		},

		"setDimensions": function() {
			if (this.orientation === 'landscape') {
				this.gallerySize = parseInt(this.winHeight - (this.options.gutter * 2), 10);

				if (this.options.landscapeMaxHeight) { 
					this.gallerySize = Math.min(this.gallerySize, this.options.landscapeMaxHeight); 
				}

			} else {
				this.gallerySize = parseInt(this.$gallery.width(), 10);
			}

			this.tilesPerAxis = (this.gallerySize > this.options.tilesPerAxisBreakPoint) ? 3 : 2; //number of tiles per column or row
			this.bigTileRatio = (this.gallerySize > this.options.tilesPerAxisBreakPoint) ? 2 : 1; //ratio of big tiles to small tiles

			this.$container.removeClass('tiles-per-axis-2 tiles-per-axis-3').addClass('tiles-per-axis-' + this.tilesPerAxis);

			this.tileSize = this.getTileSize(this.gallerySize, this.tilesPerAxis, this.options.gutter);
			this.bigTileSize = (this.tileSize * this.bigTileRatio) + (this.options.gutter * (this.bigTileRatio - 1));
			this.selectedTileSize = this.gallerySize;

			this.setGalleryDims();
			this.setTileDims();
			this.setHeaderDims();
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
			var minTilesPerRow,
				minGalleryWidth,
				currGalleryWidth;

			if (this.orientation === 'landscape') {
				this.$gallery.height(this.gallerySize);
				if (this.gallerySize > this.options.tilesPerAxisBreakPoint) {
					minTilesPerRow = Math.ceil((this.$tiles.length + 5) / 3) + 2;
				} else {
					minTilesPerRow = Math.ceil((this.$tiles.length + 2) / 2) + 1;
				}

				minGalleryWidth = minTilesPerRow * this.tileSize + (minTilesPerRow - 1) * this.gutter;

				currGalleryWidth = this.$gallery.width();
				if(currGalleryWidth < minGalleryWidth) {
					this.$gallery.width(minGalleryWidth);
				}
			} else {
				this.$gallery.height('auto');
			}
		},

		"setTileDims": function () {
			this.setTileWidth(this.$tiles.filter('.is-selected'), this.selectedTileSize);
			this.setTileWidth(this.$tiles.not('.is-selected').not('.tile--big'), this.tileSize);
			this.setTileWidth(this.$tiles.not('.is-selected').filter('.tile--big'), this.bigTileSize);
		},

		"getTileSize": function(gallerySize, tilesPerAxis, gutter) {
			return parseInt((gallerySize - (gutter * (tilesPerAxis-1))) * (1 / tilesPerAxis), 10);
		},

		"setTileWidth": function($tile, width) {
			$tile.width(width).height(width);
			$tile.find('.' + this.options.tileImgHolderClass).width(width).height(width);
		},

		"deselectTile": function() {
			this.$gallery.removeClass('has-selected');
			this.$tiles.removeClass('is-selected');
			this.setTileWidth(this.$tiles.not('.tile--big'), this.tileSize);
			this.setTileWidth(this.$tiles.filter('.tile--big'), this.bigTileSize);
			this.$gallery.packery('sortItems');
			this.$gallery.packery();
		},

		"selectTile": function($tile) {
			var currColumn,
				targetOffset,
				tilePos = $tile.position();

			this.$gallery.addClass('has-selected');
			$tile.addClass('is-selected').addClass('is-enlarged');
			$tile.removeClass('is-row-1 is-row-2 is-row-3 is-col-1 is-col-2 is-col-3');

			this.setTileWidth($tile, this.selectedTileSize);

			if (this.orientation === 'landscape') {
				if(tilePos.top === 0) {
					$tile.addClass('is-row-1');
				} else if(tilePos.top === this.tileSize + this.options.gutter) {
					$tile.addClass('is-row-2');
				} else {
					$tile.addClass('is-row-3');
				}

				this.$gallery.packery('fit', $tile[0], tilePos.left, 0);

			} else {
				if(tilePos.left === 0) {
					$tile.addClass('is-col-1');
				} else if(tilePos.left === this.tileSize + this.options.gutter) {
					$tile.addClass('is-col-2');
				} else {
					$tile.addClass('is-col-3');
				}
				this.$gallery.packery('fit', $tile[0], 0);
			}
			//this.$gallery.packery('sortItems');
			this.$gallery.packery();
			this.tryToPlayTileVideo($tile);
		},

		"tryToPlayOrPauseTileVideo": function($tile) {
			var $video = $tile.find('video'),
				vidEl;

			if($video.length > 0) { 
				vidEl = $video.get(0);

				if(vidEl.paused) {
					this.tryToPlayTileVideo($tile);
				} else {
					this.tryToPauseTileVideo($tile);
				}
			}
		},

		"tryToPlayTileVideo": function($tile) {
			var $video = $tile.find('video');

			if($video.length > 0) { 
				$video.get(0).play();
				$tile.addClass('is-playing');
				$video.one('pause ended', function() {
					$tile.removeClass('is-playing');
				});
			}
		},

		"tryToPauseTileVideo": function($tile) {
			var $video = $tile.find('video');

			if($video.length > 0) { 
				$video.get(0).pause();
				//$tile.removeClass('is-playing');
			}
		}

	};

	_.bindAll(app, 'init', 'onTileClick', 'onResize', 'onLayoutComplete', 'onCategoryButtonClick', 'scrollRight', 'scrollLeft', 'onKeyUp', 'onTileTransitionend', 'onGalleryTransitionend', 'scrollTo', 'setScrollButtonStates', 'checkGalleryOffset');

	return app;

})