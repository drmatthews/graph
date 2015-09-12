from django.http import Http404, HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from forms import PreviewForm,AnnotationsForm,PlotForm
from plot import settings

import os
import re
from math import floor
from collections import defaultdict
import numpy as np
import pandas as pd
import json
import csv
from itertools import islice
import openpyxl
from PIL import Image
import tempfile
import shutil
import plotly.plotly as py
from plotly.graph_objs import *

import omero
from omeroweb.webclient.decorators import login_required

ANNPATH = '/home/omero/temp'
username = settings.PLOTLY_USERNAME
api_key = settings.PLOTLY_APIKEY
py.sign_in(username,api_key)
#ANNPATH = tempfile.mkdtemp(prefix='downloaded_annotations')

def plotly_graph(gdata, glayout):

    """
    data = [ { xdata: [], ydata: [] }, trace1: {xdata: [], ydata: []} ]
    layout = {plot_mode: '', title: '', xLabel: '', yLabel: '', 
              xmin: '', xmax: '', ymin: '', ymax: ''}
    """

    traces = []
    plot_mode = glayout['plot_mode']
    xmin = float(glayout['xmin'].replace(u'\u2212','-'))
    xmax = float(glayout['xmax'].replace(u'\u2212','-'))
    ymin = float(glayout['ymin'].replace(u'\u2212','-'))
    ymax = float(glayout['ymax'].replace(u'\u2212','-'))

    xaxis_range = [xmin,xmax]
    yaxis_range = [ymin,ymax]
    print xaxis_range
    print yaxis_range

    for trace in gdata:
        if 'bar' in plot_mode:
            traces.append(Bar(
                x=[int(xd) for xd in trace['xdata']],
                y=[int(yd) for yd in trace['ydata']]))
        elif plot_mode == 'lines':
            traces.append(Scatter(
                x=[int(xd) for xd in trace['xdata']],
                y=[int(yd) for yd in trace['ydata']],
                mode='lines'))
        elif plot_mode == 'markers':
            traces.append(Scatter(
                x=[int(xd) for xd in trace['xdata']],
                y=[int(yd) for yd in trace['ydata']],
                mode='markers'))   
        elif plot_mode == 'lines+markers':
            traces.append(Scatter(
                x=[int(xd) for xd in trace['xdata']],
                y=[int(yd) for yd in trace['ydata']],
                mode='lines+markers'))          

    graph_layout = Layout(
        title=glayout['title'],
        xaxis=XAxis(
            title=glayout['xLabel'],
            showline=True,
            ticks='outside',
            mirror='all',
            autorange=False,
            range=xaxis_range
        ),
        yaxis=YAxis(
            title=glayout['yLabel'],
            showline=True,
            ticks='outside',
            mirror='all',
            autorange=False,
            range=yaxis_range
        )
    )
    print traces
    graph_data = Data(traces)
    fname = glayout['title'] + ".png"
    output_dir = tempfile.mkdtemp(prefix='exported_plots')
    path = os.path.join(output_dir,fname)
    py.image.save_as({'data': graph_data, 'layout': graph_layout}, path)
    return output_dir,path

def upload_plot(conn, path):
    """
    This creates a new Image in OMERO using all the images in destination folder as Z-planes
    """
    
    gid = conn.getGroupFromContext().getId()
    conn.SERVICE_OPTS.setOmeroGroup(gid)
    
    # Need to check whether we're dealing with RGB images (3 channels) or greyscale (1 channel)
    img = Image.open(path)
    img.load()
    sizeC = len(img.split())
    sizeZ = 1
    sizeT = 1
    imageName = os.path.basename(path)
    print 'imageName',imageName
    # Create a new Image in OMERO, with the jpeg images as a Z-stack.
    # We need a generator to produce numpy planes in the order Z, C, T.
    def plane_generator():
        img = Image.open(path)
        img.load()      # need to get the data in hand before...
        channels = img.split()
        for channel in channels:
            numpyPlane = np.asarray(channel)
            yield numpyPlane

    # Create the image
    plane_gen = plane_generator()
    newImg = conn.createImageFromNumpySeq(plane_gen, imageName, sizeZ=sizeZ, sizeC=sizeC, sizeT=sizeT)
    print "New Image ID", newImg.getId()
    return newImg

