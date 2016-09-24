(function(){
			var app = angular.module('app',[])
			app.run(function($rootScope){
				$rootScope.slides = [
		            {image: '../img/img00.jpg'},
		            {image: '../img/img01.jpg'},
		            {image: '../img/img02.jpg'},
		            {image: '../img/img03.jpg'},
		            {image: '../img/img04.jpg'}
	        	];
			})
			app.controller('MainCtrl',['$scope','preloader',function($scope,preloader){
	        	$scope.currentIndex = 0;
	        	$scope.setCurrentSlideIndex=function(index){
					$scope.currentIndex=index;
				};

				$scope.isCurrentSlideIndex=function(index){
					return $scope.currentIndex === index ;
				};

	        	$scope.nextSlide = function(){
					$scope.currentIndex = ($scope.currentIndex < $scope.slides.length -1)? ++$scope.currentIndex:0;
				}
				$scope.prevSlide = function(){
					$scope.currentIndex = ($scope.currentIndex>0)?--$scope.currentIndex:$scope.slides.length-1;
				}
				// Preload the images; then, update display when returned.
                preloader.preloadImages( $scope.slides ).then(
                    function handleResolve( imageLocations ) {
                        // Loading was successful.
                        $scope.isLoading = false;
                        $scope.isSuccessful = true;
                        console.info( "Preload Successful Now Measuring Performance");
                        preloader.getDifference( preloader.measurePerformance(imageLocations) );

                    },
                    function handleReject( imageLocation ) {
                        // Loading failed on at least one image.
                        $scope.isLoading = false;
                        $scope.isSuccessful = false;
                        console.error( "Image Failed", imageLocation );
                        console.info( "Preload Failure" );
                    },
                    function handleNotify( event ) {
                        $scope.percentLoaded = event.percent;
                        console.info( "Percent loaded:", event.percent );
                    }
                );

			}])

		// -------------------------------------------------- //
        // -------------------------------------------------- //
        // I provide a utility class for preloading image objects.
        app.service(
            "preloader",
            function( $q, $rootScope ) {
                // I manage the preloading of image objects. Accepts an array of image URLs.
                function Preloader( imageLocations ) {
                    // I am the image SRC values to preload.
                    this.imageLocations = $rootScope.slides;
                    // As the images load, we'll need to keep track of the load/error
                    // counts when announing the progress on the loading.
                    this.imageCount = this.imageLocations.length;
                    this.loadCount = 0;
                    this.errorCount = 0;
                    // I am the possible states that the preloader can be in.
                    this.states = {
                        PENDING: 1,
                        LOADING: 2,
                        RESOLVED: 3,
                        REJECTED: 4
                    };
                    // I keep track of the current state of the preloader.
                    this.state = this.states.PENDING;
                    // When loading the images, a promise will be returned to indicate
                    // when the loading has completed (and / or progressed).
                    this.deferred = $q.defer();
                    this.promise = this.deferred.promise;
                }
                // ---
                // STATIC METHODS.
                // ---
                // I reload the given images [Array] and return a promise. The promise
                // will be resolved with the array of image locations.
               	// ---
                // INSTANCE METHODS.
                // ---
                Preloader.prototype = {
                    // Best practice for "instnceof" operator.
                    constructor: Preloader,
                    preloadImages : function( imageLocations ) {
                    	//var preloader = new Preloader( imageLocations );
                    	return( this.load(imageLocations) );
                	},
                
                    // ---
                    // PUBLIC METHODS.
                    // ---
                    // I determine if the preloader has started loading images yet.
                    //-------------------------------------------------------
                    // using HTML5 timing API to measure actual load time for images
                    //-------------------------------------------------------
                    registerMark: function(name){
                    	window.performance.mark(name);
                    },
                    measurePerformance:function(data){
                    	
                    	for (var i=0;i<data.length;i++){
                    		window.performance.measure('Load time for '+data[i].image.match(/\w+\.\w+/g)+' is ',data[i].image.match(/\w+\.\w+/g)+"start",data[i].image.match(/\w+\.\w+/g)+"end")
                    	}
                    	return performance.getEntriesByType('measure')
                    },
                    getDifference:function getDifference(diff){
                    	for (var i=0;i<diff.length;i++){
                    		console.log(diff[i].name + diff[i].duration)
                    	}

                    },
                    clearPerformanceData:function(){

                    },
                    
                    isInitiated: function isInitiated() {
                        return( this.state !== this.states.PENDING );
                    },
                    // I determine if the preloader has failed to load all of the images.
                    isRejected: function isRejected() {
                        return( this.state === this.states.REJECTED );
                    },
                    // I determine if the preloader has successfully loaded all of the images.
                    isResolved: function isResolved() {
                        return( this.state === this.states.RESOLVED );
                    },
                    // I initiate the preload of the images. Returns a promise.
                    load: function load() {
                        // If the images are already loading, return the existing promise.
                        if ( this.isInitiated() ) {
                            return( this.promise );
                        }
                        this.state = this.states.LOADING;
                        for ( var i = 0 ; i < this.imageCount ; i++ ) {
                            this.loadImageLocation( this.imageLocations[i].image );
                        }
                        // Return the deferred promise for the load event.
                        return( this.promise );
                    },
                    // ---
                    // PRIVATE METHODS.
                    // ---
                    // I handle the load-failure of the given image location.
                    handleImageError: function handleImageError( imageLocation ) {
                        this.errorCount++;
                        // If the preload action has already failed, ignore further action.
                        if ( this.isRejected() ) {
                            return;
                        }
                        this.state = this.states.REJECTED;
                        this.deferred.reject( imageLocation );
                    },
                    // I handle the load-success of the given image location.
                    handleImageLoad: function handleImageLoad( imageLocation ) {
                        this.loadCount++;
                        // If the preload action has already failed, ignore further action.
                        if ( this.isRejected() ) {
                            return;
                        }
                        // Notify the progress of the overall deferred. This is different
                        // than Resolving the deferred - you can call notify many times
                        // before the ultimate resolution (or rejection) of the deferred.
                        this.deferred.notify({
                            percent: Math.ceil( this.loadCount / this.imageCount * 100 ),
                            imageLocation: imageLocation
                        });
                        // If all of the images have loaded, we can resolve the deferred
                        // value that we returned to the calling context.
                        if ( this.loadCount === this.imageCount ) {
                            this.state = this.states.RESOLVED;
                            this.deferred.resolve( this.imageLocations );
                        }
                    },
                    // I load the given image location and then wire the load / error
                    // events back into the preloader instance.
                    // --
                    // NOTE: The load/error events trigger a $digest.
                    loadImageLocation: function loadImageLocation( imageLocation ) {
                        var preloader = this;
                        // When it comes to creating the image object, it is critical that
                        // we bind the event handlers BEFORE we actually set the image
                        // source. Failure to do so will prevent the events from proper
                        // triggering in some browsers.
                        var image = new Image();
                        image.onload=function( event ) {
                        	        
                        			preloader.registerMark(event.target.src.match(/\w+\.\w+/g)+"end"); // image loaded
                                    // Since the load event is asynchronous, we have to
                                    // tell AngularJS that something changed.
                                    $rootScope.$apply(
                                        function() {
                                            preloader.handleImageLoad( event.target.src );
                                            // Clean up object reference to help with the
                                            // garbage collection in the closure.
                                            preloader = image = event = null;
                                        }
                                    );
                         };
                        image.onerror=function( event ) {
                                    // Since the load event is asynchronous, we have to
                                    // tell AngularJS that something changed.
                                    $rootScope.$apply(
                                        function() {
                                            preloader.handleImageError( event.target.src );
                                            // Clean up object reference to help with the
                                            // garbage collection in the closure.
                                            preloader = image = event = null;
                                        }
                                    );
                         }; 
                        preloader.registerMark(imageLocation.match(/\w+\.\w+/g)+"start");// image start to load 
                        image.src = imageLocation;
                        
                    }
                };
                // Return the factory instance.
                return( new Preloader() );
            }
        );

		})()