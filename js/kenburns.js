/**
 * Jquery Kenburns Image Gallery
 * Original author: John [at] Toymakerlabs
 * Further changes, comments: [at]Toymakerlabs
 * Licensed under the MIT license
 * 
 * Copyright (c) 2013 ToymakerLabs

 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, 
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions: The above copyright notice and this 
 * permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY 
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

;(function ($, window, document, undefined) {
    "use strict";
    
    /*  Plugin Parameters
     ------------------------------------------------------------------------------------------------- */
    var pluginName = 'kenburns',
        defaults = {
            images: [],
            duration: 4000,
            fadeSpeed: 1000,
            scale: 0.8,
            buffer: 5,
            loop: true,
            ease3d: 'linear',
            onInitiated: function () {},
            onLoadingComplete: function () {},
            onSlideComplete: function () {},
            onEnd: function (pluginInstance) {},
            getSlideIndex: function () {
                return this.currentSlide;
            }
        };

    function Plugin(element, options) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        var images = this.options.images;
        this.maxSlides = images[images.length - 1] ? images.length : images.length - 1; // IE8 bug fix
        this.slidesLoaded,
        this.instanceId,
        this.init();
    }

    /*  1. Initialization
     ------------------------------------------------------------------------------------------------- */

    /**
     * Init
     * Initial setup - dermines width, height
     */
    Plugin.prototype.init = function () {
        var that = this,
            list = that.options.images,
            buffer = that.options.buffer,
            $element = $(that.element);
        
        that.slidesLoaded = 0;
        that.instanceId = 0;
        that.width = $element.width();
        that.height = $element.height();

        this.imagesArray = [];

        for (var i in list) {
            if (list.hasOwnProperty(i)) {
                this.imagesArray[i] = {};
                this.imagesArray[i].loaded = false;
                if (i <= buffer) this.attachImage(list[i], "image" + i);
            }
        }
        
        that.options.onInitiated();
    };

    /*  2. Loading and Setup
     ------------------------------------------------------------------------------------------------- */

    /**
     * Attach image
     * creates a wrapper div for the image along with the image tag. The reason for the additional
     * wrapper is that we are transitioning multiple properties at the same time: scale, position, and
     * opacity. But we want opacity to finish first.
     */
    Plugin.prototype.attachImage = function (url, alt_text) {
        var that = this;
        
        //put the image in an empty div to separate the animation effects of fading and moving
        var $wrapper = $('<div/>', { class: 'kb-slide' }).css({'opacity':0});
        var $img = $("<img />", { 
            src: url,
            alt: alt_text
        });

        $wrapper.html($img);
        $img.css({'transform-origin': 'left top', 'scale' : + that.options.scale});

        //set up the image OBJ parameters - used to track loading and initial dimensions
        $img.load(function () {
            var index = that.slidesLoaded;
            var imgCache = that.imagesArray[index];
            imgCache.element = this;
            imgCache.loaded  = true;
            imgCache.width = $(this).width();
            imgCache.width = $(this).height();
            $(that.element).append($wrapper);
            that.slidesLoaded++;
            that.afterImageLoaded(index);
        });

    };

    /**
     * Called when an image has loaded
     * After the first image, the gallery transition will start
     * it also fires the complete action when all images finish loading
     */
    Plugin.prototype.afterImageLoaded = function (index) {
        var $element = $(this.element);

        //first image has loaded
        if(index == 0) {
            this.startTransition(0);
        }

        //fire complete event if all images have loaded
        if(this.checkLoadProgress()) {
            //fire the complete thing
            this.options.onLoadingComplete();
        }
    };

    //if any of the slides are not loaded, the set has not finished loading.
    Plugin.prototype.checkLoadProgress = function () {
        return this.slidesLoaded == this.maxSlides;
    };
    
    /**
     * Pauses the slideshow
     */
    Plugin.prototype.pause = function() {
        var that = this;
        this.active = false;

        $('.kb-slide').css('z-index', 1).transition({
            opacity: 0,
            duration: that.options.fadeSpeed,
            easing: that.options.ease3d
        });
        
        clearTimeout(this.timeout);
    };

    /**
     * Resumes the paused slideshow
     */
    Plugin.prototype.play = function () {

        clearTimeout(this.timeout);
        // Increase instanceId to abort scheduled transitions
        this.instanceId++;
        this.startTransition(this.currentSlide == this.maxSlides ? 0 : this.currentSlide );
    };

    /**
     * bufferImage
     * Checks, whether there are more images to load and then
     * loads the next image.
     */
    Plugin.prototype.bufferImage = function (index) {
        var that = this;
        var buffer = that.options.buffer;
        var list = that.options.images;
        var bufferIndex = index + buffer + 1;

        if (bufferIndex < list.length && !this.imagesArray[bufferIndex].loaded) {
            that.attachImage(list[bufferIndex], "image" + bufferIndex);
        }
    };

    /* 3. Transitions and Movement
     ------------------------------------------------------------------------------------------------- */

    /**
     * startTransition
     * Begins the Gallery Transition and tracks the current slide
     * Also manages loading - it will continue to loop from the beginning
     * if not all images have been loaded yet
     */
    Plugin.prototype.startTransition = function (start_index) {
        var that = this;
        this.currentSlide = start_index; //current slide
        that.active = true;
        that.doTimeout();
    };

    Plugin.prototype.doTimeout = function () {
        var that = this;
        clearTimeout(that.timeout);
        if (that.active) that.timeout = setTimeout(function () {
            that.doTimeout();
        }, that.options.duration);
        if (!that.checkLoadProgress()) that.bufferImage(that.currentSlide);

        //Check if the next slide is loaded. If not, wait.
        if (!this.imagesArray[that.currentSlide].loaded) {
            that.currentSlide = 0;
            that.doTimeout();
        } else {
            //if the next slide is loaded, go ahead and do the transition.
            that.transition3d();
            //Advance the current slide
            if (that.currentSlide < that.maxSlides - 1) {
                that.currentSlide++;
            } else {
                if (!that.options.loop && that.currentSlide == that.maxSlides - 1) {
                    clearTimeout(that.timeout);
                    that.active = false;
                    that.options.onEnd(that);
                }
                that.currentSlide = 0;
            }
        }
    };

    /**
     * chooseSide
     * This function chooses a random start side and a random end side
     * that is different from the start. This gives a random direction effect
     * it returns coordinates used by the transition functions.
     */
    Plugin.prototype.chooseSide = function () {
        var scale = this.options.scale,
            image = this.imagesArray[this.currentSlide].element,
            ratio = image.height/image.width,
            $element = $(this.element),
            w = $element.width(),
            h = $element.height(),
            inverse = Math.floor(Math.random() * 2),
            invRatio = image.width / image.height,
            sliderRatio = h / w,
            vertical = ratio > 1,
            useHeight = sliderRatio > ratio,
            sw = Math.floor((useHeight ? h * invRatio : w) * (1.0 / scale)),
            sh = Math.floor((useHeight ? h : w * ratio) * (1.0 / scale));

        $(image).width(sw).height(sh);

        var edges = useHeight ? [
            {x: 0, y: 0.5},
            {x: 1, y: 0.5}
        ] : [
            {x: 0.5, y: 0},
            {x: 0.5, y: 1}
        ];

        //Pick the first edge. Remove it from the array
        var choice = vertical ? Math.floor(Math.random() * 2) : inverse ? 0 : 1;
        var start = edges[choice];

        //Pick the second edge from the subset
        edges.splice(choice, 1);
        var end = edges[0];

        //build the new coordinates from the chosen coordinates
        return {
            startWidth: sw,
            startHeight: sh,
            startX: start.x * (w - sw * (inverse ? 1 : scale)),
            startY: start.y * (h - sh * (inverse ? 1 : scale)),
            endX: end.x * (w - sw * (inverse ? scale : 1)),
            endY: end.y * (h - sh * (inverse ? scale : 1)),
            inverse: inverse
        };

    };

    /**
     *  Transiton3D
     *  Transition3d Function works by setting the webkit and moz translate3d properties. These
     *  are hardware accellerated and give a very smooth animation. Since only one animation
     *  can be applied at a time, I wrapped the images in a div. The shorter fade is applied to
     *  the parent, while the translation and scaling is applied to the image.
     */
    Plugin.prototype.transition3d = function () {
        var that  = this,
            scale = this.options.scale,
            image = this.imagesArray[this.currentSlide].element,
            position = this.chooseSide(),
            index = this.currentSlide,
            myInstanceId = this.instanceId;

        //First clear any existing transition
        $(image).css({
            'position':'absolute',
            scale: (position.inverse ? 1 : scale),
            translate: [position.startX,position.startY]
        })
        .transition({
            scale: (position.inverse ? scale : 1),
            translate: [position.endX,position.endY],
            duration: that.options.duration,
            easing: that.options.ease3d,
            complete: function(){
                that.transitionOut(index, myInstanceId);
                that.options.onSlideComplete();
            }
        })            
        //Fade in the wrapper
        .parent().css('z-index', 3).transition({
            opacity: 1,
            duration: that.options.fadeSpeed,
            easing: that.options.ease3d
        });
    };

    Plugin.prototype.transitionOut = function (index, myInstanceId) {
        
        if (this.instanceId == myInstanceId){        
            var that = this,
                image = this.imagesArray[index].element;

            $(image).parent().css('z-index', 1)
                .transition({
                    opacity: 0,
                    duration: that.options.fadeSpeed,
                    easing: that.options.ease3d
                });
        }
    };

    /* 4. Utility Functions
     ------------------------------------------------------------------------------------------------- */

    $.fn[pluginName] = function (options) {

        if (!$.data(this, 'plugin_' + pluginName)) {
            var plugin = new Plugin(this, options);
            $.data(this, 'plugin_' + pluginName, plugin);
            return plugin;
        }        
    }

})(jQuery, window, document);
