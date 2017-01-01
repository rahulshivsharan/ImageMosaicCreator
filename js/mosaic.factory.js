angular.module("mosaic").factory("mosaicService",mosaicService);

mosaicService.$inject = ["$http","$q"]

function mosaicService($http,$q){
	var obj = new Object();	
	
	obj.convertImageToCanvas = convertImageToCanvas;
	obj.createCanvasMatrix = createCanvasMatrix;
	obj.createPromiseMatrix = createPromiseMatrix;
	obj.createSVGMatrix = createSVGMatrix;
	obj.getSVG = getSVG;
	

	obj.TOTAL_IMG_WIDTH = 0;
	obj.TOTAL_IMG_HEIGHT = 0;
	obj.TILE = 0;

	obj.SVG_MATRIX = [];
	obj.PROMISE_MATRIX = [];
	obj.RESOLVED_PROMISE_ARRAY = [];	
	obj.canvas_HEX_Matrix = [];

	return obj;

	// Creates an 2 dimensional matrix and fills it
	// with SVG tile's which we get from the promises present in
	// promise matrix.
	function createSVGMatrix(){
		var yTotal = obj.PROMISE_MATRIX.length;
		var xTotal = 0;
		var clojureFn = undefined;
		
		

		for(var y = 0; y < yTotal; y++){
			xTotal = obj.PROMISE_MATRIX[y].length;
			obj.SVG_MATRIX.push([]);

			for(var x = 0; x < xTotal; x++){
				obj.SVG_MATRIX[y][x] = undefined;

				clojureFn = (function(row,column,o){
					var deferred = $q.defer();
					o.RESOLVED_PROMISE_ARRAY.push(deferred.promise);
					return fn;

					function fn(svgString){						
						deferred.resolve(svgString);						
						o.SVG_MATRIX[row][column] = svgString;	
					}
				})(y,x,obj);

				obj.PROMISE_MATRIX[y][x].then(clojureFn);
			}
		}
	}

	// create 2 dimensional matrix which holds
	// promise object, were the promise is of $http request
	// raised for getting the svg Tile.
	function createPromiseMatrix(){
		var yTotal = obj.canvas_HEX_Matrix.length;
		var xTotal = 0;
		obj.PROMISE_MATRIX = [];

		for(var y = 0; y < yTotal; y++){
			xTotal = obj.canvas_HEX_Matrix[y].length;
			obj.PROMISE_MATRIX.push([]);
			for(var x = 0; x < xTotal; x++){				
				obj.PROMISE_MATRIX[y][x] = getSVG(obj.canvas_HEX_Matrix[y][x]);	
			}
		}		
	}	

	// convert RGB color to its corresponding HEX value
	function rgb2hex(rgb){	
		return 	("0" + parseInt(rgb["r"],10).toString(16)).slice(-2) +
		  		("0" + parseInt(rgb["g"],10).toString(16)).slice(-2) +
		  		("0" + parseInt(rgb["b"],10).toString(16)).slice(-2) ;
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


	// divide a selected image in equal parts i.e. Tile,
	// where each part of image is converted to canvas.
	function imageCrop(imgObj,xP,yP){		
		var canvas = document.createElement("canvas");		
		var context = canvas.getContext('2d');		
      	canvas.width = obj.TILE;
      	canvas.height = obj.TILE;
      	context.drawImage(imgObj,xP,yP,obj.TILE,obj.TILE,0,0,obj.TILE,obj.TILE);      	
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

	// creates a 2 dimensional matrix 
	// which holds canvas Tile's.
	function createCanvasMatrix(imgObj){
		var total_x = obj.TOTAL_IMG_WIDTH / obj.TILE;
		var total_y = obj.TOTAL_IMG_HEIGHT / obj.TILE;
		var xPoint = 0, 
			yPoint = 0, 
			canvasObj = undefined, 
			rgb = undefined,
			hex = 0;
		
		obj.canvas_HEX_Matrix = [];

		for(var y = 0; y < total_y; y++){
			obj.canvas_HEX_Matrix.push([]);
			for(var x = 0; x < total_x; x++){
				canvasObj = imageCrop(imgObj,xPoint,yPoint);				
				rgb = getAvgRGB(canvasObj);
				hex = rgb2hex(rgb);

				obj.canvas_HEX_Matrix[y][x] = hex;
				xPoint += obj.TILE;	
			}

			yPoint += obj.TILE;
			xPoint = 0;
		}		 
	}

	
}

