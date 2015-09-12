		
var AnnotationView = Backbone.View.extend({
	
    constructor: function (options) {
      this.configure(options || {});
      // ...
      Backbone.View.prototype.constructor.apply(this, arguments);
    },

    configure: function (options) {
      if (this.options) {
        options = _.extend({}, _.result(this, 'options'), options);
      }
      this.options = options;
    },
	
	el: '#annotation_form',
	
    events: {
        "submit": "submit",
    },

    initialize: function (options) {
		this.plotModel = this.options.plotModel;
		this.plotDialog = new plotSetupModalView({ model: this.plotModel });
    },

    submit: function (e) {
        e.preventDefault();
		var header = $('#id_header').val(),
			sheet = $('#id_sheet').val(),
			annotation = $('#id_annotation').val(),
			plotDialog = this.plotDialog,
			model = this.model;
		console.log(annotation,header,sheet)
		$.ajax({
			traditional: true,
			type: "POST",
			url: this.$el.attr('action'),
			data : {'annotation' : annotation, 'header': header, 'sheet': sheet},
			success: function(results) {
				var xoptions = $("#id_x_data"),
					xoptions_update = $("#id_x_data_update"),
					yoptions = $("#id_y_data"),
					yoptions_update = $("#id_y_data_update"),					
					columns = results.columns;
				$("#id_x_data").empty();
				$("#id_x_data_update").empty();
				$("#id_y_data").empty();
				$("#id_y_data_update").empty();
				for (i = 0; i < columns.length; i++) {
					xoptions.append($("<option />").val(columns[i][0]).text(columns[i][1]));
					xoptions_update.append($("<option />").val(columns[i][0]).text(columns[i][1]));
					yoptions.append($("<option />").val(columns[i][0]).text(columns[i][1]));
					yoptions_update.append($("<option />").val(columns[i][0]).text(columns[i][1]));					
				}
				$("#id_annotation").trigger("chosen:updated");
				$('#id_annotation').val('').trigger('liszt:updated');
				$("#id_preview_annotation").trigger("chosen:updated");
				$('#id_preview_annotation').val('').trigger('liszt:updated');
				$("#id_x_data").trigger("chosen:updated");
				$('#id_x_data').val('').trigger('liszt:updated');
				$("#id_x_data_update").trigger("chosen:updated");
				$('#id_x_data_update').val('').trigger('liszt:updated');
				$("#id_y_data").trigger("chosen:updated");
				$('#id_y_data').val('').trigger('liszt:updated');
				$("#id_y_data_update").trigger("chosen:updated");
				$('#id_y_data_update').val('').trigger('liszt:updated');				
				plotDialog.show();
				model.save({'title': results.selected, 'xoptions': columns, 'yoptions': columns });
		  },
          statusCode: {
              400: function() {
                  alert("Too many rows in annotation");
			  }
          }
		});
    }
});

var previewModalView = Backbone.View.extend({
	el: "#preview_modal",
	//template:  _.template('Row '+'<%- index %>:  '+'<%- label %></br>'),
	template:  _.template('<td><%- cell %></td>'),
	show: function() {
		this.$el.modal('show');
	},
	modalData: function(data) {
		for (i=0;i<data.preview_data.length;i++){
			var table = this.$el.find('#prev_table');
			table.append('<tr></tr>');
			var cell_data = data.preview_data[i];
			for (j=0;j<cell_data.length;j++){
				//this.$el.find('#prev_text').append(this.template({index: i, label: data.preview_data[i]}));
				table.find('tr:last').append(this.template({cell: cell_data[j]}));
			}
		}
	}
});

