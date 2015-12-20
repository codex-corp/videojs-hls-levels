/**
 * Based on https://github.com/pivotshare/videojs-levels
 * Copyright (c) 2015 Hany alsamman
 * Licensed under the Apache-2.0 license.
 **/

(function () {
    /* jshint eqnull: true*/
    /* global require */
    'use strict';
    var videojs = null;

    if (typeof window.videojs === 'undefined' && typeof require === 'function') {
        videojs = require('video.js');
    } else {
        videojs = window.videojs;
    }

    (function (window, videojs) {
        'use strict';

        var defaults = {};
        //var Hls = new videojs.getComponent('Hlsjs');

        /**
         * Return currently used MediaTechController.
         *
         * @method Player.getTech
         * @return MediaTechController
         */
        videojs.getComponent('Player').prototype.getTech = function () {
            for (var key in this) {
                if (this[key] instanceof videojs.getComponent('MediaTechController')) {
                    return this[key];
                }
            }
            return null;
        };

        videojs.getComponent('Player').prototype.isSoftHLS = function () {
            return ($('.vjs-tech').attr('id').indexOf("Hlsjs") >= 0);
        };

        /**
         * Return MediaTechController's HTML Element.
         *
         * @method MediaTechController.getEl
         * @return HTMLElement
         */
        videojs.getComponent('MediaTechController').prototype.getEl = function () {
            for (var key in this) {
                if (this[key] instanceof HTMLElement) {
                    return this[key];
                }
            }
            return null;
        };

        /**
         * Return MenuButton's MenuItems.
         *
         * @method MenuButton.getItems
         * @return MenuItem[]
         */
        var MenuButton = videojs.getComponent('MenuButton');

        /**
         * Get Levels.
         * This provides interface to either Player tech.
         *
         * @method getLevels
         * @return Levels[]
         */
        videojs.getComponent('Player').prototype.getLevels = function () {
            return this.getTech().getLevels();
        };

        /**
         * Set current level.
         * This provides interface to either Player tech.
         *
         * @method setLevel
         * @param  {Number} level
         * @return Levels[]
         */
        videojs.getComponent('Player').prototype.setLevel = function (level) {
            this.getTech().setLevel(level);
        };

        //
        // [FLASH] getLevels/setLevel implementation
        //

        videojs.getComponent('Flash').prototype.getLevels = function () {
            return this.getEl().vjs_getProperty('levels') || [];
        };

        videojs.getComponent('Flash').prototype.setLevel = function (level) {
            this.getEl().vjs_setProperty('level', level);
        };

        //
        // [Html5] getLevels/setLevel implementation
        //

        videojs.getComponent('Html5').prototype.getLevels = function () {
            return this.hls_.levels;
        };

        videojs.getComponent('Html5').prototype.setLevel = function (level) {
            this.hls_.level = (!level) ? -1 : level;
        };
        var MenuItem = videojs.getComponent('MenuItem');

        videojs.MenuItemTest = videojs.extend(MenuItem, {

            constructor: function (player, options, onClickListener) {
                this.onClickListener = onClickListener;

                // Call the parent constructor
                MenuItem.call(this, player, options);
                this.on('click', this.onClick);
                this.on('touchstart', this.onClick);

            },
            onClick: function () {
                this.onClickListener(this);
                var selected = (player.isSoftHLS()) ? this.options_.el.value : this.options_.value;
                player.setLevel(selected);
            }
        });

        /**
         * LevelsMenuButton
         */
        videojs.levelsMenuButton = videojs.extend(MenuButton, {

            className: 'vjs-menu-button-levels ',

            init: function (player, options) {

                videojs.getComponent('MenuButton').call(this, player, options);

                this.controlText('Quality');

                var staticLabel = document.createElement('span');
                staticLabel.classList.add('vjs-levels-button-staticlabel');
                this.el().appendChild(staticLabel);

            },

            createItems: function () {

                var component = this;
                var player = component.player();
                var levels = player.getLevels();
                var item;
                var menuItems = [];

                if (!levels.length) {
                    return [];
                }

                // Prepend levels with 'Auto' item
                levels = [{
                    name: 'Auto',
                    index: -1
                }].concat(levels);

                var onClickUnselectOthers = function (clickedItem) {
                    menuItems.map(function (item) {
                        if ($(item.el()).hasClass('vjs-selected')) {
                            $(item.el()).removeClass('vjs-selected');
                        }
                    });
                    $(clickedItem.el()).addClass('vjs-selected');
                };

                return levels.map(function (level, index) {

                    // Select a label based on available information
                    // name and height are optional in manifest
                    var levelName;

                    if (level.name) {
                        levelName = level.name;
                    } else if (level.height) {
                        levelName = level.height + 'p';
                    } else {
                        //levelName = Math.round(level.bitrate / 1000) + ' Kbps';
                        if (level.bitrate) {
                            levelName = (Math.round(level.bitrate / 1024) + 'kb');
                        } else {
                            return null;
                        }
                    }

                    item = new videojs.MenuItemTest(player, {
                        el: videojs.getComponent('Component').prototype.createEl('li', this, {
                            label: levelName,
                            value: index,
                            class: 'vjs-menu-item'
                            //tabIndex: 0,
                        })
                    }, onClickUnselectOthers);

                    /**
                     * Store MenuButton's MenuItems.
                     * @return object
                     */
                    menuItems.push(item);

                    if (level.name === 'Auto') {
                        $(item.el()).addClass('vjs-selected');
                    }
                    $(item.el()).html(levelName);

                    return item;
                });
            }

        });

        // register the plugin
        videojs.plugin('levels', function (options) {

            var settings = videojs.mergeOptions(defaults, options);
            var player = this;
            var button = null;

            player.on('loadedmetadata', function (evt) {
                if (button) {
                    button.dispose();
                }
                button = new videojs.levelsMenuButton(player, settings);
                button.el().classList.add('vjs-menu-button-levels');

                player.controlBar.addChild(button);
            });
        });

    })(window, videojs);

})();
