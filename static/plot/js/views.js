		
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
		this.graphModel = this.options.graphModel;
		this.graphDialog = new graphSetupModalView({ model: this.graphModel });
    },

    submit: function (e) {
        e.preventDefault();
		var header = $('#id_header').val(),
			sheet = $('#id_sheet').val(),
			annotation = $('#id_annotation').val(),
			graphDialog = this.graphDialog,
			model = this.model;
		console.log(annotation,header,sheet)
		$.ajax({
			traditional: true,
			type: "POST",
			url: this.$el.attr('action'),
			data : {'annotation' : annotation, 'header': header, 'sheet': sheet},
			success: function(results) {
				var xoptions = $("#id_x_data");
				var yoptions = $("#id_y_data");
				var columns = results.columns;
				$("#id_x_data").empty();
				$("#id_y_data").empty();
				for (i = 0; i < columns.length; i++) {
					xoptions.append($("<option />").val(columns[i][0]).text(columns[i][1]));
					yoptions.append($("<option />").val(columns[i][0]).text(columns[i][1]));
				}
				$("#id_x_data").trigger("chosen:updated");
				$('#id_x_data').val('').trigger('liszt:updated');
				$("#id_y_data").trigger("chosen:updated");
				$('#id_y_data').val('').trigger('liszt:updated');
				graphDialog.show();
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
				/*if ($("#prev_text").length === 0){
					$("#preview_data").append('<p id=prev_text></p>');
					for (i=0;i<prevresults.preview_data.length;i++){
						$("#prev_text").append('Row '+String(i)+':      '+prevresults.preview_data[i]+'</br>');
					}
				}
				else{
					$("#prev_text").empty();
					for (i=0;i<prevresults.preview_data.length;i++){
						$("#prev_text").append('Row '+String(i)+':      '+prevresults.preview_data[i]+'</br>');
					}
				};*/
		  },
          statusCode: {
              400: function() {
                  alert("Choose an annotation");
			  }
          	}
		});
	}
});

var graphSetupModalView = Backbone.View.extend({
	el: "#graph_setup_modal",
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
				$('#inputTitle').val(title);
				$('#inputXlabel').val(xLabel);
				$('#inputYlabel').val(yLabel);
				el.modal('hide');
		  },
		  error: function(error) {
		    console.log(error)
		  }
		});
    }
});

var graphSettingsEditView = Backbone.View.extend({
	el: '#graph_settings',
	events:{
		'click #updateButton' : 'edit_graph',
	},
	edit_graph: function(e){
		e.preventDefault();
		var title = $('#inputTitle').val(),
			xLabel = $('#inputXlabel').val(),
			yLabel = $('#inputYlabel').val();
		console.log('title',title)
		this.model.set({'title': title, 'currentXlabel': xLabel,
						'currentYlabel': yLabel});
		this.model.update_title_and_axis();
		$('#inputTitle').val('');
		$('#inputXlabel').val('');
		$('#inputYlabel').val('');
	}
});

var omeroExportView = Backbone.View.extend({
	el: '#graph_container',
	
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
		this.save(JSON.stringify(data),JSON.stringify(layout));
	},
	
	save: function(data, layout){
		$.ajax({
			traditional: true,
			type: "POST",
			url: "/plot/save",
			data : {'graph_data' : data, 'graph_layout': layout},
			success: function(saveresults) {
				alert(saveresults.message);
		  },
          statusCode: {
              400: function() {
                  alert(saveresults.message);
			  }
          }
	  });
	}
});
