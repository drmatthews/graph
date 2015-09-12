$(function(){	
	var Ann = new AnnotationModel();
	var Plotly = new PlotlyModel();

	new AnnotationView({ model: Ann, plotModel: Plotly });
	new PreviewView();
	new plotTitleUpdateView({ model: Plotly});
	new plotXLabelUpdateView({ model: Plotly});
	new plotYLabelUpdateView({ model: Plotly});
	new plotModeUpdateView({ model: Plotly});
	new omeroExportView({ model: Plotly });
	new plotDataUpdateView({ model: Plotly });
});