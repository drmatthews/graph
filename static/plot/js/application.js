$(function(){	
	var Ann = new AnnotationModel();
	//var Graph = new GraphModel();
	var Plotly = new PlotlyModel();
	//var C3 = new c3Model();

	new AnnotationView({ model: Ann, plotModel: Plotly });
	//new AnnotationView({ model: Ann });
	new PreviewView();
	//new GraphPlotView({ model: Graph });
	new plotSettingsEditView({ model: Plotly});
	new omeroExportView({ model: Plotly });
	new plotDataUpdateView({ model: Plotly });
});