$(function(){	
	var Ann = new AnnotationModel();
	//var Graph = new GraphModel();
	//var Plotly = new PlotlyModel();
	var D3 = new d3Model();

	//new AnnotationView({ model: Ann, graphModel: Graph });
	new AnnotationView({ model: Ann });
	new PreviewView();
	//new GraphPlotView({ model: Graph });
});