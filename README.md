Kenburns
========
 Kenburns.js is a lightweight and flexible Jquery gallery plugin that loads a list of images and transitions them using a pan-and-zoom, _[Ken Burns](http://en.wikipedia.org/wiki/Ken_Burns_effect)_ style effect. 
 
Example: <http://www.toymakerlabs.com/kenburns>

Overview & Features
-------------------
Dude, another Jquery gallery? Wait, wait! Before you go, this one actually does a few pretty neat things: 

* Uses super smooth webkit and moz transitions
* Built in feature detection for CSS3 transforms
* Uses Jquery Animations when CSS3 transforms are not available
* Loads images in parallel but maintains the gallery order
* Built-in event callbacks for loading complete, and transition complete

Browser Support
-------
Testing conducted in: ie8 +, Chrome 18.0.1025.165, Safari 5+6, Firefox 11, and iOS 5.

Usage
-------------------
Basic plugin use looks like this:

    $("#wrapper").Kenburns({
        images:["image0.jpg", "image2.jpg"],
        scale:1,
        duration:6000,
        fadeSpeed:800,
        ease3d:ease-out
    })

Example
------------
#####1. HTML
First create a wrapper element. For movement to take place, the wrapper must be smaller than the smallest image multiplied by the scale. See the _**how it works**_ section for info on how to appropriately size your wrapper and images. 

        <div id="kenburns-slideshow"></div>  
    
######2. CSS
Include the the CSS. The plugin wraps images in divs with a class of _.kb-slide_. _**Note**_: Position:relative on the IMG tag is used to defeat an IE8 opacity bug. 

######3. SCRIPT
Then initialize the plugin. In the example below, it should log the current slide and a message when loading has completed. 

    var burns = $("#wrapper").kenburns({
        images:[
            "images/image0.jpg", 
            "images/image1.jpg",
            "images/image2.jpg",
            "images/image3.jpg",
            "images/image4.jpg"
            ],
        scale:1,
        duration:6000,
        fadeSpeed:800,
        ease3d:'ease-out',
        onSlideComplete: function(){
            console.log('slide ' + this.getSlideIndex());
        },
        onLoadingComplete: function(){
            console.log('image loading complete');
        }
    });

burns.pause() and burns.play() can now be used to pause and resume the slideshow.

List of Parameters
-------------------
The following parameters are used to control the image loading, movement, and transition time. 

######images: [ ]
Array containing strings of image URLs 

######scale: _(0-1)_
Initial scaling of images. Value Range: 0-1. Produces a zooming effect when animating. Scaling images **down** initially allows us to transition them to their original sizes, therby eliminating any possible fuzziness.
    
######duration: _ms_
Millisecond value representing the transition duration time.

######fadeSpeed: _ms_
Millisecond value representing how long the transition will last *Note: The plugin adds fadeSpeed to duration to produce a nifty cross-fading effect.

######buffer: _integer_
Amount of pictures being pre-loaded.

######ease3d: _'string'_
Optional string value to control the easing of the transition. Accepts CSS3 easing functions like 'ease-out', 'ease-in-out', 'cubic-bezier()'.

######onSlideComplete: _function()_
A callback when each slide completes its transition. Used for things like changing the text relating to the image, etc.

######getSlideIndex: _function()_
A public function that returns the index of the current slide.

######onLoadingComplete: _function()_
A callback function when the images have finished loading.

Dependencies
-----
jQuery 1.8.2+.

Tested with jQuery 1.8.2 and 2.1.1, but will probably work fine in previous versions, as well. 

Credits
------
by René Schubert<br/>
<http://www.reneschubert.net>

based on the Plugin<br/>
by John the Toymaker<br/>
John @ Toymakerlabs<br/>
<http://www.toymakerlabs.com>

Special thanks to: The [jQuery](http://www.jquery.com/) team and the [jQuery plugin boilerplate](http://jqueryboilerplate.com). And of course, as always, Stackoverflow and Google, and books, and greek-yogurt, and Boddingtons. And Crepevine.  

*Note This plugin only draws stylistic inspiration and is in no way affiliated with or endorsed by filmmaker Ken Burns. 