def d3_data(xdata,ydata):
    # ydata is a list of lists - index of 0 is a short
    # term fudge
    d3data = []
    for x,y in zip(xdata,ydata[0]):
        d_dict = {}
        d_dict['x'] = x
        d_dict['y'] = y
        d3data.append(d_dict)
    return d3data

    
def flot_data(xdata,ydata):
    
    # ydata is a list of lists
    fdata = []
    for yd in ydata:
        sdata = []
        for i,y in enumerate(yd):
            sdata.append([xdata[i],y])
        fdata.append(sdata)
    return fdata

def saveas_csv(fpath,data):
    filename, file_extension = os.path.splitext(fpath)
    csv_path = filename + '.csv'
    data.to_csv(csv_path)
    return csv_path

def get_data(path,ext,header_row,sheet):
    if ('xls' in ext):
        with open(path) as t_in:
            data = pd.read_excel(t_in,header=int(header_row),sheetname=sheet,\
                               engine='xlrd',
                               index_col=False)
    else:
        with open(path) as t_in:
            data = pd.read_csv(t_in,header=int(header_row),\
                               sep=r'\t|,',engine='python',\
                               index_col=False)
    return data
                                   
def get_column(path,ext,col,header_row,sheet):
    try:
        data = get_data(path,ext,header_row,sheet)

        if type(col) != list:
            return list(data[col].values)
        else:
            vals = []    
            for c in col:
                vals.append(list(data[c].values))
            return vals      
    except:
        print 'there was a problem parsing the data'
        return None
    
def preview_data(path,ext,sheet):
    max_rows = 10
    max_cols = 10
#    try:
    if '.xls' in ext:
        wb = openpyxl.load_workbook(path)
        sh = wb.get_sheet_names()[sheet]
        shdata = wb.get_sheet_by_name(sh)
        num_rows = shdata.get_highest_row() - 1
        num_cols = shdata.get_highest_column()
        data = []
        for r in range(max_rows):
            row_data = []
            for c in range(max_cols):
                row_data.append(shdata.cell(row=r+1, column=c+1).value)
            data.append(row_data)
    elif '.txt' in ext:
        num_rows = sum(1 for line in open(path))
        with open(path) as file:
            data = [next(file)[:max_cols] for x in xrange(max_rows)]
    elif '.csv' in ext:
        num_rows = sum(1 for line in open(path))
        with open(path,'rb') as file:
            csv_file = csv.reader(file)
            data = []
            for i in range(max_rows):
                data.append(csv_file.next()[:max_cols])
    print num_rows
    if num_rows < 1000:
        return data
    else:
        return None
    #except:
    #    print 'there was a problem parsing the data'
    #    return None
                
def parse_annotation(path,ext,header_row,sheet):
    #try:
    data = get_data(path,ext,header_row,sheet)
    if 'csv' not in ext:
        # save all files as csv as parsing with eventually be
        # done with d3.js
        csv_path = saveas_csv(path,data)
    else:
        csv_path = path
    num_rows = len(data.index)
    if num_rows < 1000:
        columns = [(" ", " ")]
        for col in data.columns.values:
            columns.append((col,col))
        message = "Sucessfully processed %s for plotting" % os.path.basename(path) 
        return columns,message,csv_path
    else:
        columns = None
        message = "Unfortunately that dataset has too many columns for plotting"
        return columns,message,csv_path
    #except:
    #    print 'there was a problem parsing the data'
    #    return None
                
def download_annotation(ann):
    """
    Downloads the specified file to and returns the path on the server
    
    @param ann:    the file annotation being downloaded
    """ 
    
    if not os.path.exists(ANNPATH):
        os.makedirs(ANNPATH)
    file_path = os.path.join(ANNPATH, ann.getFile().getName())
    if os.path.isfile(file_path):
        return file_path
    else:
        f = open(str(file_path), 'w')
        print "\nDownloading file to", file_path, "..."
        try:
            for chunk in ann.getFileInChunks():
                f.write(chunk)
        finally:
            f.close()
            print "File downloaded!"
        return file_path

