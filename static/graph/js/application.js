$(function(){	
	var Ann = new AnnotationModel();
	var Graph = new GraphModel();
	var Plotly = new PlotlyModel();

	new AnnotationView({ model: Ann, graphModel: Graph });
	new PreviewView();
	new GraphPlotView({ model: Plotly });
});