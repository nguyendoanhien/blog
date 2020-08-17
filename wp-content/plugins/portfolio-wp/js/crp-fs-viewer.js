(function($) {
    //the class
    var crpFullScreenViewer = function(element, options){
        var target = "#" + $(element).attr("id");
        var plugin = this;

        //set default images view mode
        var $defaultViewMode="normal"; //full, normal, original
        var $tsMargin=30; //first and last thumbnail margin (for better cursor interaction)
        var $scrollEasing=600; //scroll easing amount (0 for no easing)
        var $scrollEasingType="easeOutCirc"; //scroll easing type
        var $thumbnailsContainerOpacity=0; //thumbnails area default opacity
        var $thumbnailsContainerMouseOutOpacity=0; //thumbnails area opacity on mouse out
        var $thumbnailsOpacity=0.6; //thumbnails default opacity
        var $nextPrevBtnsInitState="show"; //next/previous image buttons initial state ("hide" or "show")
        var $keyboardNavigation="on"; //enable/disable keyboard navigation ("on" or "off")

        //cache vars
        var $thumbnails_wrapper=$(target + " #thumbnails_wrapper");
        var $outer_container=$(target + " #outer_container");
        var $thumbScroller=$(target + " .thumbScroller");
        var $thumbScroller_container=$(target + " .thumbScroller .container");
        var $thumbScroller_content=$(target + " .thumbScroller .content");
        var $thumbScroller_thumb=$(target + " .thumbScroller .thumb");
        var $preloader=$(target + " #preloader");
        var $toolbar=$(target + " #toolbar");
        var $toolbar_a=$(target + " #toolbar a");
        var $bgimg=$(target + " #bgimg");
        var $img_title=$(target + " #img_title");
        var $nextImageBtn=$(target + " .nextImageBtn");
        var $prevImageBtn=$(target + " .prevImageBtn");
        var $viewModeBtn=$(target + " .viewModeBtn");

        var $nextViewMode="normal"; //full, normal, original

        var $totalContent=0;
        var $fadeSpeed=200;

        var the1stImg = null;
        var the1stImgSrc = "";

        if(options.bgsrc){
            the1stImgSrc = options.bgsrc;
        }

        $(window).load(function() {
            $toolbar.data("imageViewMode",$defaultViewMode); //default view mode
            if($defaultViewMode=="full"){
                $nextViewMode = "normal";
                $viewModeBtn.removeClass("maximize");
                $viewModeBtn.addClass("minimize");
                $viewModeBtn.attr("title", "Restore");
            } else {
                $nextViewMode = "full";
                $viewModeBtn.removeClass("minimize");
                $viewModeBtn.addClass("maximize");
                $viewModeBtn.attr("title", "Maximize");
            }

            ShowHideNextPrev($nextPrevBtnsInitState);
            //thumbnail scroller
            $thumbScroller_container.css("marginLeft",$tsMargin+"px"); //add margin
            var sliderLeft=$thumbScroller_container.position().left;
            var sliderWidth=$outer_container.width();
            $thumbScroller.css("width",sliderWidth);

            var $the_outer_container= $( target + " #outer_container" ).get( 0 ); //document.getElementById("outer_container");
            var $placement=findPos($the_outer_container);

            calcScrollerWidth();

            var idleTimer = null;
            var idleState = false;
            var idleWait = 600;

            $thumbScroller.mousemove(function(e){
                if($thumbScroller_container.width()>sliderWidth){
                    var mouseCoords=(e.pageX - $placement[1]);
                    var mousePercentX=mouseCoords/sliderWidth;
                    var destX=-(((($totalContent+($tsMargin*2))-(sliderWidth))-sliderWidth)*(mousePercentX));
                    var thePosA=mouseCoords-destX;
                    var thePosB=destX-mouseCoords;
                    if(mouseCoords>destX){
                        $thumbScroller_container.stop().animate({left: -thePosA}, $scrollEasing,$scrollEasingType); //with easing
                    } else if(mouseCoords<destX){
                        $thumbScroller_container.stop().animate({left: thePosB}, $scrollEasing,$scrollEasingType); //with easing
                    } else {
                        $thumbScroller_container.stop();
                    }
                }

                //Recalculate content width
                clearTimeout(idleTimer);
                if (idleState == true) {
                    // Reactivated event
                    calcScrollerWidth();
                }
                idleState = false;
                idleTimer = setTimeout(function () {
                    // Idle Event
                    idleState = true;
                }, idleWait);
            });

            $thumbnails_wrapper.fadeTo($fadeSpeed, $thumbnailsContainerOpacity);
            $thumbnails_wrapper.hover(
                function(){ //mouse over
                    var $this=$(this);
                    $this.stop().fadeTo("slow", 1);
                },
                function(){ //mouse out
                    var $this=$(this);
                    $this.stop().fadeTo("slow", $thumbnailsContainerMouseOutOpacity);
                }
            );

            $thumbScroller_thumb.hover(
                function(){ //mouse over
                    var $this=$(this);
                    $this.stop().fadeTo($fadeSpeed, 1);
                },
                function(){ //mouse out
                    var $this=$(this);
                    $this.stop().fadeTo($fadeSpeed, $thumbnailsOpacity);
                }
            );

            //on window resize scale image and reset thumbnail scroller
            $(window).resize(function() {
                if($(target).parent().css("display") == "none"){
                    return;
                }

                calcScrollerWidth();

                FullScreenBackground(target + " #bgimg",$bgimg.data("newImageW"),$bgimg.data("newImageH"));
                $thumbScroller_container.stop().animate({left: sliderLeft}, 400,"easeOutCirc");
                var newWidth=$outer_container.width();
                $thumbScroller.css("width",newWidth);
                sliderWidth=newWidth;
                $placement=findPos($the_outer_container);
            });

            //load 1st image
            the1stImg = new Image();
            the1stImg.onload = CreateDelegate(the1stImg, theNewImg_onload);
            //the1stImg.src = $($bgimg).attr("src");
            $outer_container.data("nextImage",$(target + " .content").first().next().find("a").attr("href"));
            $outer_container.data("prevImage",$(target + " .content").last().find("a").attr("href"));

            if(!$outer_container.data("nextImage") && !$outer_container.data("prevImage"))
                $thumbScroller.css("display","none");
        });

        function calcScrollerWidth(){
            $totalContent = 0;
            $thumbScroller_content.each(function () {
                var $this=$(this);
                $totalContent+=$this.innerWidth();
                $thumbScroller_container.css("width",$totalContent);
                $this.children().children().children(target + " .thumb").fadeTo($fadeSpeed, $thumbnailsOpacity);
            });
        }

        function loadFirstImage(){

        }

        function resetScroller(){

        }

        function updateBackground(){

        }

        this.loadThumbnails = function(){
            $thumbScroller_content.each(function () {
                var $this=$(this);

                var thumbSrc = $this.children().children(target + " .crp-thumb-a").attr("data-thumb");
                var thumb = $this.children().children().children(target + " .thumb");
                thumb.attr("src",thumbSrc);
            });
        }

        function BackgroundLoad($this,imageWidth,imageHeight,imgSrc){
            $this.fadeOut("fast",function(){
                $this.attr("src", "").attr("src", imgSrc); //change image source
                FullScreenBackground($this,imageWidth,imageHeight); //scale background image
                $preloader.fadeOut("fast",function(){$this.fadeIn("slow");});

                //Note: This functionality is disabled
                /*
                 var imageTitle=$img_title.data("imageTitle");
                 if(imageTitle){
                 $this.attr("alt", imageTitle).attr("title", imageTitle);
                 $img_title.fadeOut("fast",function(){
                 $img_title.html(imageTitle).fadeIn();
                 });
                 } else {
                 $img_title.fadeOut("fast",function(){
                 $img_title.html($this.attr("title")).fadeIn();
                 });
                 }
                 */
            });
        }

        //mouseover toolbar
        if($toolbar.css("display")!="none"){
            $toolbar.fadeTo("fast", 0.4);
        }
        $toolbar.hover(
            function(){ //mouse over
                var $this=$(this);
                $this.stop().fadeTo("fast", 1);
            },
            function(){ //mouse out
                var $this=$(this);
                $this.stop().fadeTo("fast", 0.4);
            }
        );

        //Clicking on thumbnail changes the background image
        $(target + " #outer_container a").click(function(event){
            event.preventDefault();
            var $this=$(this);
            GetNextPrevImages($this);
            GetImageTitle($this);
            SwitchImage(this);
            ShowHideNextPrev("show");
        });

        //next/prev images buttons
        $nextImageBtn.click(function(event){
            event.preventDefault();
            if(!$outer_container.data("nextImage"))
                return;

            SwitchImage($outer_container.data("nextImage"));
            var $this=$(target + " #outer_container a[href='"+$outer_container.data("nextImage")+"']");
            GetNextPrevImages($this);
            GetImageTitle($this);
        });

        $prevImageBtn.click(function(event){
            event.preventDefault();
            if(!$outer_container.data("prevImage"))
                return;

            SwitchImage($outer_container.data("prevImage"));
            var $this=$(target + " #outer_container a[href='"+$outer_container.data("prevImage")+"']");
            GetNextPrevImages($this);
            GetImageTitle($this);
        });

        $viewModeBtn.click(function(event){
            event.preventDefault();
            ImageViewMode($nextViewMode);
        });

        //next/prev images keyboard arrows
        if($keyboardNavigation=="on"){
            $(document).keydown(function(ev) {
                if(ev.keyCode == 39) { //right arrow
                    SwitchImage($outer_container.data("nextImage"));
                    var $this=$(target + " #outer_container a[href='"+$outer_container.data("nextImage")+"']");
                    GetNextPrevImages($this);
                    GetImageTitle($this);
                    return false; // don't execute the default action (scrolling or whatever)
                } else if(ev.keyCode == 37) { //left arrow
                    SwitchImage($outer_container.data("prevImage"));
                    var $this=$(target + " #outer_container a[href='"+$outer_container.data("prevImage")+"']");
                    GetNextPrevImages($this);
                    GetImageTitle($this);
                    return false; // don't execute the default action (scrolling or whatever)
                }
            });
        }

        function ShowHideNextPrev(state){
            if(state=="hide"){
                $nextImageBtn.fadeOut();
                $prevImageBtn.fadeOut();
            } else {
                $nextImageBtn.fadeIn();
                $prevImageBtn.fadeIn();
            }
        }

        //get image title
        function GetImageTitle(elem){
            //Note: This funciotnality is disabled
            /*
             var title_attr=elem.children("img").attr("title"); //get image title attribute
             $img_title.data("imageTitle", title_attr); //store image title
             */
        }

        //get next/prev images
        function GetNextPrevImages(curr){
            var nextImage=curr.parents(target + " .content").next().find("a").attr("href");
            if(nextImage==null){ //if last image, next is first
                var nextImage=$(target + " .content").first().find("a").attr("href");
            }
            $outer_container.data("nextImage",nextImage);
            var prevImage=curr.parents(target + " .content").prev().find("a").attr("href");
            if(prevImage==null){ //if first image, previous is last
                var prevImage=$(target + " .content").last().find("a").attr("href");
            }
            $outer_container.data("prevImage",prevImage);
        }

        //switch image
        function SwitchImage(img){
            $preloader.fadeIn("fast"); //show preloader
            var theNewImg = new Image();
            theNewImg.onload = CreateDelegate(theNewImg, theNewImg_onload);
            theNewImg.src = img;
        }

        //get new image dimensions
        function CreateDelegate(contextObject, delegateMethod){
            return function(){
                return delegateMethod.apply(contextObject, arguments);
            }
        }

        //new image on load
        function theNewImg_onload(){
            $bgimg.data("newImageW",this.width).data("newImageH",this.height);
            BackgroundLoad($bgimg,this.width,this.height,this.src);
        }

        //Image scale function
        function FullScreenBackground(theItem,imageWidth,imageHeight){
            var winWidth=$(window).width();
            var winHeight=$(window).height();
            if($toolbar.data("imageViewMode")!="original"){ //scale
                var picHeight = imageHeight / imageWidth;
                var picWidth = imageWidth / imageHeight;
                if($toolbar.data("imageViewMode")=="full"){ //fullscreen size image mode
                    if ((winHeight / winWidth) < picHeight) {
                        $(theItem).attr("width", winWidth);
                        $(theItem).attr("height",picHeight*winWidth);
                    } else {
                        $(theItem).attr("height",winHeight);
                        $(theItem).attr("width",picWidth*winHeight);
                    };
                } else { //normal size image mode
                    if ((winHeight / winWidth) > picHeight) {
                        $(theItem).attr("width",winWidth);
                        $(theItem).attr("height",picHeight*winWidth);
                    } else {
                        $(theItem).attr("height",winHeight);
                        $(theItem).attr("width",picWidth*winHeight);
                    };
                }

                $(theItem).css("margin-left",(winWidth-$(theItem).width())/2);
                $(theItem).css("margin-top",(winHeight-$(theItem).height())/2);
            } else { //no scale
                $(theItem).attr("width",imageWidth);
                $(theItem).attr("height",imageHeight);
                $(theItem).css("margin-left",(winWidth-imageWidth)/2);
                $(theItem).css("margin-top",(winHeight-imageHeight)/2);
            }
        }

        //Image view mode function - fullscreen or normal size
        function ImageViewMode(theMode){
            $toolbar.data("imageViewMode", theMode);
            FullScreenBackground($bgimg,$bgimg.data("newImageW"),$bgimg.data("newImageH"));
            if(theMode=="full"){
                $nextViewMode = "normal";
                $viewModeBtn.removeClass("maximize");
                $viewModeBtn.addClass("minimize");
                $viewModeBtn.attr("title", "Restore");
            } else {
                $nextViewMode = "full";
                $viewModeBtn.removeClass("minimize");
                $viewModeBtn.addClass("maximize");
                $viewModeBtn.attr("title", "Maximize");
            }
        }

        //function to find element Position
        function findPos(obj) {
            var curleft = curtop = 0;
            if (obj.offsetParent) {
                curleft = obj.offsetLeft
                curtop = obj.offsetTop
                while (obj = obj.offsetParent) {
                    curleft += obj.offsetLeft
                    curtop += obj.offsetTop
                }
            }
            return [curtop, curleft];
        }

        return {
            prepareToShow: function() {
                if(!the1stImg.src){
                    the1stImg.src = the1stImgSrc;
                }else{
                    $($bgimg).fadeOut(0,0);
                    $($bgimg).fadeIn("slow");
                }

                plugin.loadThumbnails();

                //Important FS bug fix
                jQuery(window).trigger("resize");
            }
        }
    }

    $.fn.crpFullScreenViewer = function (options) {
        //NOTE: single plugin with the same identifier
        var plugin = $(this).data('crpFullScreenViewer');
        if (undefined == plugin) {
            plugin = new crpFullScreenViewer(this, options);
            $(this).data('crpFullScreenViewer', plugin);
        }
        return plugin;
    }
})(jQuery);
