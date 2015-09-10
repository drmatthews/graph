
	var AnnotationModel = Backbone.Model.extend({
		url: "/plot/find"
	});

	var PlotlyModel = Backbone.Model.extend({
		//url: "/graph/plot",
		defaults: {
			num_traces: 1,
			x: [1, 2, 3, 4],
			y: [[10, 15, 13, 17]],
			currentXlabel: 'x axis label',
			currentYlabel: 'y axis label',
			title: 'chart title',
			plot_mode: 'lines+markers',
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
			var xdata = this.get('x'), 
				ydata = this.get('y'),
				type = this.get('type'),
				data = [],
				num_traces = this.get('num_traces'),
				mode = this.get('plot_mode'),
				layout = this.get('layout');

			for (t = 0; t < num_traces; t++){
				var trace = {};
				trace.x = xdata;
				trace.y = ydata[t];
				trace.type = type;
				trace.mode = mode;
				data.push(trace);
			}
			
			$(".graph-container").show();
			Plotly.newPlot('graph_container', data, layout);
		},

		Plot: function(){
			var xdata = this.get('x'), 
				ydata = this.get('y'),
				type = this.get('type'),
				data = [],
				num_traces = this.get('num_traces'),
				mode = this.get('mode'),
				layout = this.get('layout');

			for (t = 0; t < num_traces; t++){
				var trace = {};
				trace.x = xdata;
				trace.y = ydata[t];
				trace.type = type;
				trace.mode = mode;
				data.push(trace);
			}
			
			$(".graph-container").show();
			Plotly.newPlot('graph_container', data, layout);
		},

		update: function(){
			var graphDiv = 'graph_container',
				xdata = this.get('x'),
				ydata = this.get('y'),
				xmin = Math.min.apply(Math,xdata),
				xmax = Math.max.apply(Math,xdata),
				plot_mode = this.get('plot_mode'),
				plot_type = this.get('type'),
				num_traces = this.get('num_traces');
			for (t = 0; t < num_traces; t++){
				Plotly.deleteTraces(graphDiv, t);
			}

			if (plot_type != 'bar'){
				var ymin = [],
					ymax = [];
				for (t = 0; t < ydata.length; t++){
					Plotly.addTraces(graphDiv, {'x': xdata,'y': ydata[t], 'type': 'scatter',
												'mode': plot_mode});
					ymin.push(Math.min.apply(Math,ydata[t]));
					ymax.push(Math.max.apply(Math,ydata[t]));
				}
			}
			this.set({plot_mode: plot_mode});
			this.set({num_traces: ydata.length});

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
		},

		update_title_and_axis: function(){
			var graphDiv = 'graph_container',
				title = this.get('title'),
				xLabel = this.get('currentXlabel'),
				yLabel = this.get('currentYlabel'),
				update = {
				    title: title,
				    'xaxis.title': xLabel,
				    'yaxis.title': yLabel
			};
			Plotly.relayout(graphDiv, update)			
		}
	});
