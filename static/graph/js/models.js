
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
			num_traces: 1,
			x: [1, 2, 3, 4],
			y: [10, 15, 13, 17],
			currentXlabel: 'x axis label',
			currentYlabel: 'y axis label',
			title: 'chart title',
			type: 'scatter',
			layout: {
				title: 'chart title',
				autosize: false,
				width: 700,
				height: 500,
				xaxis: {
					title: 'x axis label',
					showline: true,
					ticks: 'outside',
					mirror: 'all'
				},
				yaxis: {
					title: 'y axis label',
					showline: true,
					ticks: 'outside',
					mirror: 'all'
				}
			}
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
				data = [trace],
				layout = this.get('layout');

			$(".graph-container").show();
			$("#graph_toolbar").hide();
			Plotly.newPlot('graph_container', data, layout);
		},

		update: function(){
			var graphDiv = 'graph_container',
				xdata = this.get('x'),
				ydata = this.get('y'),
				xmin = Math.min.apply(Math,xdata),
				xmax = Math.max.apply(Math,xdata);
				num_traces = this.get('num_traces');
			Plotly.deleteTraces(graphDiv, 0);

			var ymin = [],
				ymax = [];
			for (t = 0; t < num_traces; t++){
				Plotly.addTraces(graphDiv, {'x': xdata,'y': ydata[t]});
				ymin.push(Math.min.apply(Math,ydata[t]));
				ymax.push(Math.max.apply(Math,ydata[t]));
			}

			var title = this.get('title'),
				xLabel = this.get('currentXlabel'),
				yLabel = this.get('currentYlabel');
			var update = {
			    title: title,
			    'xaxis.range': [xmin, xmax],
			    'yaxis.range': [Math.min.apply(Math,ymin), Math.max.apply(Math,ymax)],
			    'xaxis.title': xLabel,
			    'yaxis.title': yLabel
			};
			Plotly.relayout(graphDiv, update)
		}
	});

	var c3Model = Backbone.Model.extend({
		defaults: {
			place_holder: '#graph_placeholder',
			data: [['data1', 30, 200, 100, 400, 150, 250]],
			xLabel: 'x axis label',
			yLabel: 'y axis label'
		},
		initialize: function(){
			this.generate()
		},
		generate: function(){
			var cols = this.get('data'),
				place_holder = this.get('place_holder'),
				xLabel = this.get('xLabel'),
				yLabel = this.get('yLabel');
			var chart = c3.generate({
			    bindto: place_holder,
			    data: {
				    columns: cols,
			    },
			    axis: {
					x: {
						label: {
							text: xLabel,
							position: 'outer-center'
						},
					},
					y: {
						label: {
							text: yLabel,
							position: 'outer-middle'
						},
					},
					x2: {
						tick: {
							values: []
						},
						show: true
					},
					y2: {
						tick: {
							values: []
						},
						show: true
					}
				}
			});
		},
	});