var PreviewView = Backbone.View.extend({
	el: "#preview_form",
	initialize: function() {
		var previewModal = new previewModalView();
		this.previewModal = previewModal;
	},
	events: {
		"submit": "submit"
	},
	submit: function (e){
		e.preventDefault();
		var prev_sheet = $('#id_preview_sheet').val(),
			prev_annotation = $('#id_preview_annotation').val(),
			el = this.$el,
			previewModal = this.previewModal;

		$.ajax({
			traditional: true,
			type: "POST",
			url: el.attr('action'),
			data : {'preview_annotation' : prev_annotation, 'preview_sheet': prev_sheet},
			success: function(prevresults) {
				console.log(prevresults)
				previewModal.modalData(prevresults);
				previewModal.show();
		  },
          statusCode: {
              400: function() {
                  alert("Choose an annotation");
			  }
          	}
		});
	}
});

var plotSetupModalView = Backbone.View.extend({
	el: "#plot_setup_modal",
	events: {
		"click #plotgraph": "plotGraph"
	},
	show: function() {
		this.$el.modal('show');
	},
    plotGraph: function () {
		var model = this.model,
			el = this.$el,
			x = $('#id_x_data').val(),
			y = $('#id_y_data').val(),
			title = $('#id_title').val(),
			xLabel = $('#id_x_Label').val(),
			yLabel = $('#id_y_Label').val(),
			plot_mode = $('#id_plot_mode').val();
			annId = "{{ request.session.annotation_id }}";
			console.log('y',y)
		$.ajax({
			traditional: true,
			type: "POST",
			url: "/plot/plot/",
			data : {'x_data' : x, 'y_data': y, 'title': title, 'x_Label': xLabel, 'y_Label': yLabel, 'plot_mode': plot_mode },
			success: function(plotresults) {
				
				var xdata = plotresults.xdata,//generateData(plotresults.graph_data),
					ydata = plotresults.ydata,
					num_traces = plotresults.num_series,
					//d3data = plotresults.d3data,
					xmax = plotresults.xmax,
					useCanvas = false,
					axisLabelPadding = 5,
					title = plotresults.title,
					xLabel = plotresults.xLabel,
					yLabel = plotresults.yLabel;
				model.set({'title': title, 'x': xdata, 'y': ydata, 'currentXlabel': xLabel, 
							'currentYlabel': yLabel, 'plot_mode': plot_mode});
				model.update();
				$("#inputTitle").val(title);
				$("#inputXlabel").val(xLabel);
				$("#inputYlabel").val(yLabel);
				$("#id_mode_update").val(plot_mode);
				$("#id_mode_update").trigger("chosen:updated");
				$("#id_x_data_update").val(x);
				$("#id_x_data_update").trigger("chosen:updated");
				$("#id_y_data_update").val(y);
				$("#id_y_data_update").trigger("chosen:updated");
				$("#id_annotation").trigger("chosen:updated");
				$("#id_annotation").val('').trigger('liszt:updated');
				$("#id_header").val(0);
				$("#plot_data_update").show();
				el.modal('hide');
		  },
		  error: function(error) {
		    console.log(error)
		  }
		});
    }
});

var plotTitleUpdateView = Backbone.View.extend({
	el: '#plot_settings',
	events:{
		'change #inputTitle' : 'editPlot',
	},
	editPlot: function(e){
		e.preventDefault();
		var title = $('#inputTitle').val();
		this.model.set({'title': title});
		this.model.update();
	}
});

var plotXLabelUpdateView = Backbone.View.extend({
	el: '#plot_settings',
	events:{
		'change #inputXlabel' : 'editPlot',
	},
	editPlot: function(e){
		e.preventDefault();
		var label = $('#inputXlabel').val();
		this.model.set({'currentXlabel': label});
		this.model.update();
	}
});

var plotYLabelUpdateView = Backbone.View.extend({
	el: '#plot_settings',
	events:{
		'change #inputYlabel' : 'editPlot',
	},
	editPlot: function(e){
		e.preventDefault();
		var label = $('#inputYlabel').val();
		this.model.set({'currentYlabel': label});
		this.model.update();
	}
});

