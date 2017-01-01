angular.module("mosaic",[]);

angular.module("mosaic").controller("imageController",imageController);

imageController.$inject = ["$scope","$http","$q"];

function imageController($scope,$http,$q){
	var vm = this;
	vm.name = "Rahul";
	vm.imageName = undefined;
	vm.uploadImage = uploadImage;
	vm.imageFile = undefined;
	vm.init = init;
	vm.isLoading = false;

	var TILE = 0;
	var PADDING_PIXEL = (TILE <= 20) ? 20 : 10;
	var canvas_HEX_Matrix = [];
	var TOTAL_IMG_WIDTH = 0, TOTAL_IMG_HEIGHT = 0;
	var SVG_MATRIX = [];
	var PROMISE_MATRIX = [];
	var RESOLVED_PROMISE_ARRAY = [];
	var HTML_FILE_INPUT_ELEMENT = undefined;
	var SVG_CONTAINER = undefined;

	
	// the method is invoked when an Image is selected
	function uploadImage(e){
		angular.element(SVG_CONTAINER).html("");
		angular.element(SVG_CONTAINER).css("width","10px");
		angular.element(SVG_CONTAINER).css("height","10px");

		var input = e.target,imgObj = undefined, reader = undefined;
		vm.isLoading = true;
		try{
			reader = new FileReader();
			imgObj = new Image();

			reader.onloadend = function(e){								
				imgObj.src = reader.result;
				console.log("Width "+imgObj.width+", Height "+imgObj.height);
				
				TOTAL_IMG_HEIGHT = imgObj.height;
				TOTAL_IMG_WIDTH = imgObj.width;
				
				var w = ( (parseInt(TOTAL_IMG_WIDTH/TILE) * TILE ) <  TOTAL_IMG_WIDTH) ? (TOTAL_IMG_WIDTH + TILE) : TOTAL_IMG_WIDTH; 
				var h = ( (parseInt(TOTAL_IMG_HEIGHT/TILE) * TILE ) <  TOTAL_IMG_HEIGHT) ? (TOTAL_IMG_HEIGHT + TILE) : TOTAL_IMG_HEIGHT;

				
				console.log(" w "+w+", h "+h);
				w += "px";
				h += "px";

				angular.element(SVG_CONTAINER).css("width",w);
				angular.element(SVG_CONTAINER).css("height",h);

				
				fillCanvasMatrix(imgObj);				
				fillPromiseMatrix();
				fillSVGMatrix();				
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
		$q.all(RESOLVED_PROMISE_ARRAY).then(function(){
			vm.isLoading = false;
			var yTotal = SVG_MATRIX.length;
			var xTotal = 0;
			for(var y = 0; y < yTotal; y++){
				xTotal = SVG_MATRIX[y].length;

				for(var x = 0; x < xTotal; x++){
					angular.element(SVG_CONTAINER).append(SVG_MATRIX[y][x]);
				}
			}
		}).finally(function(){
			refresh();	
		});
	}

	// Creates an 2 dimensional matrix and fills it
	// with SVG tile's which we get from the promises present in
	// promise matrix.
	function fillSVGMatrix(){
		var yTotal = PROMISE_MATRIX.length;
		var xTotal = 0;
		var clojureFn = undefined;
		for(var y = 0; y < yTotal; y++){
			xTotal = PROMISE_MATRIX[y].length;
			SVG_MATRIX.push([]);

			for(var x = 0; x < xTotal; x++){
				SVG_MATRIX[y][x] = undefined;

				clojureFn = (function(row,column){
					var deferred = $q.defer();
					RESOLVED_PROMISE_ARRAY.push(deferred.promise);
					return fn;

					function fn(svgString){						
						deferred.resolve(svgString);						
						SVG_MATRIX[row][column] = svgString;	
					}
				})(y,x);

				PROMISE_MATRIX[y][x].then(clojureFn);
			}
		}
	}

	// create 2 dimensional matrix which holds
	// promise object, were the promise is of $http request
	// raised for getting the svg Tile.
	function fillPromiseMatrix(){
		var yTotal = canvas_HEX_Matrix.length;
		var xTotal = 0;
		
		for(var y = 0; y < yTotal; y++){
			xTotal = canvas_HEX_Matrix[y].length;
			PROMISE_MATRIX.push([]);
			for(var x = 0; x < xTotal; x++){
				//console.log(canvas_HEX_Matrix[y][x]);
				PROMISE_MATRIX[y][x] = getSVG(canvas_HEX_Matrix[y][x]);	
			}
		}
	}

	// creates a 2 dimensional matrix 
	// which holds canvas Tile's.
	function fillCanvasMatrix(imgObj){
		var total_x = TOTAL_IMG_WIDTH / TILE;
		var total_y = TOTAL_IMG_HEIGHT / TILE;
		var xPoint = 0, yPoint = 0, canvasObj = undefined, rgb = undefined,hex = 0;

		for(var y = 0; y < total_y; y++){
			canvas_HEX_Matrix.push([]);
			for(var x = 0; x < total_x; x++){
				canvasObj = image_Crop(imgObj,xPoint,yPoint);				
				rgb = getAvgRGB(canvasObj);
				hex = rgb2hex(rgb);

				canvas_HEX_Matrix[y][x] = hex;

				xPoint += TILE;	
			}

			yPoint += TILE;
			xPoint = 0;

		}
	}

	// divide a selected image in equal parts i.e. Tile,
	// where each part of image is converted to canvas.
	function image_Crop(imgObj,xP,yP){		
		var canvas = document.createElement("canvas");		
		var context = canvas.getContext('2d');		
      	canvas.width = TILE;
      	canvas.height = TILE;
      	context.drawImage(imgObj,xP,yP,TILE,TILE,0,0,TILE,TILE);      	
      	return canvas;
	}

	// Convert image to Canvas
	function convertImageToCanvas(imgObj){
		var canvas = document.createElement("canvas");		
		canvas.width = imgObj.width; 
		canvas.height = imgObj.height;
		canvas.getContext("2d").drawImage(imgObj,0,0);		
		return canvas;
	}

	// get an average RGB value of 
	// an Canvase Image. Each canvas image
	// is a selected Image Tile.
	function getAvgRGB(canvasObj){
		var rgb = {
			r : 0,
			g : 0,
			b : 0
		}
		
		var height = canvasObj.height, 
			width = canvasObj.width,
			i = -4,
			length = 0,
			count = 0,
			blockSize = 5,
			ctx = canvasObj.getContext("2d"); // only visit 5 pixels


		var	data = ctx.getImageData(0,0,width,height);

		length = data.data.length;

		while ( (i += blockSize * 4) < length ) {
	        ++count;
	        rgb.r += data.data[i];
	        rgb.g += data.data[i+1];
	        rgb.b += data.data[i+2];
    	}
    
	    // ~~ used to floor values
	    rgb.r = ~~(rgb.r/count);
	    rgb.g = ~~(rgb.g/count);
	    rgb.b = ~~(rgb.b/count);

	    return rgb; 	
	}

	// convert RGB color to its corresponding HEX value
	function rgb2hex(rgb){	
		return 	("0" + parseInt(rgb["r"],10).toString(16)).slice(-2) +
		  		("0" + parseInt(rgb["g"],10).toString(16)).slice(-2) +
		  		("0" + parseInt(rgb["b"],10).toString(16)).slice(-2) ;
	}


	// this method is called on controller initialization
	// 'init' method assign's initial values.
	function init(){
		HTML_FILE_INPUT_ELEMENT = document.getElementById("input");
		SVG_CONTAINER = document.querySelector("#svgHolder");
		angular.element(HTML_FILE_INPUT_ELEMENT).on("change",uploadImage);		
		
		// load an svg image to get the widh of tile
		// which is set in server.js
		getSVG("000000").then(function(svgTxt){
			var parser = new DOMParser();
			var doc = parser.parseFromString(svgTxt,"image/svg+xml");
			TILE = parseInt(doc.firstChild.getAttribute("width"));
		});
	}

	// unset the values which arr of old image,
	// as we need to reset the values when a new image is selected.
	function refresh(){		
		canvas_HEX_Matrix = [];
		TOTAL_IMG_WIDTH = 0, TOTAL_IMG_HEIGHT = 0;
		SVG_MATRIX = [];
		PROMISE_MATRIX = [];
		RESOLVED_PROMISE_ARRAY = [];		
	}

	// get an svg tile from server
	// each tile is an svg image of an average color
	// of the tile of the selected image.
	function getSVG(hex){
		var deferred = $q.defer();
		var url = "/color/"+hex;
		$http({
			'method' : 'GET',
			'url' : url
		}).then(function(response){
			deferred.resolve(response.data);			
		},function(error){
			deferred.resolve(error);			
		});

		return deferred.promise;
	}
}