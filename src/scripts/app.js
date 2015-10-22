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

	/* Set Up */

		"getElementRefs": function() {
			this.$tiles = $(this.options.tileSelector);
			this.$interactiveContainer = $(this.options.interactiveContainerSelector);
			this.$gallery = $(this.options.gallerySelector);
			this.$container = $(this.options.containerSelector);
			this.$header = $(this.options.headerSelector);
			this.$catButtons = $(this.options.catButtonSelector);
			this.$scrollRightButton = $(this.options.scrollRightButtonSelector);
			this.$scrollLeftButton = $(this.options.scrollLeftButtonSelector);
			this.$tileImgHolders = $(this.options.tileImgHolderSelector);
			this.$tileCollapseButton = $(this.options.tileCollapseButtonSelector);
			this.$resetButton = $(this.options.resetButtonSelector);
		},

		"addEventListeners": function (){
			$(window).on('resize', _.debounce(this.onResize, 300));
			this.$catButtons.on('click', this.onCategoryButtonClick);
			this.$scrollRightButton.on('click', this.scrollRight);
			this.$scrollLeftButton.on('click', this.scrollLeft);
			$(document).on('keydown', this.options.interactiveContainerSelector, this.onKeyUp);
			this.$tiles.on('transitionend', _.debounce(this.onTileTransitionend, 200))
			this.$tileImgHolders.on('transitionend', _.debounce(this.onTileImgHolderTransitionend, 200))
			this.$gallery.on('transitionend', this.onGalleryTransitionend);
			this.$tileCollapseButton.on('click', this.onTileCollapseButtonClick);
			this.$tileCollapseButton.on('keyup', this.onEleKeyup);
			this.$tiles.on('keyup', this.onEleKeyup);
			this.$tiles.on('focus', this.onTileFocus);
			this.$tileCollapseButton.on('focus', this.onTileFocus);
			this.$container.on('scroll', this.onContainerScroll);
			this.$resetButton.on('click', this.onResetButtonClick);
			//this.$container.on('mousewheel DOMMouseScroll', this.onGalleryMouseWheel);
		},

	/* Event Handlers */

		"onContainerScroll": function() {
			this.$container.scrollLeft(0);
		},

		"onTileFocus": function(e) {
			var $target = $(e.currentTarget);

			if($target.is(this.options.tileCollapseButtonSelector)) {
				$target = $target.parents(this.options.tileSelector);
			}

			if(this.orientation === 'landscape') {

				//scroll newly focussed items into view
				//this.scrollToTile($target);

			}
		},

		"onEleKeyup": function(e) {
			if(e && (e.which === 13 || e.which === 32)) {
				$(e.currentTarget).trigger('click');
				e.stopPropagation();
			}
		},

		"onGalleryMouseWheel": function(e) {
			if(this.orientation === 'landscape') {
				var deltaX = e.originalEvent.wheelDeltaX;
				var deltaY = e.originalEvent.wheelDeltaY;
				var delta = deltaX || -e.originalEvent.detail;

				if(!this._oldMouseWheelDelta || delta > this._oldMouseWheelDelta) {

					if(Math.abs(deltaX) > Math.abs(deltaY) || e.originalEvent.axis === 1) {
						e.preventDefault();
						e.stopPropagation();

						if(delta < 0) { this.scrollRight(); }
						if(delta > 0) { this.scrollLeft(); }
					}
				}

				this._oldMouseWheelDelta = delta;

			}
		},

		"onTileTransitionend": function(e) {
			if($(e.target).is(this.options.tileSelector)) {
				if(!this._isScrolling) {
					this.checkGalleryOffset();
					this.setScrollButtonStates();
				}
			}
		},

		"onTileImgHolderTransitionend": function (e) {
			if($(e.target).is(this.options.tileImgHolderSelector)) {
				this.$tiles.not('.is-selected').removeClass('is-enlarged');
				if(!this._isScrolling) {
					this.checkGalleryOffset();
					this.setScrollButtonStates();
				}
			}
		},

		"onGalleryTransitionend": function(e) {
			if(!e || $(e.target).is(this.options.gallerySelector)) {
				this._isScrolling = false;
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

			this.tryToPauseTileVideo( this.$tiles.not($tile).filter('.is-selected') );

			if ($tile.hasClass('is-selected')) {
				this.scrollToTile($tile);
				this.tryToPlayOrPauseTileVideo($tile);
			} else if (!$tile.hasClass('is-inactive')) {
				this.deselectTile(this.$tiles.filter('.is-selected'), true);
				this.selectTile($tile);
			}
		},

		"onCategoryButtonClick": function(event) {
			var $button = $(event.currentTarget);
			var selectedClasses = [];

			if(this.$catButtons.not('.is-active').length === 0) {
				//if all buttons are active - deactivate all
				this.$catButtons.removeClass('is-active');
			}

			$button.toggleClass('is-active');

			if(this.$catButtons.filter('.is-active').length === 0) {
				//if no buttons are active - activate all
				this.$catButtons.addClass('is-active');
			}

			this.$catButtons.each(function(ind, catButton){
				var $catButton = $(catButton);

				if ($catButton.hasClass('is-active')) {
					selectedClasses.push('.' + $catButton.attr('data-tile-class'));
				}
			});

			//this.$tiles.removeClass('is-inactive');

			if (selectedClasses.length > 0) {
				this.deactivateTiles(this.$tiles.not(selectedClasses.join(', ')));
				this.activateTiles(this.$tiles.filter(selectedClasses.join(', ')));
			} else {
				this.activateTiles(this.$tiles);
			}
		},

		"deactivateTiles": function($tiles) {
			$tiles.addClass('is-inactive').removeAttr('tabindex');
			$tiles.filter('.is-selected').find('.tile__expander, .tile__video-control').removeAttr('tabindex');
		},

		"activateTiles": function($tiles) {
			$tiles.removeClass('is-inactive');
			$tiles.not('.is-selected').attr('tabindex', 0);
			$tiles.filter('.is-selected').find('.tile__expander, .tile__video-control').attr('tabindex', 0);
		},

		"onTileCollapseButtonClick": function(e) {
			var $tile = $(event.currentTarget).parents(this.options.tileSelector);

			if($tile.hasClass('is-selected')) {
				this.deselectTile($tile);
				e.stopPropagation();
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

		"onResetButtonClick": function() {
			this.$catButtons.addClass('is-active');
			this.activateTiles(this.$tiles);
			this.deselectTile(this.$tiles, true);
			this.$gallery.packery('sortItems');
			this.$gallery.packery();
			this.scrollTo(0);
		},

	/* Gallery offset "scrolling" */

		"setScrollButtonStates": function() {
			var bounds = this.getGalleryOffsetBounds();
			var offset = this.getCurrGalleryOffset();

			if(offset >= bounds.upper) {
				if(this.$scrollLeftButton.is(':focus')) {
					this.$scrollRightButton.focus();
				}
				this.$scrollLeftButton.addClass('is-inactive');
			} else {
				this.$scrollLeftButton.removeClass('is-inactive');
			}

			if (offset <= bounds.lower) {
				if(this.$scrollRightButton.is(':focus')) {
					this.$scrollLeftButton.focus();
				}
				this.$scrollRightButton.addClass('is-inactive');
			} else {
				this.$scrollRightButton.removeClass('is-inactive');
			}
		},

		"getCurrGalleryOffset": function() {
			return this._galleryOffset || 0;
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

		"checkGalleryOffset": function() {
			var offset = this.getCurrGalleryOffset(),
				newOffset = this.constrainGalleryOffset(offset);

			if(offset !== newOffset) {
				this.scrollTo(newOffset);
			} else {
				this.setScrollButtonStates();
			}
		},

		"scrollTo": function(offset) {
			var newOffset = this.constrainGalleryOffset(offset);

			if(newOffset !== this._galleryOffset) {
				this._galleryOffset = newOffset;
				this._isScrolling = true;
				this.$gallery.css({'transform': 'translateX(' + newOffset + 'px)'});
			}
		},

		"scrollRight": function() {
			if (this.orientation === 'portrait') { return; }

			var currOffset = this.getCurrGalleryOffset(),
				decrement = this.selectedTileSize + this.options.gutter; //this.containerWidth * 2/3;

			this.scrollTo(currOffset - decrement);
		},

		"scrollLeft": function() {
			if (this.orientation === 'portrait') { return; }

			var currOffset = this.getCurrGalleryOffset(),
				increment = this.selectedTileSize + this.options.gutter; //this.containerWidth * 2/3;

			this.scrollTo(currOffset + increment);
		},

		"scrollToTile": function($tile) {
			if (this.orientation === 'landscape' && $tile.length > 0) {
				this.scrollTo((($tile.position().left + this.options.gutter) * -1) + ((this.$container.width() - $tile.width()) / 2));
			} else {
				this._isScrolling = true;
				$('html, body').stop(true, false).animate({'scrollTop': $tile.offset().top - ((this.winHeight - $tile.width()) / 2)}, 800, 'linear', this.onGalleryTransitionend);
			}
		},

	/* Layout */

		"determineOrientation": function() {
			this.winHeight = $(window).height();
			this.headerHeight = this.$header.height();
			this.containerWidth = this.$container.width();

			return (this.winHeight > this.containerWidth) ? 'portrait' : 'landscape';
		},

		"getPackeryOptions": function() {
			var options = {
				"itemSelector": this.options.tileSelector,
				"gutter": this.options.gutter,
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

		"setOrientation": function(orientation) {
			this.orientation = orientation || this.determineOrientation();

			this.$interactiveContainer
				.removeClass('is-portrait is-landscape')
				.addClass('is-' + this.orientation);
		},

		"setDimensions": function() {
			if (this.orientation === 'landscape') {
				this.gallerySize = parseInt(this.winHeight - (this.options.gutter * 2) - this.headerHeight, 10);

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

		"setTileWidth": function($tiles, width) {
			var self = this;

			$tiles.each(function(ind, tile){
				var $tile = $(tile),
					$tileImg = $tile.find('img[data-filename]'),
					$tileVid = $tile.find('video'),
					imgFilename = $tileImg.data('filename'),
					dpr = window.devicePixelRatio || 1,
					imgSize = self.selectMediaSize(width, self.options.assetSizes.images), //[1024, 840, 768, 640, 480, 320, 240, 160, 100]
					vidSize = self.selectMediaSize(width * dpr, self.options.assetSizes.videos), //[1080]
					imgSrc = ['images', imgSize, imgFilename].join('/'),
					vidFilename,
					vidSrc;

				$tileImg.attr('src', imgSrc);
				if(imgSrc) {
					$tileImg.attr('srcset', self.createSrcset(imgSrc, [1, 2]) );
				}

				if($tileVid.length > 0) {
					vidFilename = $tileVid.data('filename');
					vidSrc = ['videos', vidSize, vidFilename].join('/');

					$tileVid.attr('poster', imgSrc).attr('src', vidSrc);
				}
			})
			.width(width).height(width)
			.find(this.options.tileImgHolderSelector).width(width).height(width);
		},

		"createSrcset": function(baseSrc, pxDensities) {
			var srcsets = [],
				i,
				src;

			for(i=0; i<pxDensities.length; i++) {
				if(pxDensities[i] !== 1) {
					src = baseSrc.slice(0, -4) + '@' + pxDensities[i] + 'x' + baseSrc.slice(-4) + ' ' + pxDensities[i] + 'x';
				} else {
					src = baseSrc + ' 1x';
				}
				srcsets.push(src);
			}

			return srcsets.join(', ');
		},

		"selectMediaSize": function(tileSize, mediaSizes) {
			mediaSizes.sort(function(a,b) {
				return a - b;
			});

			return _.find(mediaSizes, function(mediaSize){
				if(mediaSize > tileSize) {
					return true;
				}
			}) || mediaSizes[mediaSizes.length -1];

		},

	/* tile selection/deselection */

		"deselectTile": function($tiles, noFocusTransfer) {
			var self = this;

			if ($tiles.length > 0) {

				$tiles.removeClass('is-row-1 is-row-2 is-row-3 is-col-1 is-col-2 is-col-3');

				if (this.orientation === 'landscape') {
					$tiles.addClass('is-row-1');
				} else {
					$tiles.addClass('is-col-1');
				}

				this.tryToPauseTileVideo($tiles);
				this.$gallery.removeClass('has-selected');
				$tiles.each(function(i, tile){
					var $tile = $(tile);

					$tile.removeClass('is-selected');

					if ( $tile.is('.tile--big') ) {
						self.setTileWidth($tile, self.bigTileSize);
					} else {
						self.setTileWidth($tile, self.tileSize);
					}
				});

				//this.$gallery.packery('sortItems');
				this.$gallery.packery();
				$tiles.find('.tile__expander, .tile__video-control').removeAttr('tabindex');
				if(!noFocusTransfer) {
					$tiles.attr('tabindex', 0).trigger('focus');
				}

			}
		},

		"selectTile": function($tile) {
			var currColumn,
				targetOffset,
				tilePos = $tile.position();

			this.$gallery.addClass('has-selected');
			$tile.removeAttr('tabindex').find('.tile__expander').attr('tabindex', 0).trigger('focus');
			$tile.find('.tile__video-control').attr('tabindex', 0);
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
			this.scrollToTile($tile);
		},

	/* Video controllers */

		"tryToPlayOrPauseTileVideo": function($tiles) {
			if ($tiles.length > 0) {

			var self = this;

				$tiles.each(function(i, tile){
					var $tile = $(tile),
						$video = $tile.find('video');

					if($video.length > 0) { 
						if($video.get(0).paused) {
							self.tryToPlayTileVideo($tile);
						} else {
							self.tryToPauseTileVideo($tile);
						}
					}

				});
			}

		},

		videoEvents: 'readystatechange loadeddata loadedmetadata canplay playing play canplaythrough stalled suspend waiting durationchange emptied',

		"tryToPlayTileVideo": function($tiles) {
			var self = this;

			if($tiles.length > 0) {

				$tiles.each(function(i, tile){
					var $tile = $(tile),
						$video = $tile.find('video'),
						video;

					if($video.length > 0) {
						video = $video.get(0);
						$tile.addClass('is-playing');
						self.loadOrPlayVideo(video);
						$video.on(self.videoEvents, self.onVideoReadyStateChange);
					}

				});
			}
		},

		"loadOrPlayVideo": function(video) {
			var $video = $(video),
				$tile = $video.parents(this.options.tileSelector);

			if(!$tile.hasClass('is-playing')) { return; }

			if(video.readyState === 4) {
				video.play();
				$tile.removeClass('is-loading');
				$video.one('pause ended', function() {
					$tile.removeClass('is-playing');
				});
			} else {
				$tile.addClass('is-loading');
			}
		},

		"onVideoReadyStateChange": function(e) {
			console.log(e.type);
			this.loadOrPlayVideo(e.currentTarget);
		},

		"tryToPauseTileVideo": function($tiles) {
			var self = this;

			if ($tiles.length > 0) {

				$tiles.each(function(i, tile){
					var $tile = $(tile),
						$video = $tile.find('video');

					if($video.length > 0) { 
						$video.get(0).pause();
						$tile.removeClass('is-playing').removeClass('is-loading');
						$video.off(self.videoEvents, self.onVideoReadyStateChange);
					}

				});
			}
		}

	};

	_.bindAll(
		app,
		'init',
		'onTileClick',
		'onTileFocus',
		'onEleKeyup',
		'onResize',
		'onContainerScroll',
		'onLayoutComplete',
		'onCategoryButtonClick',
		'scrollRight',
		'scrollLeft',
		'onKeyUp',
		'onTileImgHolderTransitionend',
		'onGalleryTransitionend',
		'onTileTransitionend',
		'scrollTo',
		'setScrollButtonStates',
		'checkGalleryOffset',
		'onGalleryMouseWheel',
		'onTileCollapseButtonClick',
		'deactivateTiles',
		'activateTiles',
		'onResetButtonClick',
		'loadOrPlayVideo',
		'onVideoReadyStateChange'
	);

	return app;

})