var plotModeUpdateView = Backbone.View.extend({
	el: '#plot_settings',
	events:{
		'change #id_mode_update' : 'editPlot',
	},
	editPlot: function(e){
		e.preventDefault();
		var plot_mode = $('#id_mode_update').val();
		console.log(plot_mode)
		this.model.set({'plot_mode': plot_mode});
		this.model.update();
	}
});

var plotDataUpdateView = Backbone.View.extend({
	el: '#plot_data_update',
	events:{
		'click #update_plot_data' : 'updateData',
	},
	updateData: function(e){
		e.preventDefault();
		var model = this.model,
			title = model.get('title'),
			xLabel = model.get('currentXlabel'),
			yLabel = model.get('currentYlabel'),
			plot_mode = model.get('plot_mode'),
			x_column = $('#id_x_data_update').val(),
			y_column = $('#id_y_data_update').val();
			console.log('y_column',y_column)

		$.ajax({
			traditional: true,
			type: "POST",
			url: "/plot/update",
			data : {'x_column' : x_column, 'y_column': y_column},
			success: function(new_data) {
				var xdata = new_data.xdata,
					ydata = new_data.ydata;
				model.set({'title': title, 'x': xdata, 'y': ydata, 'currentXlabel': xLabel, 
							'currentYlabel': yLabel, 'plot_mode': plot_mode});
				model.update();
		  },
          statusCode: {
              400: function() {
                  alert(saveresults.message);
			  }
            }
        });
	}
});

var exportNotificationModalView = Backbone.View.extend({
	el: "#export_notification_modal",
	template:  _.template('<p><%- text %></p>'),
	show: function(title) { 
		$("#notification").append(this.template({text: title}));
		this.$el.modal('show');
	},
	hide: function(){
		this.$el.modal('hide');
	}
});

var omeroExportView = Backbone.View.extend({
	el: '#graph_container',

	initialize: function(){
		this.modal = new exportNotificationModalView();
	},
	
	events: {
		"click #graph_save": "omeroExport"
	},

	omeroExport: function(){
		/* note instead of making the image from the svg
		   push the values of the ticks, the graph type
		   the xdata, ydata, labels and title to the server
		   and recreate the graph using the plotly python API
		   and save the graph as an image and import to OMERO
		   as before */

		/* first use d3 to get the ticks - this can't be done
		   with jquery without an extra library to might as well
		   use d3 since we have it available */
		var xticks = [],
			yticks = [];
		d3.select("#graph_container svg")
			.selectAll("g.xtick > text")
			.each(function(d){
				xticks.push(d.text);
				return xticks;
			});

		d3.select("#graph_container svg")
			.selectAll("g.ytick > text")
			.each(function(d){
				yticks.push(d.text);
				return yticks;
			});

		var xmin = xticks[0];
		var xmax = xticks[xticks.length-1];
		var ymin = yticks[0];
		var ymax = yticks[yticks.length-1];

		var model = this.model,
			xdata = model.get('x'),
			ydata = model.get('y'),
			plot_mode = model.get('plot_mode'),
			title = model.get('title'),
			xLabel = model.get('currentXlabel'),
			yLabel = model.get('currentYlabel'),
			num_traces = model.get('num_traces');
			console.log(plot_mode)
		data = [];
		for (t = 0; t < num_traces; t++){
			data.push({ 
				xdata: xdata,
				ydata: ydata[t]
			})
		};
		var layout = {'plot_mode': plot_mode, 'title': title, 'xLabel': xLabel, 'yLabel': yLabel,
					   'xmin': xmin, 'xmax': xmax, 'ymin': ymin, 'ymax': ymax };
		this.modal.show(title);			   
		this.save(JSON.stringify(data),JSON.stringify(layout));
	},
	
	save: function(data, layout){
		var modal = this.modal;
		$.ajax({
			traditional: true,
			type: "POST",
			url: "/plot/save",
			data : {'plot_data' : data, 'plot_layout': layout},
			success: function(saveresults) {
				modal.hide();
		  },
          statusCode: {
              400: function() {
                  alert(saveresults.message);
			  }
          }
	  });
	}
});
