gapi.analytics.ready(function() {

  /**
   * Authorize the user immediately if the user has already granted access.
   * If no access has been created, render an authorize button inside the
   * element with the ID "embed-api-auth-container".
   */
  gapi.analytics.auth.authorize({
    container: 'embed-api-auth-container',
    clientid: '785100694353-q0bjtiu1aiqjjm4oqremg0gpvjkl3p77.apps.googleusercontent.com'
  });


  /**
   * Create a new ViewSelector instance to be rendered inside of an
   * element with the id "view-selector-container".
   */
  var viewSelector = new gapi.analytics.ViewSelector({
    container: 'view-selector-container'
  });

  // Render the view selector to the page.
  viewSelector.execute();

  /**
   * Query params representing the chart's date range.
   */
  var dateRange = {
    'start-date': '7daysAgo',
    'end-date': 'yesterday'
  };

  /**
   * Create a new DateRangeSelector instance to be rendered inside of an
   * element with the id "date-range-selector-container", set its date range
   * and then render it to the page.
   */
  var dateRangeSelector = new gapi.analytics.ext.DateRangeSelector({
    container: 'date-range-selector-container'
  })
  .set(dateRange)
  .execute();


  /**
   * Create a table chart showing top pagepaths for users to interact with.
   * Clicking on a row in the table will update a second timeline chart with
   * data from the selected medium.
   */
  var pageChart = new gapi.analytics.googleCharts.DataChart({
    query: {
      'dimensions': 'ga:pagePath',
      'metrics': 'ga:sessions',
      'sort': '-ga:sessions',
      'max-results': '6'
    },
    chart: {
      type: 'TABLE',
      container: 'page-chart-container',
      options: {
        width: '100%'
      }
    }
  });


  /**
   * Create a table chart showing top mediums for users to interact with.
   * Clicking on a row in the table will update a second timeline chart with
   * data from the selected medium.
   */
  var mainChart = new gapi.analytics.googleCharts.DataChart({
    query: {
      'dimensions': 'ga:medium',
      'metrics': 'ga:sessions',
      'sort': '-ga:sessions',
      'max-results': '6'
    },
    chart: {
      type: 'TABLE',
      container: 'main-chart-container',
      options: {
        width: '100%'
      }
    }
  });


  /**
   * Create a timeline chart showing sessions over time for the medium the
   * user selected in the main chart.
   */
  var breakdownChart = new gapi.analytics.googleCharts.DataChart({
    query: {
      'dimensions': 'ga:date',
      'metrics': 'ga:sessions',
      dateRange
    },
    chart: {
      type: 'LINE',
      container: 'breakdown-chart-container',
      options: {
        width: '100%'
      }
    }
  });

  /**
   * Store a refernce to the row click listener variable so it can be
   * removed later to prevent leaking memory when the chart instance is
   * replaced.
   */
  var pageChartRowClickListener;
  /**
   * Store a refernce to the row click listener variable so it can be
   * removed later to prevent leaking memory when the chart instance is
   * replaced.
   */
  var mainChartRowClickListener;


  /**
   * Update both charts whenever the selected view changes.
   */
  viewSelector.on('change', function(ids) {
    var options = {query: {ids: ids}};

    // Clean up any event listeners registered on the main chart before
    // rendering a new one.
    if (pageChartRowClickListener) {
      google.visualization.events.removeListener(pageChartRowClickListener);
    }
    if (mainChartRowClickListener) {
      google.visualization.events.removeListener(mainChartRowClickListener);
    }

    pageChart.set(options).execute();
    mainChart.set(options).execute();
    breakdownChart.set(options);

    // Only render the breakdown chart if a medium filter has been set.
    if (breakdownChart.get().query.filters) breakdownChart.execute();
  });

  /**
   * Register a handler to run whenever the user changes the date range from
   * the first datepicker. The handler will update the first dataChart
   * instance as well as change the dashboard subtitle to reflect the range.
   */
  dateRangeSelector.on('change', function(data) {
    pageChart.set({query: data}).execute();
    mainChart.set({query: data}).execute();
    breakdownChart.set({query: data}).execute();

    // Update the "from" dates text.
    var datefield = document.getElementById('from-dates');
    datefield.textContent = data['start-date'] + '&mdash;' + data['end-date'];
  });

  pageChart.on('success', function(response) {

    var chart = response.chart;
    var dataTable = response.dataTable;

    // Store a reference to this listener so it can be cleaned up later.
    pageChartRowClickListener = google.visualization.events
        .addListener(chart, 'select', function(event) {

      // When you unselect a row, the "select" event still fires
      // but the selection is empty. Ignore that case.
      if (!chart.getSelection().length) return;

      var row =  chart.getSelection()[0].row;
      var pagePath =  dataTable.getValue(row, 0);
      var options = {
        query: {
          filters: 'ga:pagePath==' + pagePath
        },
        chart: {
          options: {
            title: pagePath
          }
        }
      };

      mainChart.set(options).execute();
      breakdownChart.set(options).execute();
    });
  });
  /**
   * Each time the main chart is rendered, add an event listener to it so
   * that when the user clicks on a row, the line chart is updated with
   * the data from the medium in the clicked row.
   */
  mainChart.on('success', function(response) {

    var chart = response.chart;
    var dataTable = response.dataTable;

    // Store a reference to this listener so it can be cleaned up later.
    mainChartRowClickListener = google.visualization.events
        .addListener(chart, 'select', function(event) {

      // When you unselect a row, the "select" event still fires
      // but the selection is empty. Ignore that case.
      if (!chart.getSelection().length) return;

      var row =  chart.getSelection()[0].row;
      var medium =  dataTable.getValue(row, 0);
      var options = {
        query: {
          filters: 'ga:medium==' + medium
        },
        chart: {
          options: {
            title: medium
          }
        }
      };

      pageChart.set(options).execute();
      breakdownChart.set(options).execute();
    });
  });

});