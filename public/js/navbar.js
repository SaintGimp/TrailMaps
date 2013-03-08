/*global define: false*/

define(['jquery', './mapcontrol', 'bootstrap'], function($, mapControl) {
  $(function () {
    $('#searchForm').submit(function() {
        var url = "/api/trails/pct/milemarkers/" + $('#searchBox').val();
        $.getJSON(url, function(result) {
            mapControl.setCenterAndZoom({
              center: {
                latitude: result.loc[1],
                longitude: result.loc[0]
              },
              zoom: 16
            });
        });
        return false;
    });

    // TODO: this ought to be a custom 'shown' event raised by Bootstrap but it
    // doesn't seem to be fired for pills.  Bug?
    $('a[data-toggle="pill"]').on('click', function (e) {
      // TODO: We used to have to force tabs to be shown here before Google got inited otherwise
      // it would freak out. That seems to be no longer the case after implementing require.js,
      // but I'm not sure if it works only due to timing or what.  Keep on eye on this.
      mapControl.showingMap(e.target.hash);
    });
  });
});
