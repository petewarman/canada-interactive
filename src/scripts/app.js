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

	Packery.prototype.snapFit = function( elem, x, y ) {
		var item = this.getItem( elem );
		if ( !item ) {
		return;
		}

		// prepare internal properties
		this._getMeasurements();

		// stamp item to get it out of layout
		this.stamp( item.element );
		// required for positionPlaceRect
		item.getSize();
		// set placing flag
		item.isPlacing = true;
		// fall back to current position for fitting
		x = x === undefined ? item.rect.x: x;
		y = y === undefined ? item.rect.y: y;

		// position it best at its destination
		item.positionPlaceRect( x, y, true );

		this._bindFitEvents( item );
		item.goTo( item.placeRect.x, item.placeRect.y );
		// layout everything else
		this.layout();

		// return back to regularly scheduled programming
		this.unstamp( item.element );
		this.sortItemsByPosition();
		// un set placing flag, back to normal
		item.isPlacing = false;
		// copy place rect position
		item.copyPlaceRectPosition();
	};

	Packery.prototype.doubleFit = function( elem1, x1, y1, type1, elem2, x2, y2, type2 ) {
		var item1 = this.getItem( elem1 ),
			item2 = this.getItem( elem2 );
		if ( !item1 || !item2 ) {
			return;
		}

		// prepare internal properties
		this._getMeasurements();

		// stamp item to get it out of layout
		this.stamp( item1.element );
		this.stamp( item2.element );
		// required for positionPlaceRect
		item1.getSize();
		item2.getSize();
		// set placing flag
		item1.isPlacing = true;
		item2.isPlacing = true;
		// fall back to current position for fitting
		x1 = x1 === undefined ? item1.rect.x: x1;
		y1 = y1 === undefined ? item1.rect.y: y1;
		x2 = x2 === undefined ? item2.rect.x: x2;
		y2 = y2 === undefined ? item2.rect.y: y2;

		// position it best at its destination
		item1.positionPlaceRect( x1, y1, true );
		item2.positionPlaceRect( x2, y2, true );

		this._bindFitEvents( item1 );
		this._bindFitEvents( item2 );
		
		if(type1 === 'snapFit') {
			item1.goTo( item1.placeRect.x, item1.placeRect.y );
		} else {
			item1.moveTo( item1.placeRect.x, item1.placeRect.y );
		}
		if(type2 === 'snapFit') {
			item2.goTo( item2.placeRect.x, item2.placeRect.y );
		} else {
			item2.moveTo( item2.placeRect.x, item2.placeRect.y );
		}

		// layout everything else
		this.layout();

		// return back to regularly scheduled programming
		this.unstamp( item1.element );
		this.unstamp( item2.element );

		this.sortItemsByPosition();
		// un set placing flag, back to normal
		item1.isPlacing = false;
		item2.isPlacing = false;
		// copy place rect position
		item1.copyPlaceRectPosition();
		item2.copyPlaceRectPosition();
	};

	Packery.prototype.getItemIndex = function (ele) {
		var item = _.findWhere(this.items, {"element": ele});
		return _.indexOf(this.items, item);
	}

	Packery.Item.prototype.positionPlaceRect = function( x, y, isMaxOpen ) {
		this.placeRect.x = this.getPlaceRectCoord( x, true, isMaxOpen );
		this.placeRect.y = this.getPlaceRectCoord( y, false, isMaxOpen );
	};

	Packery.Item.prototype._transitionTo = function( x, y ) {
		this.getPosition();
		// get current x & y from top/left
		var curX = this.position.x;
		var curY = this.position.y;

		var compareX = parseInt( x, 10 );
		var compareY = parseInt( y, 10 );
		var didNotMove = compareX === this.position.x && compareY === this.position.y;

		// save end position
		this.setPosition( x, y );

		if(this.element.classList.contains('is-enlarged') && !this.element.classList.contains('is-selected') && !this.element.classList.contains('tile--big')) {
			this.layoutPosition();
			return;
		}

		// if did not move and not transitioning, just go to layout
		if ( didNotMove && !this.isTransitioning ) {
			this.layoutPosition();
			return;
		}

		var transX = x - curX;
		var transY = y - curY;
		var transitionStyle = {};
		transitionStyle.transform = this.getTranslate( transX, transY );

		this.transition({
			to: transitionStyle,
			onTransitionEnd: {
				transform: this.layoutPosition
			},
			isCleaning: true
		});
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
			this.$tiles = $(this.options.tileSelector, this.options.interactiveEl);
			this.$interactiveContainer = $(this.options.interactiveContainerSelector, this.options.interactiveEl);
			this.$gallery = $(this.options.gallerySelector, this.options.interactiveEl);
			this.$container = $(this.options.containerSelector, this.options.interactiveEl);
			this.$header = $(this.options.headerSelector, this.options.interactiveEl);
			this.$catButtons = $(this.options.catButtonSelector, this.options.interactiveEl);
			this.$scrollRightButton = $(this.options.scrollRightButtonSelector, this.options.interactiveEl);
			this.$scrollLeftButton = $(this.options.scrollLeftButtonSelector, this.options.interactiveEl);
			this.$tileImgHolders = $(this.options.tileImgHolderSelector, this.options.interactiveEl);
			this.$tileCollapseButton = $(this.options.tileCollapseButtonSelector, this.options.interactiveEl);
			this.$resetButton = $(this.options.resetButtonSelector, this.options.interactiveEl);
		},

		"addEventListeners": function (){
			$(window).on('resize', _.debounce(this.onResize, 300));
			this.$catButtons.on('click', this.onCategoryButtonClick);
			this.$scrollRightButton.on('click', this.scrollRight);
			this.$scrollLeftButton.on('click', this.scrollLeft);
			$(document).on('keydown', this.options.interactiveContainerSelector, this.onKeyUp);
			this.$tiles.on('transitionend', _.debounce(this.onTileTransitionend, 200));
			this.$tileImgHolders.on('transitionend', _.debounce(this.onTileImgHolderTransitionend, 200));
			this.$tileImgHolders.find('img').on('load', this.onTileImageLoad);
			this.$gallery.on('transitionend', this.onGalleryTransitionend);
			this.$tileCollapseButton.on('click', this.onTileCollapseButtonClick);
			this.$tileCollapseButton.on('keyup', this.onEleKeyup);
			this.$tiles.on('keyup', this.onEleKeyup);
			this.$tiles.on('focus', this.onTileFocus);
			this.$tileCollapseButton.on('focus', this.onTileFocus);
			this.$container.on('scroll', this.onContainerScroll);
			this.$resetButton.on('click', this.onResetButtonClick);
			this.$container.on('touchstart', this.onTouchStart);
			this.$container.on('touchmove', this.onTouchMove);
			this.$container.on('touchend', this.onTouchEnd);
			this.$container.on('touchcancel', this.onTouchCancel);
			//this.$container.on('mousewheel DOMMouseScroll', this.onGalleryMouseWheel);
		},

	/* Event Handlers */

		"onTileImageLoad": function(e) {
			$(e.target).parents(this.options.tileSelector).data('hasLoadedImage', true);
			this.checkAllImagesHaveLoaded();
		},

		"cancelDrag": function() {
			this.$container.removeClass('is-dragging');
			if(this._momentum) {
				delete this._momentum;
			}
		},

		"onTouchStart": function(event) {
			if(this._momentum) {
				delete this._momentum;
			}

			if(this.orientation === 'landscape') {
				this._isTouching = true;
				this._initialTouch = {
					'clientX': event.originalEvent.touches[0].clientX,
					'clientY': event.originalEvent.touches[0].clientY,
					'time': Date.now()
				};
				this._initialOffset = this.getCurrGalleryOffset();
				this._touchList = [];
				this.$container.addClass('is-dragging');
			}
		},

		"onTouchMove": function(event) {
			var touch,
				prevTouch,
				xDiffFromInitial,
				yDiffFromInitial,
				xDiffFromPrevious,
				offset;

			if(this.orientation === 'landscape') {
				touch = event.originalEvent.touches[0];
				xDiffFromInitial = this._initialTouch.clientX - touch.clientX;
				yDiffFromInitial = this._initialTouch.clientY - touch.clientY;
				prevTouch = (this._touchList.length > 0) ? this._touchList[this._touchList.length - 1] : this._initialTouch;
				xDiffFromPrevious = prevTouch.clientX - touch.clientX;

				if(!this._isTouching) {
					this.onTouchStart(event);
					return;
				}

				//dont track micro movements
				if(Math.abs(xDiffFromPrevious) > 2) {
					this._touchList.push({
						'clientX': touch.clientX,
						'clientY': touch.clientY,
						'time': Date.now()
					});
				}

				//if movement is primarily horizontal prevent default vertical scroll
				if(Math.abs(xDiffFromInitial) > Math.abs(yDiffFromInitial)) {
					event.preventDefault();
					this.scrollTo(this._initialOffset - xDiffFromInitial);
				}
			}
		},

		"onTouchEnd": function(event) {
			var releaseVelocity;

			this._isTouching = false;

			if(this.orientation === 'landscape') {
				if(this._touchList.length > 2) {
					releaseVelocity = this.calculateReleaseVelocity();

					if(Math.abs(releaseVelocity) > 0.001) {
						this.momentumScroll(releaseVelocity);
					} else {
						this.cancelDrag();
						this.onGalleryTransitionend();
					}
				}
			} else {
				this.cancelDrag();
				this.onGalleryTransitionend();
			}
		},

		"onTouchCancel": function(event) {
			this._isTouching = false;
			this.cancelDrag();
			this.onGalleryTransitionend();
		},

		"calculateReleaseVelocity": function() {
			//get last two touches from touchList
			var touch1 = this._touchList[this._touchList.length - 2],
				touch2 = this._touchList[this._touchList.length - 1],
				diffX = touch1.clientX - touch2.clientX,
				diffT = touch2.time - touch1.time;

			//return release velocity in pixels per milisecond.
			return diffX / diffT;
		},

		"momentumScroll": function(releaseVelocity) {
			this._momentum = {};
			this._momentum.scrollDiff = 200 * releaseVelocity;
			this._momentum.targetOffset = Math.round(this.getCurrGalleryOffset() - this._momentum.scrollDiff); 
			this._momentum.initialTimestamp = Date.now();
			this._momentum.timeConstant = 325;
			requestAnimationFrame(this.momentumScrollStep);
		},

		"momentumScrollStep": function() {
			var timeElapsed, 
				delta;

			if (this._momentum) {
				timeElapsed = Date.now() - this._momentum.initialTimestamp;
				delta = this._momentum.scrollDiff * Math.exp(-timeElapsed / this._momentum.timeConstant);

				if (delta > 0.5 || delta < -0.5) {
					this.scrollTo(this._momentum.targetOffset + delta);
					requestAnimationFrame(this.momentumScrollStep);
				} else {
					this.scrollTo(this._momentum.targetOffset);
					this.cancelDrag();
					this.onGalleryTransitionend();
				}
			}
		},

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
				if($(e.target).parent(this.options.tileSelector).hasClass('is-selected')) {
					this.$gallery.removeClass('change-selection');
				}
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
			var $tile = $(event.currentTarget),
				$selectedTile = this.$tiles.filter('.is-selected'),
				fit,
				expandOrigin = this.getTileExpansionOrigin($tile),
				oldScrollTop = $(window).scrollTop();

			this.tryToPauseTileVideo( this.$tiles.not($tile).filter('.is-selected') );

			if ($tile.hasClass('is-selected')) {
				this.scrollToTile($tile);
				this.tryToPlayOrPauseTileVideo($tile);
			} else if (!$tile.hasClass('is-inactive')) {
				if($selectedTile.length > 0) {
					this.changeSelectedTile($tile, $selectedTile);
				} else {
					this.selectTile($tile, expandOrigin);
					fit = this.getFitParams(
						$tile.position(), 
						this.getTileExpansionOrigin($tile), 
						true, 
						$tile.hasClass('tile--big'), 
						this.isLastTile($tile)
					);
					this.$gallery.packery(fit.type, $tile[0], fit.x, fit.y);
				}

				if (this.orientation === 'portrait') {
					$(window).scrollTop(oldScrollTop);
				}

				this.scrollToTile($tile);
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
			$tiles.filter('.is-selected').find([this.options.tileCollapseButtonSelector, this.options.tileVideoControlSelector].join(', ')).removeAttr('tabindex');
		},

		"activateTiles": function($tiles) {
			$tiles.removeClass('is-inactive');
			$tiles.not('.is-selected').attr('tabindex', 0);
			$tiles.filter('.is-selected').find([this.options.tileCollapseButtonSelector, this.options.tileVideoControlSelector].join(', ')).attr('tabindex', 0);
		},

		"onTileCollapseButtonClick": function(event) {
			var $tile = $(event.currentTarget).parents(this.options.tileSelector);

			if($tile.hasClass('is-selected')) {
				this.deselectTile($tile);
				this.$gallery.packery();
				event.stopPropagation();
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
			this.scrollToTile(this.$tiles.filter(':first'));
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

			this.cancelDrag();

			var currOffset = this.getCurrGalleryOffset(),
				decrement = this.selectedTileSize + this.options.gutter; //this.containerWidth * 2/3;

			this.scrollTo(currOffset - decrement);
		},

		"scrollLeft": function() {
			if (this.orientation === 'portrait') { return; }

			this.cancelDrag();

			var currOffset = this.getCurrGalleryOffset(),
				increment = this.selectedTileSize + this.options.gutter; //this.containerWidth * 2/3;

			this.scrollTo(currOffset + increment);
		},

		"scrollToTile": function($tile) {
			this.cancelDrag();

			if (this.orientation === 'landscape' && $tile.length > 0) {
				this.scrollTo((($tile.position().left + this.options.gutter) * -1) + ((this.$container.width() - $tile.width()) / 2));
			} else {
				this._isScrolling = true;
				$('html, body').stop(true, false).animate({'scrollTop': $tile.offset().top - ((this.winHeight - $tile.width()) / 2)}, 300, 'linear', this.onGalleryTransitionend);
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
				this.gallerySize = Math.floor(this.winHeight - (this.options.gutter * 2) - this.headerHeight);

				if (this.options.landscapeMaxHeight) { 
					this.gallerySize = Math.min(this.gallerySize, this.options.landscapeMaxHeight); 
				}

			} else {
				this.gallerySize = Math.floor(this.$gallery.width());
			}

			this.tilesPerAxis = (this.gallerySize > this.options.tilesPerAxisBreakPoint) ? 3 : 2; //number of tiles per column or row
			this.bigTileRatio = (this.gallerySize > this.options.tilesPerAxisBreakPoint) ? 2 : 1; //ratio of big tiles to small tiles

			this.$container.removeClass('tiles-per-axis-2 tiles-per-axis-3').addClass('tiles-per-axis-' + this.tilesPerAxis);

			this.tileSize = this.calculateTileSize(this.gallerySize, this.tilesPerAxis, this.options.gutter);
			this.bigTileSize = (this.tileSize * this.bigTileRatio) + (this.options.gutter * (this.bigTileRatio - 1));
			this.gallerySize = this.tilesPerAxis * (this.tileSize + this.options.gutter) - this.options.gutter;
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

		"calculateTileSize": function(gallerySize, tilesPerAxis, gutter) {
			return Math.floor((gallerySize - (gutter * (tilesPerAxis-1))) * (1 / tilesPerAxis));
		},

		"setTileWidth": function($tiles, width) {
			$tiles.each(this.setTileImage)
				.width(width).height(width)
				.find(this.options.tileImgHolderSelector).width(width).height(width);
		},

		"setTileImage": function(ind, tile) {
			var $tile = $(tile),
				$tileImg = $tile.find('img[data-filename]'),
				tileSize = this.getTileSize($tile),
				imgFilename = $tileImg.data('filename'),
				dpr = window.devicePixelRatio || 1,
				imgSize = this.selectMediaSize(tileSize, this.options.assetSizes.images),
				imgSrc = [this.options.rootPath + 'images', imgSize, imgFilename].join('/'),
				$tileVid = $tile.find('video'),
				oldImgSize = $tileImg.data('img-size'),
				oldVidSize = $tile.data('vid-size');

			//don't bother loading in smaller images, just downsample those already loaded
			if(oldImgSize && oldImgSize > imgSize) {
				return;
			}

			if(imgSrc) {
				$tileImg.attr('src', imgSrc).data('img-size', imgSize);
				$tileImg.attr('srcset', this.createSrcset(imgSrc, this.options.assetSizes.pixelDensities) );
			}

			if($tileVid.length > 0 && $tile.data('videoSrcIsSet')) {
				this.setTileVideo(ind, tile);
			}
		},

		"getTileSize": function($tile) {
			return $tile.hasClass('is-selected') ? this.selectedTileSize : $tile.hasClass('tile--big') ? this.bigTileSize : this.tileSize;
		},

		"setTileVideo": function(ind, tile) {
			var $tile = $(tile),
				$tileVid = $tile.find('video'),
				$tileImg = $tile.find('img[data-filename]'),
				imgFilename = $tileImg.data('filename'),
				dpr = window.devicePixelRatio || 1,
				vidSize = this.selectMediaSize(this.selectedTileSize * dpr, this.options.assetSizes.videos),
				posterSize = this.selectMediaSize(this.selectedTileSize, this.options.assetSizes.images),
				posterSrc = this.addImageDprSuffix([this.options.rootPath + 'images', posterSize, imgFilename].join('/'), dpr),
				vidFilename;

			if($tile.data('vid-size') && $tile.data('vid-size') === vidSize) {
				return;
			}

			if($tileVid.length > 0) {
				vidFilename = $tileVid.data('filename');
				$tileVid.attr('poster', posterSrc).attr('src', [this.options.rootPath + 'videos', vidSize, vidFilename].join('/'));
				$tile.data('videoSrcIsSet', true).data('vid-size', vidSize);
			}
		},

		"addImageDprSuffix": function(url, dpr) {
			if(dpr === 1) {
				return url;
			}
			return url.slice(0, -4) + '@' + dpr + 'x' + url.slice(-4);
		},

		"createSrcset": function(baseSrc, pxDensities) {
			var srcsets = [],
				i,
				src;

			for(i=0; i<pxDensities.length; i++) {
				src = this.addImageDprSuffix(baseSrc, pxDensities[i]) + ' ' + pxDensities[i] + 'x';
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

		"checkAllImagesHaveLoaded": function() {
			var allLoaded = true;

			this.$tiles.each(function(i, tile){
				if(!$(tile).data('hasLoadedImage')) {
					allLoaded = false;
				}
			});

			if(allLoaded) {
				this.preloadVideos();
			}
		},

		"preloadVideos": function() {
			if(!this._vidsPreloaded) {
				this._vidsPreloaded = true;
				this.$tiles.each(this.setTileVideo);
			}
		},

	/* tile selection/deselection */

		"deselectTile": function($tiles, noFocusTransfer, shrinkOrigin) {
			var self = this;

			if ($tiles.length > 0) {

				$tiles.removeClass('is-x-start is-x-center is-x-end is-y-start is-y-center is-y-end');

				if (shrinkOrigin) {
					$tiles.addClass('is-x-' + shrinkOrigin.x + ' is-y-' + shrinkOrigin.y);
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

				$tiles.find([
					this.options.tileCollapseButtonSelector, 
					this.options.tileVideoControlSelector
				].join(', ')).removeAttr('tabindex');

				if(!noFocusTransfer) {
					$tiles.attr('tabindex', 0).trigger('focus');
				}

			}
		},

		"changeSelectedTile": function($tile, $prevTile) {
			var collapseOrigin = {'x':'start', 'y': 'start'};
			var expandOrigin = this.getTileExpansionOrigin($tile, $prevTile);

			this.$gallery.addClass('change-selection');

			if(
				(this.orientation === 'landscape' && $prevTile.position().left > $tile.position().left) ||
				(this.orientation === 'portrait' && $prevTile.position().top > $tile.position().top)
			) {
				collapseOrigin = {'x':'end', 'y': 'end'};
			} 

			this.deselectTile($prevTile, true, collapseOrigin);
			this.selectTile($tile, expandOrigin);

			var fit = this.getFitParams($tile.position(), expandOrigin, true, $tile.hasClass('tile--big'), this.isLastTile($tile));
			var prevFit = this.getFitParams($prevTile.position(), collapseOrigin, false, $prevTile.hasClass('tile--big'), this.isLastTile($prevTile), fit);

			if(fit.cancelDouble) {
				this.$gallery.packery(fit.type, $tile[0], fit.x, fit.y);
			} else {
				this.$gallery.packery('doubleFit', $tile[0], fit.x, fit.y, fit.type, $prevTile[0], prevFit.x, prevFit.y, prevFit.type);
			}
		},

		"isLastTile": function($tile) {
			var tileIndexByPosition = this.$gallery.packery('getItemIndex', $tile.get(0));
			return tileIndexByPosition === (this.$tiles.length - 1);
		},

		"selectTile": function($tile, expandOrigin) {
			var expandOrigin = expandOrigin || { x: 'start', y: 'start' },
				fit;

			//update classes
			this.$gallery.addClass('has-selected');
			$tile.removeClass('is-x-start is-x-center is-x-end is-y-start is-y-center is-y-end')
				.addClass('is-selected is-enlarged is-x-' + expandOrigin.x + ' is-y-' + expandOrigin.y);

			//update tabindexes
			$tile.removeAttr('tabindex').find(this.options.tileCollapseButtonSelector).attr('tabindex', 0).trigger('focus');
			$tile.find(this.options.tileVideoControlSelector).attr('tabindex', 0);

			//check video source is set
			if( !$tile.data('videoSrcIsSet') ) {
				this.setTileVideo(0, $tile.get(0));
			}

			//set width
			this.setTileWidth($tile, this.selectedTileSize);

			//fit it
			// fit = this.getFitParams($tile.position(), expandOrigin, true, $tile.hasClass('tile--big'), this.isLastTile($tile));
			// this.$gallery.packery(fit.type, $tile[0], fit.x, fit.y);
		},

		"getFitParams": function(tilePos, transformOrigin, grow, isBig, isLast, fitAround) {
			var fit = {
					'x': 0,
					'y': 0,
					'type': 'snapFit'
				},
				dir = grow ? -1 : 1,
				primaryAxis = 'y',
				primaryOffset = 'top',
				secondaryAxis = 'x',
				secondaryOffset = 'left',
				axisUnit = this.tileSize + this.options.gutter,
				tileSize = isBig ? axisUnit * this.bigTileRatio : axisUnit;

			if (this.orientation === 'landscape') {
				primaryAxis = 'x';
				primaryOffset = 'left';
				secondaryAxis = 'y';
				secondaryOffset = 'top';
			}

			//primary axis
			if(transformOrigin[primaryAxis] === 'start') {
				fit[primaryAxis] = tilePos[primaryOffset];
			} else if(transformOrigin[primaryAxis] === 'center') {
				fit[primaryAxis] = tilePos[primaryOffset] + dir * axisUnit;
			} else {
				fit[primaryAxis] = tilePos[primaryOffset] + dir * axisUnit * (this.tilesPerAxis - 1);
			}

			//if shrinking calculate secondary axis
			if(!grow) {
				if(transformOrigin[secondaryAxis] === 'start') {
					fit[secondaryAxis] = 0;
				} else if(transformOrigin[secondaryAxis] === 'center' || isBig) {
					fit[secondaryAxis] = axisUnit;
				} else {
					fit[secondaryAxis] = axisUnit * (this.tilesPerAxis - 1);
				}
			}

			//collision detection
			if(fitAround) {
				//make sure there's space to the left
				if(fit[primaryAxis] < fitAround[primaryAxis] && (fit[primaryAxis] + tileSize) > fitAround[primaryAxis]) {
					if(fit[primaryAxis] === 0) {
						fit[primaryAxis] = fitAround[primaryAxis] + (axisUnit * this.tilesPerAxis);
					} else {
						fit[primaryAxis] -= axisUnit;
					}
					fit.type = 'fit';
				}
				//make sure there's space to the right
				if(fit[primaryAxis] >= fitAround[primaryAxis] && fit[primaryAxis] < fitAround[primaryAxis] + (axisUnit * this.tilesPerAxis) ) {
					fit[primaryAxis] = fitAround[primaryAxis] + (axisUnit * this.tilesPerAxis);
					fit.type = 'fit';
				}
			}

			//special case if the last tile is big
			if(isLast && isBig && (this.tilesPerAxis === 3)) {
				if(tilePos[secondaryOffset] === 0) {
					fit[primaryAxis] = tilePos[primaryOffset] - (3 * axisUnit);
				}
				fit.type = 'fit';
				fit.cancelDouble = 'true';
			}

			fit[primaryAxis] = this.roundToTile(fit[primaryAxis]);
			fit[secondaryAxis] = this.roundToTile(fit[secondaryAxis]);

			return fit;
		},

		"roundToTile": function(offset) {
			var unit = (this.tileSize + this.options.gutter);
			return Math.max(unit * Math.round(offset / unit), 0);
		},

		"getTileExpansionOrigin": function($tile, $prevTile) {
			var tilePos = $tile.position(),
				expandOrigin = {
					x: 'start',
					y: 'start'
				},
				primaryOffset = 'top',
				primaryAxis = 'y',
				secondaryOffset = 'left',
				secondaryAxis = 'x';

			if (this.orientation === 'landscape') {
				primaryOffset = 'left';
				primaryAxis = 'x';
				secondaryOffset = 'top';
				secondaryAxis = 'y';
			}

			if(Math.abs(tilePos[secondaryOffset]) < this.options.gutter) {
				expandOrigin[secondaryAxis] = 'start';
			} else if(this.tilesPerAxis === 3 && tilePos[secondaryOffset] - (this.tileSize + this.options.gutter) <= this.options.gutter && !$tile.hasClass('tile--big')) {
				expandOrigin[secondaryAxis] = 'center';
			} else {
				expandOrigin[secondaryAxis] = 'end';
			}

			if($prevTile && $prevTile.length > 0 && $prevTile.position()[primaryOffset] < tilePos[primaryOffset]) {
				expandOrigin[primaryAxis] = 'end';
			}

			return expandOrigin;
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
		'onVideoReadyStateChange',
		'onTouchStart',
		'onTouchMove',
		'onTouchEnd',
		'onTouchCancel',
		'momentumScroll',
		'momentumScrollStep',
		'onTileImageLoad',
		'setTileImage',
		'setTileVideo'
	);

	return app;

})