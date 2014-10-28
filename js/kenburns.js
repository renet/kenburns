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

    /*  Plugin Parameters
     ------------------------------------------------------------------------------------------------- */
    var pluginName = 'kenburns',
        defaults = {
            images: [],
            duration: 400,
            fadeSpeed: 500,
            scale: 1,
            buffer: 5,
            loop: true,
            ease3d: 'linear',
            onInitiated: function () {},
            onLoadingComplete: function () {},
            onSlideComplete: function () {},
            onEnd: function (pluginInstance) {},
            getSlideIndex: function () {
                return currentSlide;
            }
        };

    var imagesObj = {};
    var currentSlide = 0;

    function Plugin(element, options) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        var images = this.options.images;
        this.maxSlides = images[images.length - 1] ? images.length : images.length - 1; // IE8 bug fix

        this.init();
    }

    /*  1. Initialization
     ------------------------------------------------------------------------------------------------- */

    /**
     * Init
     * Initial setup - dermines width, height, and adds the loading icon.
     */
    Plugin.prototype.init = function () {

        var that = this;
        var list = that.options.images;
        var buffer = that.options.buffer;
        var $element = $(that.element);

        that.width = $element.width();
        that.height = $element.height();

        that.has3d = has3DTransforms();

        for (var i in list) {
            if (list.hasOwnProperty(i)) {
                imagesObj["image" + i] = {};
                imagesObj["image" + i].loaded = false;
                if (i <= buffer) that.attachImage(list[i], "image" + i, i);
            }
        }

        var loader = $('<div/>');
        loader.addClass('kb-loader');
        loader.css({'position': 'absolute', 'z-index': 4});
        var timer = $('<div/>');
        timer.addClass('kb-timer');
        timer.css({'position': 'absolute', 'z-index': 4});
        $element.prepend(loader).prepend(timer);
        that.options.onInitiated();
    };

    /*  2. Loading and Setup
     ------------------------------------------------------------------------------------------------- */

    /**
     * Attach image
     * creates a wrapper div for the image along with the image tag. The reason for the additional
     * wrapper is that we are transitioning multiple properties at the same time: scale, position, and
     * opacity. But we want opacity to finish first. This function also determines if the browser
     * has 3d transform capabilities and initializes the starting CSS values.
     */
    Plugin.prototype.attachImage = function (url, alt_text, index) {
        var that = this;

        //put the image in an empty div to separate the animation effects of fading and moving
        var wrapper = $('<div/>');
        wrapper.attr('class', 'kb-slide');
        wrapper.css({'opacity': 0});

        var img = $("<img/>");
        img.attr('src', url);
        img.attr('alt', alt_text);

        wrapper.html(img);

        //First check if the browser supports 3D transitions, initialize the CSS accordingly
        if (this.has3d) {
            img.css({'-webkit-transform-origin': 'left top'});
            img.css({'-moz-transform-origin': 'left top'});
            img.css({'-webkit-transform': 'scale(' + that.options.scale + ') translate3d(0,0,0)'});
            img.css({'-moz-transform': 'scale(' + that.options.scale + ') translate3d(0,0,0)'});
        }

        //Switch the transition to the 3d version if it does exist
        this.doTransition = (this.has3d) ? this.transition3d : this.transition;


        //set up the image OBJ parameters - used to track loading and initial dimensions
        img.load(function () {
            imagesObj["image" + index].element = this;
            imagesObj["image" + index].loaded = true;
            imagesObj["image" + index].width = $(this).width();
            imagesObj["image" + index].height = $(this).height();
            that.insertAt(index, wrapper);
            that.resume(index);
        });

    };

    /**
     * Resume
     * Resume will continue the transition after the stalled image loads
     * it also fires the complete action when the series of images finishes loading
     */
    Plugin.prototype.resume = function (index) {

        //first image has loaded
        if (index == 0) {
            this.startTransition(0);
            $(this.element).find('.kb-loader').hide();

        }

        //if the next image hasnt loaded yet, but the transition has started,
        // this will match the image index to the image holding the transition.
        // it will then resume the transition.
        if (index == this.holdup) {
            $(this.element).find('.kb-loader').hide();
            this.startTransition(this.holdup);
        }

        //if the last image in the set has loaded, add the images in order
        if (this.checkLoadProgress()) {
            //reset the opacities and z indexes except the last and first images
            $(this.element).find('.stalled').each(function () {
                $(this).css({'opacity': 1, 'z-index': 1});
                $(this).removeClass('stalled');
            });

            //fire the complete thing
            this.options.onLoadingComplete();
        }
    };

    //if any of the slides are not loaded, the set has not finished loading.
    Plugin.prototype.checkLoadProgress = function () {
        var imagesLoaded = true;
        for (var i = 0; i < this.maxSlides; i++) {
            if (!imagesObj["image" + i].loaded) {
                imagesLoaded = false;
            }
        }
        return imagesLoaded;
    };

    /**
     * Wait
     * Stops the transition timeout, shows the loader and
     * applies the stalled class to the visible image.
     */
    Plugin.prototype.wait = function () {
        clearTimeout(this.timeout);
        $(this.element).find('.kb-loader').show();

        var image = imagesObj["image" + (currentSlide - 1)].element;
        $(image).parent().stop(true, true);
        $(image).parent().addClass('stalled');
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

        if (bufferIndex < list.length && !imagesObj["image" + bufferIndex].loaded) {
            that.attachImage(list[bufferIndex], "image" + bufferIndex, bufferIndex);
        }
    };

    /* 3. Transitions and Movement
     ------------------------------------------------------------------------------------------------- */

    /**
     * startTransition
     * Begins the Gallery Transition and tracks the current slide
     * Also manages loading - if the timeout encounters a slide
     * that has not loaded, the transition pauses.
     */
    Plugin.prototype.startTransition = function (start_index) {
        var that = this;
        currentSlide = start_index; //current slide
        that.active = true;
        that.doTimeout();
    };

    Plugin.prototype.stop = function () {
        this.active = false;
    };

    Plugin.prototype.start = function () {
        this.startTransition(currentSlide);
    };

    Plugin.prototype.doTimeout = function () {
        var that = this;
        clearTimeout(that.timeout);
        if (that.active) that.timeout = setTimeout(function () {
            that.doTimeout();
        }, that.options.duration);
        if (!that.checkLoadProgress()) that.bufferImage(currentSlide);

        //Check if the next slide is loaded. If not, wait.
        if (!imagesObj["image" + currentSlide].loaded) {
            that.holdup = currentSlide;
            that.wait();
        } else {
            //if the next slide is loaded, go ahead and do the transition.
            that.doTransition();
            //Advance the current slide
            if (currentSlide < that.maxSlides - 1) {
                currentSlide++;
            } else {
                if (!that.options.loop && currentSlide == that.maxSlides - 1) {
                    clearTimeout(that.timeout);
                    that.active = false;
                    that.options.onEnd(that);
                }
                currentSlide = 0;
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
        var scale = this.options.scale;
        var image = $(imagesObj["image" + currentSlide].element);
        var w = $(this.element).width();
        var h = $(this.element).height();
        var inverse = Math.floor(Math.random() * 2);

        var ratio = image.height() / image.width();
        var invRatio = image.width() / image.height();
        var sliderRatio = h / w;
        var vertical = ratio > 1;
        var useHeight = sliderRatio > ratio;
        var sw = Math.floor((useHeight ? h * invRatio : w) * (1.0 / scale));
        var sh = Math.floor((useHeight ? h : w * ratio) * (1.0 / scale));

        image.width(sw);
        image.height(sh);

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
        var that = this;
        var scale = this.options.scale;
        var image = $(imagesObj["image" + currentSlide].element);
        var position = this.chooseSide();

        //First clear any existing transition
        image.css('position', 'absolute');
        image.css({'-webkit-transition': 'none'});
        image.css({'-moz-transition': 'none'});
        image.css({'-webkit-transform': 'scale(' + (position.inverse ? 1 : scale) + ') translate3d(' + position.startX + 'px,' + position.startY + 'px,0)'});
        image.css({'-moz-transform': 'scale(' + (position.inverse ? 1 : scale) + ') translate3d(' + position.startX + 'px,' + position.startY + 'px,0)'});

        //Set the wrapper to fully transparent and start it's animation
        image.parent().css({'opacity': 0, 'z-index': 3});
        image.parent().animate({'opacity': 1}, that.options.fadeSpeed);

        //Add the transition back in
        image.css({'-webkit-transition': '-webkit-transform ' + (that.options.duration + that.options.fadeSpeed) + 'ms ' + that.options.ease3d});
        image.css({'-moz-transition': '-moz-transform ' + (that.options.duration + that.options.fadeSpeed) + 'ms ' + that.options.ease3d});
        image.parent().parent().find('.kb-timer').animate({width: "100%"}, that.options.duration, 'linear', function () {
            $(this).width(0);
        });

        //set the end position and scale, which fires the transition
        image.css({'-webkit-transform': 'scale(' + (position.inverse ? scale : 1) + ') translate3d(' + position.endX + 'px,' + position.endY + 'px,0)'});
        image.css({'-moz-transform': 'scale(' + (position.inverse ? scale : 1) + ') translate3d(' + position.endX + 'px,' + position.endY + 'px,0)'});

        this.transitionOut();
        this.options.onSlideComplete();
    };

    /**
     *  Transition
     *  The regular JQuery animation function. Sets the currentSlide initial scale and position to
     *  the value from chooseSide before triggering the animation. It starts the image moving to
     *  the new position, starts the fade on the wrapper, and delays the fade out animation. Adding
     *  fadeSpeed to duration gave me a nice crossfade so the image continues to move as it fades out
     *  rather than just stopping.
     */

    Plugin.prototype.transition = function () {
        var that = this;
        var scale = this.options.scale;
        var image = $(imagesObj["image" + currentSlide].element);
        var position = this.chooseSide();

        image.css('position', 'absolute');
        image.animate({'left': position.startX, 'top': position.startY, 'width': position.startWidth * (position.inverse ? 1 : scale), 'height': position.startHeight * (position.inverse ? 1 : scale)}, 0);
        image.animate({'left': position.endX, 'top': position.endY, 'width': position.startWidth * (position.inverse ? scale : 1), 'height': position.startHeight * (position.inverse ? scale : 1)}, that.options.duration + that.options.fadeSpeed, 'linear');
        image.parent().parent().find('.kb-timer').animate({width: "100%"}, that.options.duration, 'linear', function () {
            $(this).width(0);
        });

        image.parent().css({'opacity': 0, 'z-index': 3});
        image.parent().animate({'opacity': 1}, that.options.fadeSpeed);

        this.transitionOut();
        this.options.onSlideComplete();
    };

    Plugin.prototype.transitionOut = function () {
        var that = this;
        var image = $(imagesObj["image" + currentSlide].element);

        image.parent().delay(currentSlide < that.maxSlides - 1 ? that.options.duration : that.options.duration - that.options.fadeSpeed).animate({'opacity': 0}, that.options.fadeSpeed, function () {
            $(this).css({'z-index': 1});
        });
    };

    /* 4. Utility Functions
     ------------------------------------------------------------------------------------------------- */
    /**
     *  has3DTransforms
     *  Tests the browser to determine support for Webkit and Moz Transforms
     *  Creates an element, translates the element, and tests the values. If the
     *  values return true, the browser supports 3D transformations.
     */
    function has3DTransforms() {
        var el = document.createElement('p'),
            has3d,
            transforms = {
                'WebkitTransform': '-webkit-transform',
                'MozTransform': '-moz-transform'
            };

        document.body.insertBefore(el, null);

        for (var t in transforms) {
            if (transforms.hasOwnProperty(t) && el.style[t] !== undefined) {
                el.style[t] = "translate3d(1px,1px,1px)";
                has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
            }
        }

        document.body.removeChild(el);
        return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
    }

    /**
     *  insertAt
     *  Utility function that inserts objects at a specific index
     *  Used to maintain the order of images as they are loaded and
     *  added to the DOM
     */
    Plugin.prototype.insertAt = function (index, element) {
        var lastIndex = $(this.element).children().size();
        if (index < 0) {
            index = Math.max(0, lastIndex + 1 + index);
        }
        $(this.element).append(element);
        if (index < lastIndex) {
            $(this.element).children().eq(index).before($(this.element).children().last());
        }
    };

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                    new Plugin(this, options));
            }
        });
    }

})(jQuery, window, document);
