# plot

This is a web app which allows users to parse and make graphs from data stored as annotations in an OMERO server.

This makes use of the plot.ly Javascript and Python APIs to plot data in the webpage and to export an image of the generated graph back to OMERO. If the user has a plot.ly account they can export and edit the graph with plot.ly, enabling saving and sharing with colleagues.

To install this app:

1. Put the app in a location on your local file system which is on the PYTHONPATH
2. Make the app available in OMERO.web by running bin/omero config append omero.web.apps '"<your-app>"'
3. Stop and stop OMERO.web
    bin/omero web start
    bin/omero web stop

Note:

In order to use the plot.ly Python API your are required to have an API_KEY. You should sign up for plot.ly (free) to get this key. Your USERNAME and API_KEY should then be copied into settings.py.
    
    
