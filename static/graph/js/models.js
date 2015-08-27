
	var AnnotationModel = Backbone.Model.extend({
		url: "/graph/find"
	});

	var GraphModel = Backbone.Model.extend({
		//url: "/graph/plot",
		defaults: {
			colors: ['rgb(237,194,64)'],
			ydata: [{label: "Series0", data: [[0, 3], [4, 8], [8, 5], [9, 13]]}],
			xLabel: 'x variable',
			yLabel: 'y variable',
			xmax: 1000,
			title: 'graph title',
			useCanvas: false,
			axisLabelPadding: 5,
			tickSize: 1
		},
		initialize: function(){
			this.plotGraph();
		},
		/*initialize: function(){
			this.on("change:title", function(model){
				console.log(model.get("title"))
				alert("title changed to" + model.get("title") );
			});
		},*/
		plotGraph: function(){
			var x = this.get('xLabel');
			var y = this.get('yLabel');
			var xmax = this.get('xmax');
			var ydata = this.get('ydata');
			var useCanvas = this.get('useCanvas');
			console.log("ydata",ydata)
			var axisLabelPadding = this.get('axisLabelPadding');
			var tickSize = this.get('tickSize');
			var options = {
				axisLabels: {
				            show: true
				        },
				xaxes: [{
		            axisLabel: x,
					axisLabelUseCanvas: useCanvas,
					axisLabelPadding: axisLabelPadding
				        }],
		        yaxes: [{
		            position: 'left',
		            axisLabel: y,
					axisLabelUseCanvas: useCanvas,
					axisLabelPadding: axisLabelPadding
		        }],
				series: {
					lines: {
						show: true
					},
					points: {
						show: true
					}
				},
				colors: this.get('colors'),
				grid: {
					hoverable: true,
					clickable: true
				},
				xaxis: {
					tickDecimals: 0,
					tickSize: tickSize
		        }
			};

			$(".graph-container").show();
			$("#graph_toolbar").show();
			var plot = $.plot("#graph_placeholder", ydata, options);
			var canvas = plot.getCanvas();
			var c = canvas.getContext("2d");
			var cx = canvas.width / 2;
			var cy = canvas.height;
			var title = this.get('title');
			var xlabel = x;
			c.font = "bold 16px sans-serif";
			c.textAlign = 'center';
		    c.fillText(title,cx,30);
		}
	});

	var PlotlyModel = Backbone.Model.extend({
		//url: "/graph/plot",
		defaults: {
			x: [1, 2, 3, 4],
			y: [10, 15, 13, 17],
			type: 'scatter'
		},
		initialize: function(){
			this.Plot();
		},
		/*initialize: function(){
			this.on("change:title", function(model){
				console.log(model.get("title"))
				alert("title changed to" + model.get("title") );
			});
		},*/
		Plot: function(){
			var trace = {x: this.get('x'), y: this.get('y'),type: this.get('type')},
				data = [trace];

			$(".graph-container").show();
			$("#graph_toolbar").show();
			Plotly.newPlot('graph_container', data);
		}
	});

	var d3Model = Backbone.Model.extend({
		defaults: {
			// Chart dimensions.
			top: 20, 
			right: 30, 
			bottom: 60,
			left: 80,
			currentX: "radius", 
			currentY: "ripley",
			symbolsize: 8, //radius of circle
			bigscale: 1.5, //how much to scale up on mouseover
			plot_data: [{'x': 1, 'y': 10},{'x': 2, 'y': 15},{'x': 3, 'y': 13},{'x': 4, 'y': 17}]
		},

		initialize: function(){
			this.set({
				width: 600 - this.get('right'),
				height: 500 - this.get('top') - this.get('bottom')
			});

			this.set({
				//Scales and axes
				xScale: d3.scale.linear().range([0, this.get('width')]),
				yScale: d3.scale.linear().range([this.get('height'), 0]),

				//This scale will set the saturation (gray to saturated color).  
				// We will use it for mapping brightness.
				saturationScale: d3.scale.linear().range([0, 1]).domain([0, 100]),

				//This scale will set the hue.  We will use it for mapping emission wavelength.
				hueScale: d3.scale.linear().range([300, 300, 240, 0, 0]).domain([200, 405, 440, 650, 850])
			});

			var xAxis_bottom = d3.svg.axis().scale(this.get('xScale')).tickSize(5).tickSubdivide(true);
			var yAxis_left = d3.svg.axis().scale(this.get('yScale')).tickSize(5).orient("left").tickSubdivide(true);

			//top and right axes are identical but without tick labels
			var xAxis_top = d3.svg.axis().scale(this.get('xScale')).tickSize(5).orient("top").tickSubdivide(true).tickFormat(function (d) { return ''; });;;
			var yAxis_right = d3.svg.axis().scale(this.get('yScale')).tickSize(5).orient("right").tickSubdivide(true).tickFormat(function (d) { return ''; });;

			var svg = d3.select("#graph_placeholder").append("svg")
					.attr("width", this.get('width') + this.get('left') + this.get('right'))
					.attr("height", this.get('height') + this.get('top') + this.get('bottom'))
					.append("g")
					.attr("transform", "translate(" + this.get('left') + "," + this.get('top') + ")");

			this.set({
				//X and Y axes
				xAxis_bottom: xAxis_bottom,
				yAxis_left: yAxis_left,
				xAxis_top: xAxis_top,
				yAxis_right: yAxis_right,

				// Create the SVG container and set the origin.
				svg: svg
			});
			//Add the axes
			var svg = this.get('svg');
			console.log('xAxis_top',this.get('xAxis_top'))
			console.log('xScale',this.get('xScale'))
			svg.append("g")
				.attr("class", "x axis bottom")
				.attr("transform", "translate(0," + this.get('height') + ")")
				.call(this.get('xAxis_bottom'));
			console.log('height',this.get('height'))		
			svg.append("g")
				.attr("class", "y axis left")
				.call(this.get('yAxis_left'));
			svg.append("g")
				.attr("class", "x axis top")
				.call(this.get('xAxis_top'));
			svg.append("svg:g")
				.attr("class", "y axis right")
				.attr("transform", "translate(" + this.get('width') + ",0)")
				.call(this.get('yAxis_right'));
			
			// Add an x-axis label.
			svg.append("text")
				.attr("class", "x label")
				.attr("text-anchor", "middle")
				.attr("x", this.get('width')/2 )
				.attr("y", this.get('height') + 40)
				.text("x axis");
				
			// Add a y-axis label.
			svg.append("text")
				.attr("class", "y label")
				.attr("text-anchor", "middle")
				.attr("y", 0 - this.get('left') + 40)
		        .attr("x",0 - (this.get('height') / 2))
				.attr("transform", "rotate(-90)")
				.text("y axis");
				
			//Add a clipping path so that data points don't go outside of frame
			svg.append("clipPath")                  //Make a new clipPath
				.attr("id", "chart-area")           //Assign an ID
					.append("rect")                     
					.attr("width", this.get('width'))
					.attr("height", this.get('height'));
			this.set({svg: svg});

			//enable zooming	
			this.set({
				zoom: d3.behavior.zoom()
				.x(this.get('xScale'))
				.y(this.get('yScale'))
				.scaleExtent([1, 10])
				.on("zoom", this.draw_graph())
			});

			svg.append("rect")
				.attr("class", "pane")
				.attr("width", this.get('width'))
				.attr("height", this.get('height'))
				.call(this.get('zoom'));
			this.set({svg: svg});

			this.plot();
		},

		draw_graph: function(){
			//redraw axes with new domains
			var svg = this.get('svg'),
				xAxis_bottom = this.get('xAxis_bottom'),
				yAxis_left = this.get('yAxis_left'),
				xAxis_top = this.get('xAxis_top'),
				yAxis_right = this.get('yAxis_right');
			svg.select(".x.axis.bottom").call(xAxis_bottom);
			svg.select(".y.axis.left").call(yAxis_left);
			svg.select(".x.axis.top").call(xAxis_top);
			svg.select(".y.axis.right").call(yAxis_right);
			
			svg.selectAll("circle.FP")
				.attr("cx", function (d) { return xScale (d[currentX]); })
				.attr("cy", function (d) { return yScale (d[currentY]); })

			svg.selectAll("rect.FP")
			    .attr("x", function (d) { return xScale (d[currentX]) - symbolsize; })
			    .attr("y", function (d) { return yScale (d[currentY]) - symbolsize; })
				
			svg.selectAll("text.FP")
			    .attr("x", function (d) { return xScale (d[currentX]) - symbolsize/2; })
			    .attr("y", function (d) { return yScale (d[currentY]) + symbolsize/2; })
		},

		plot: function(){
			var data = this.get('plot_data'),
				svg = this.get('svg'),
				zoom = this.get('zoom'),
				x = this.get('xScale'),
				y = this.get('yScale'),
				line = d3.svg.line()
			    .x(function(d) { return x(d.x); })
			    .y(function(d) { return y(d.y); });

			x.domain(d3.extent(data, function(d) { return d.x; }));
			zoom.x(this.get('xScale'));
			y.domain(d3.extent(data, function(d) { return d.y; }));
			zoom.y(this.get('yScale'));
			svg.append("path").datum(data).attr("class", "line").attr("d", line);
		}

		set_axis_text: function(xlabel,ylabel){
			var svg = this.get('svg');

			// need to remove the old axis labels first

			// Add an x-axis label.
			svg.append("text")
				.attr("class", "x label")
				.text(xLabel);
				
			// Add a y-axis label.
			svg.append("text")
				.text(ylabel);

		}

	});