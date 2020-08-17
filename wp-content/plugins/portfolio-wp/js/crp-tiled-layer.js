CRPTiledLayerType = {};
CRPTiledLayerType.Puzzle = 1;
CRPTiledLayerType.Masonry = 2;
CRPTiledLayerType.Square = 3;
CRPTiledLayerType.Justified = 4;

;(function ($) {
    $.crpTiledLayer = function (element, options) {
        if(options.approxTileWidth < options.minTileWidth){
            options.approxTileWidth = options.minTileWidth;
        }

        var Slot = function (width, height) {
            this.position = { x: 0, y: 0 };
            this.blocks = { h: width, v: height };
            this.size = { width: this.blocks.h, height: this.blocks.v };
            this.px = { width: width, height: height };
            this.edge_right = false;
        }

        Slot.prototype.resize = function (blocks, onlyWidth) {
            //nw : nh = w : h => nh = nw * h / w
            var new_width = blocks;
            var new_height = (new_width * this.px.height) / this.px.width;
            var bv = this.blocks.v;
            this.blocks.h = blocks;
            if(!onlyWidth && plugin.settings.layoutType != CRPTiledLayerType.Square)
                this.blocks.v = new_height;
        }

        var Grid = function (margin, min_tile_width, width) {
            this.slots = [];
            this.cells = [];
            this.margin = margin;
            this.min_tile_width = min_tile_width;
            this.width = width;
            this.hor_size = width;
            this.init();
        }

        Grid.prototype.init = function () {
            this.slots.length = 0;
            this.cells.length = 0;
            for (var i = 0; i < this.hor_size * 1000; i++) {
                this.cells[i] = 0;
            }
        }

        Grid.prototype.add_slot = function (slot) {
            for (var j = 0; j < slot.blocks.v; j++) {
                for (var i = 0; i < slot.blocks.h; i++) {
                    var row = slot.position.y + j;
                    var column = slot.position.x + i;
                    //if (this.cells.length < row * this.hor_size + column)

                    this.cells[row * this.hor_size + column] = 1;
                    this.cells.push(0);
                }
            }

            this.slots.push(slot);
        }

        Grid.prototype.count_free_cells_on_right = function (index) {
            var line = Math.floor(index / this.hor_size);
            var line_end = (line + 1) * this.hor_size;

            var length = 0;

            for (; index < line_end; index++, length++) {
                if (this.cells[index] == 1) {
                    break;
                }
            }

            return length;
        }

        Grid.prototype.insert = function (width, height, allowEnlargement) {

            /* Hack for square and masonry styles */
            var sW = width;
            var sH = height;
            if(plugin.settings.layoutType == CRPTiledLayerType.Masonry || plugin.settings.layoutType == CRPTiledLayerType.Square){
                var _slotWidth = plugin.settings.approxTileWidth + plugin.settings.margin;
                var _wrapperWidth = $element.width() + plugin.settings.margin;
                if(_slotWidth > _wrapperWidth - plugin.settings.margin){
                    _slotWidth = _wrapperWidth - plugin.settings.margin;
                }

                var _itemsPerRow = parseInt( _wrapperWidth / _slotWidth );
                var _delta = _wrapperWidth - _itemsPerRow * _slotWidth;
                var _deltaPerCell = Math.floor(_delta / _itemsPerRow);
                _slotWidth += _deltaPerCell;

                sW = _slotWidth;

                var _ratio = plugin.settings.approxTileHeight / plugin.settings.approxTileWidth;
                if(plugin.settings.layoutType == CRPTiledLayerType.Masonry){
                    _ratio = height / width;
                }

                sH = Math.ceil(sW * _ratio);

            } else {
                var _wrapperWidth = $element.width() + plugin.settings.margin;
                var step = parseInt( _wrapperWidth / 4 );

                var ratios = [
                    {w: 1, h:1},
                    {w: 2, h:2},
                ];
                var ratio = ratios[(Math.floor(Math.random() * (ratios.length - 0)) + 0)];

                sW = ratio.w * step;
                sH = ratio.h * step;
            }

            var newsH = sH;
            if (plugin.settings.addBlock1Height != false) {
                newsH += plugin.settings.addBlock1Height;
            }
            if (plugin.settings.addBlock2Height != false) {
                newsH += plugin.settings.addBlock2Height;
            }
            var slot = new Slot(sW, newsH);
            var av_blocks = 0;
            var free_cell = 0;
            var line = 0;

            if (this.slots.length == 0) {
                av_blocks = this.hor_size;
                slot.position.x = 0;
                slot.position.y = 0;
            } else {

                //find first available cell
                var exit = false;
                for (; free_cell < this.cells.length; free_cell++) {
                    if (this.cells[free_cell] == 0) {

                        line = Math.floor(free_cell / this.hor_size);
                        var line_end = (line + 1) * this.hor_size;

                        //available blocks
                        av_blocks = 0;
                        for (var k = 0; k <= line_end - free_cell; k++) {
                            av_blocks = k;
                            if (this.cells[free_cell + k] == 1) {
                                //there's another slot on the right
                                break;
                            }
                        }
                        break;
                    }
                }
            }
            //the slot need to be shrinked
            if (av_blocks < slot.blocks.h) {
                slot.resize(av_blocks);
            } else {
                var free_on_right = this.count_free_cells_on_right(free_cell + slot.blocks.h);
                if (free_on_right - plugin.settings.margin < this.min_tile_width &&
                    free_on_right > 0) {
                    slot.resize(av_blocks, !allowEnlargement);
                    slot.enlarged = true;
                }
                if (free_on_right == 0)
                    slot.edge_right = true;
            }

            slot.position.x = free_cell % this.hor_size;
            slot.position.y = Math.floor(free_cell / this.hor_size);

            this.add_slot(slot);
            return slot;
        }

        var defaults = {
            layoutType: CRPTiledLayerType.Square,
            approxTileWidth: 200,
            approxTileHeight: 200,
            minTileWidth: 200,
            margin: 10,
            addBlock1Height: false,
            addBlock2Height: false,
            allowEnlargement: false,
            onComplete: function () { },
            onUpdate: function () { },
        }

        var plugin = this;
        var grid = null;
        var maxHeight = 0;

        plugin.settings = {}

        var $element = $(element),
            element = element;

        var currentWidth = $element.width();

        var completed = false;
        var busy = false;

        var tilesForFilter = function(ft) {
            $tiles =  $element.find(".tile");
            return $tiles;
        }

        var doFiltration = function() {
            busy = true;

            var $tiles = tilesForFilter(null);
            maxHeight = 0;
            grid = null;

            $tiles.css({visibility: 'invisible'});
            entile($tiles);
            $tiles.css({visibility: 'visible'});

            busy = false;
        }

        plugin.init = function () {
            plugin.settings = $.extend({}, defaults, options);

            $element.find(".ftg-items").css({
                position: "relative",
                minWidth: plugin.settings.minTileWidth,
            });

            var $tiles = $element.find(".tile");
            styleTiles($tiles);
            assignImagesSize($tiles);
            var category = window.location.hash;
            if (category != '' && category != '#') {
                var current = jQuery(".ftg-filters a[href='" + category + "']");
                if (current.length != 0) {
                    jQuery("a", current.closest(".ftg-filters")).removeClass('selected');
                    current.addClass('selected');
                }
            }
            doFiltration();

            $(window).resize(function () {
                if(busy) return;

                if (currentWidth != $element.width())
                {
                    busy = true;
                    currentWidth = $element.width();

                    resTo = setTimeout(function () {
                        grid = null;
                        maxHeight = 0;

                        var $filteredTiles = tilesForFilter(null);
                        entile($filteredTiles);

                        busy = false;
                    }, 700);
                }
            });
        }

        var styleTiles = function ($tiles) {
            $tiles.css({
                position: "absolute",
                visibility: 'hidden',
            });

            $tiles.find('.tile-inner').css({
                position: "relative",
                display: "block",
                overflow: "hidden",
            });

            $tiles.find('.crp-item').css({
                position: "relative",
                display: "block",
                fontSize: 10, //against weird rules in some reset.css
                maxWidth: "9999em",
            });
        }

        var assignImagesSize = function ($tiles) {
            $tiles.each(function () {
                var $item = $(this).find(".crp-item");

                var size = {
                    width: $item.data("width"),
                    height: $item.data("height")
                };

                $item.data("size", size);
            });
        }

        var entile = function ($tiles) {
            if (!grid)
                grid = new Grid(plugin.settings.margin, plugin.settings.minTileWidth, $element.width() + plugin.settings.margin);

            $tiles.each(function () {
                if ($(this).hasClass("ftg-hidden"))
                    return;

                var size = $(this).find(".crp-item").data("size");

                var slot = grid.insert(
                    size.width + plugin.settings.margin,
                    size.height + plugin.settings.margin,
                    plugin.settings.allowEnlargement);

                $(this).data("enlarged", slot.enlarged);


                var top = slot.position.y;
                var height = slot.blocks.v;

                var tileWidth = slot.blocks.h - plugin.settings.margin;
                var tileHeight = slot.blocks.v - plugin.settings.margin;

                if (top + tileHeight > maxHeight)
                    maxHeight = top + height + plugin.settings.margin;

                if (plugin.settings.addBlock1Height != false) {
                    tileHeight -= plugin.settings.addBlock1Height;
                }

                if (plugin.settings.addBlock2Height != false) {
                    tileHeight -= plugin.settings.addBlock2Height;
                }


                $(this).css({
                    top: top,
                    left: slot.position.x,
                    width: slot.blocks.h,
                    height: height
                });
                $(this).find('.tile-inner').css({
                    width: tileWidth,
                    height: tileHeight
                })
                    .data("width", tileWidth)
                    .data("height", tileHeight);

                if (plugin.settings.addBlock1Height != false) {
                    $(this).find('.tile-inner').css({
                        top: plugin.settings.addBlock1Height
                    });
                    $(this).find('.crp-additional-block1').css({
                        width: tileWidth,
                        height: plugin.settings.addBlock1Height
                    });
                }
                if (plugin.settings.addBlock2Height != false) {
                    $(this).find('.crp-additional-block2').css({
                        bottom: plugin.settings.margin,
                        width: tileWidth,
                        height: plugin.settings.addBlock2Height
                    });
                }

                $element.find(".ftg-items").height(maxHeight);
            });

            $tiles.find("img.crp-item").each(function (i, item) {
                var $item = $(item);
                var size = $item.data("size");

                var ratioImg = size.width / size.height;
                var ratioTile = $item.parent().data("width") / $item.parent().data("height");

                var bugFixDiff = 0;
                if (ratioImg >= ratioTile) {
                    $item.attr("case", "2");

                    var $h = $item.parent().data("height") + bugFixDiff;
                    var $w = ratioImg * $h;

                    $item.css({
                        width: $w,
                        height: $h
                    });

                    var diff = $w - $item.parent().data("width");
                    $item.css({
                        "margin-left": diff / -2,
                        "margin-top": bugFixDiff / -2,
                    });
                } else {
                    $item.attr("case", "4");

                    var $w = $item.parent().data("width") + bugFixDiff;
                    var $h = $w / ratioImg;

                    $item.css({
                        width: $w,
                        height: $h
                    });

                    var diff = $h - $item.parent().data("height");
                    $item.css({
                        "margin-top": diff / -2,
                        "margin-left": bugFixDiff / -2,
                    });
                }
            });

            if (!completed) {
                completed = true;
                plugin.settings.onComplete.call(plugin);
            } else {
                plugin.settings.onUpdate.call(plugin);
            }
        }

        plugin.init();
    }

    $.fn.crpTiledLayer = function (options) {
        return this.each(function () {
            if (undefined == $(this).data('crpTiledLayer')) {
                var plugin = new $.crpTiledLayer(this, options);
                $(this).data('crpTiledLayer', plugin);
            }
        });
    }
})(jQuery);