def find_duplicate_annotations(mylist):
    D = defaultdict(list)
    for i,item in enumerate(mylist):
        D[item].append(i)
    return {k:v for k,v in D.items() if len(v)>1}
    
def get_user_annotations(conn,extensions=('txt','csv','xls','xlsx')):

    params = omero.sys.ParametersI()
    params.exp(conn.getUser().getId())  # only show current user's Datasets
    datasets = conn.getObjects("Dataset", params=params)
    annotations = []
    annotation_names = []
    for dataset in datasets:
        for dsAnn in dataset.listAnnotations():
            if isinstance(dsAnn, omero.gateway.FileAnnotationWrapper):
                annotations.append(dsAnn)
                annotation_names.append(dsAnn.getFile().getName())
        for image in dataset.listChildren():
            for imAnn in image.listAnnotations():
                if isinstance(imAnn, omero.gateway.FileAnnotationWrapper):
                    annotations.append(imAnn)
                    annotation_names.append(imAnn.getFile().getName())
                    
    filtered_anns = []
    filtered_names = []
    for ext in extensions:
        filtered_anns.extend([ann[0] for ann in zip(annotations,annotation_names) if ext in ann[1]])
        filtered_names.extend(["ID:"+str(ann[0].getId())+" "+ann[1] for ann in zip(annotations,annotation_names) if ext in ann[1]])
        
    duplicates = find_duplicate_annotations(filtered_names)
    for k,v in duplicates.iteritems():
        dups = v[1:]
        for d in dups:
            filtered_anns.pop(d)
            filtered_names.pop(d)
        
    return filtered_anns,filtered_names

    
@login_required()
def index(request, conn=None, **kwargs):
    userFullName = conn.getUser().getFullName()
    anns,names = get_user_annotations(conn)
    form_names = [(" "," ")]
    for name in names:
        form_names.append((name,name))
    if request.POST:
        form = AnnotationsForm(options=form_names,data=request.POST)
        if form.is_valid():
            selected = form.cleaned_data['annotation']
            
            header_row = 0
            if form.cleaned_data['header'] is not None:
                header_row = form.cleaned_data['header']

            sheet = 0
            if form.cleaned_data['sheet'] is not None:
                sheet = form.cleaned_data['sheet']
            annId = selected.partition(' ')[0][3:]
            request.session['annotation_id'] = annId
            request.session['header'] = header_row
            request.session['sheet'] = sheet
            annotation = conn.getObject("Annotation",annId)
            fpath = download_annotation(annotation)
            fname, fextension = os.path.splitext(fpath)
            cols,message,csv_path = parse_annotation(fpath,fextension,header_row,sheet)
            if cols is not None:
                rv = {'success':True,'message':message,'selected': selected,'columns': cols}
                data = json.dumps(rv)
                return HttpResponse(data, mimetype='application/json')
            else:
                rv = {'success':False,'message':message}
                error = json.dumps(rv)
                return HttpResponseBadRequest(error, mimetype='application/json')
    else:
        preview_form = PreviewForm(options=form_names,\
                                   initial={'preview_sheet':0})
        ann_form = AnnotationsForm(options=form_names,\
                                   initial={'header':0,\
                                            'sheet':0})
        num_xls = len([name for name in names if '.xls' in name])
        num_txt = len([name for name in names if '.txt' in name])
        num_csv = len([name for name in names if '.csv' in name])
        plot_form = PlotForm(options=(('x_data','x_data'),('y_data','y_data')))
        
        context = {'userFullName': userFullName,
                   'annotations': anns,'num_annotations': len(anns),
                   'annotation_names': names, 'num_xls': num_xls,
                   'num_csv': num_csv, 'num_txt': num_txt,
                   'form': ann_form, 'plot_form': plot_form,\
                   'prev_form':preview_form}
        return render(request, "plot/index.html", context)
        
