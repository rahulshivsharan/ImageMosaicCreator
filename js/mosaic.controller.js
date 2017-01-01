angular.module("mosaic").controller("mosaicController",mosaicController);

mosaicController.$inject = ["$scope","$http","$q","mosaicService"];

function mosaicController($scope,$http,$q,mosaicService){
	var vm = this;
	vm.imageName = undefined;
	vm.imageFile = undefined;
	vm.isLoading = false;// flag used to show loading image	
	
	vm.init = init;	// init function invoked on controller load
	
	mosaicService.canvas_HEX_Matrix = []; // 2D matrix holds hex values of image tiles	
	mosaicService.SVG_MATRIX = []; // 2D matrix holds svg images which we get from server
	mosaicService.PROMISE_MATRIX = []; // 2D matrix holds promise objects which we get from getSVG method 
	mosaicService.RESOLVED_PROMISE_ARRAY = []; // is an array to hold all the promises
	
	
	var HTML_FILE_INPUT_ELEMENT = undefined;
	var SVG_CONTAINER = undefined;

	mosaicService.TILE = 0;	
	mosaicService.TOTAL_IMG_WIDTH = 0; // total image Width
	mosaicService.TOTAL_IMG_HEIGHT = 0; // total image height
	

	// the method is invoked when an Image is selected
	function uploadImage(e){
		angular.element(SVG_CONTAINER).html("");
		angular.element(SVG_CONTAINER).css("width","10px");
		angular.element(SVG_CONTAINER).css("height","10px");

		var input = e.target,
			imgObj = undefined,
			reader = undefined;

		vm.isLoading = true;
		try{
			reader = new FileReader();
			imgObj = new Image();

			reader.onloadend = function(e){								
				imgObj.src = reader.result;
				console.log("Width "+imgObj.width+", Height "+imgObj.height);
				
				mosaicService.TOTAL_IMG_HEIGHT = imgObj.height;
				mosaicService.TOTAL_IMG_WIDTH = imgObj.width;
				
				var ht = imgObj.height, 
					wd = imgObj.width; 
				
				var w = ( (parseInt(wd/mosaicService.TILE) * mosaicService.TILE ) <  wd) ? (wd + mosaicService.TILE) : wd; 
				var h = ( (parseInt(ht/mosaicService.TILE) * mosaicService.TILE ) <  ht) ? (ht + mosaicService.TILE) : ht;

				
				console.log(" w "+w+", h "+h);
				w += "px";
				h += "px";

				angular.element(SVG_CONTAINER).css("width",w);
				angular.element(SVG_CONTAINER).css("height",h);

				
				mosaicService.createCanvasMatrix(imgObj);				
				mosaicService.createPromiseMatrix();
				mosaicService.createSVGMatrix();				
				displayImages();				
			}

			reader.readAsDataURL(input.files[0]);
			vm.imageFile = input.files[0];
			
		}catch(e){
			console.log(e);
		}
	}

	// iterate through SVG matrix and load it on UI,
	// only when all the SVG tiles are resolved from promise's present
	// in promise matrix.
	function displayImages(){
		$q.all(mosaicService.RESOLVED_PROMISE_ARRAY).then(function(){
			vm.isLoading = false;
			var yTotal = mosaicService.SVG_MATRIX.length;
			var xTotal = 0;
			for(var y = 0; y < yTotal; y++){
				xTotal = mosaicService.SVG_MATRIX[y].length;

				for(var x = 0; x < xTotal; x++){
					angular.element(SVG_CONTAINER).append(mosaicService.SVG_MATRIX[y][x]);
				}
			}
		}).finally(function(){
			refresh();	
		});
	}

	// unset the values which arr of old image,
	// as we need to reset the values when a new image is selected.
	function refresh(){			
		mosaicService.TOTAL_IMG_WIDTH = 0;
		mosaicService.TOTAL_IMG_HEIGHT = 0;
		
		mosaicService.SVG_MATRIX = [];
		mosaicService.PROMISE_MATRIX = [];
		mosaicService.RESOLVED_PROMISE_ARRAY = [];
		mosaicService.canvas_HEX_Matrix = [];		
	}

	// this method is called on controller initialization
	// 'init' method assign's initial values.
	function init(){
		HTML_FILE_INPUT_ELEMENT = document.getElementById("input");
		SVG_CONTAINER = document.querySelector("#svgHolder");
		angular.element(HTML_FILE_INPUT_ELEMENT).on("change",uploadImage);		
		
		// load an svg image to get the widh of tile
		// which is set in server.js
		mosaicService.getSVG("000000").then(function(svgTxt){
			var parser = new DOMParser();
			var doc = parser.parseFromString(svgTxt,"image/svg+xml");
			mosaicService.TILE = parseInt(doc.firstChild.getAttribute("width"));
		});
	}		

}