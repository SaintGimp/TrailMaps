$(function () {
    $('#searchForm').submit(function() {
        var url = "/api/trails/pct/milemarkers/" + $('#searchBox').val();
        $.getJSON(url, function(result) {
            mapControl.setCenterAndZoom(result.loc, 16);
        });
        return false;
    });
});