@login_required()
def plot(request, conn=None, **kwargs):
    annotation_id = request.session['annotation_id']
    annotation = conn.getObject("Annotation",annotation_id)
    fpath = download_annotation(annotation)
    header_row = request.session['header']
    sheet = request.session['sheet']
    fname, fextension = os.path.splitext(fpath)
    cols,message,csv_path = parse_annotation(fpath,fextension,header_row,sheet)
    if request.POST:
        form = PlotForm(options=cols,data=request.POST.copy())
        if form.is_valid():
            title = annotation.getFile().getName()
            if form.cleaned_data['title']:
                title = form.cleaned_data['title']
            x = form.cleaned_data['x_data']
            y = form.cleaned_data['y_data']
            print 'first y',y
            xLabel = x
            if form.cleaned_data['x_Label']:
                xLabel = form.cleaned_data['x_Label']
            yLabel = y
            if form.cleaned_data['y_Label']:
                yLabel = form.cleaned_data['y_Label']
            #tick_size = form.cleaned_data['tick_size']
            plot_mode = form.cleaned_data['plot_mode']
            xdata = [floor(xd) for xd in get_column(fpath,fextension,x,header_row,sheet)]
            xmin = min(xdata)
            xmax = max(xdata)
            ydata = get_column(fpath,fextension,y,header_row,sheet)
            #graph = flot_data(xdata,ydata)
            #d3data = d3_data(xdata,ydata)
            rv = {'message': message,\
                  'title': title, 'x' : x, 'y' : y,\
                  'xLabel': xLabel, 'yLabel': yLabel,\
                  'xdata': xdata, 'ydata': ydata,\
                  'num_series': len(ydata),'plot_mode':plot_mode,\
                  'xmin': xmin, 'xmax': xmax,'csv_path': csv_path}
            data = json.dumps(rv)
            return HttpResponse(data, mimetype='application/json')
            
@login_required()
def preview(request, conn=None, **kwargs):
    anns,names = get_user_annotations(conn)
    form_names = [(" "," ")]
    for name in names:
        form_names.append((name,name))
    if request.POST:
        form = PreviewForm(options=form_names,data=request.POST)
        if form.is_valid():
            selected = form.cleaned_data['preview_annotation']

            sheet = 0
            if form.cleaned_data['preview_sheet'] is not None:
                sheet = form.cleaned_data['preview_sheet']
                                
            annId = selected.partition(' ')[0][3:]
            annotation = conn.getObject("Annotation",annId)
            fpath = download_annotation(annotation)
            fname, fextension = os.path.splitext(fpath)
            pdata = preview_data(fpath,fextension,sheet)
            print len(pdata)
            if pdata is not None:
                rv = {'preview_data': pdata}
                data = json.dumps(rv)
                return HttpResponse(data, mimetype='application/json')
            else:
                rv = {'message':"Could not read file"}
                error = json.dumps(rv)
                return HttpResponseBadRequest(error, mimetype='application/json')

@login_required()
def save(request, conn=None, **kwargs):
    if request.POST:
        data = request.POST['plot_data']
        layout = request.POST['plot_layout']
        output_dir,path = plotly_graph(json.loads(data),json.loads(layout))
        # and upload to omero
        img = upload_plot(conn,path)
        if img:
            shutil.rmtree(output_dir)
            rv = {'message':"Sucessfully saved"}
            data = json.dumps(rv)
            return HttpResponse(data, mimetype='application/json')
        else:
            rv = {'message':"Exporting failed"}
            error = json.dumps(rv)
            return HttpResponseBadRequest(error, mimetype='application/json')

@login_required()
def update(request, conn=None, **kwargs):
    if request.POST:
        annotation_id = request.session['annotation_id']
        annotation = conn.getObject("Annotation",annotation_id)
        fpath = download_annotation(annotation)
        header_row = request.session['header']
        sheet = request.session['sheet']
        fname, fextension = os.path.splitext(fpath)
        x = request.POST['x_column']
        y = request.POST.getlist('y_column')
        if type(y) != list:
            y = [y]
        xdata = [floor(xd) for xd in get_column(fpath,fextension,x,header_row,sheet)]
        ydata = get_column(fpath,fextension,y,header_row,sheet)
        rv = {'xdata': xdata, 'ydata': ydata,\
              'num_series': len(ydata)}
        data = json.dumps(rv)
        return HttpResponse(data, mimetype='application/json')
        
