/*jshint expr:true*/

// TODO: can we set maps for the test stuff in testem.json?
define(["jquery", "/test/lib/Squire.js", "/test/client/testableMapContainer.js"], function($, Squire, testableMapContainer) {
  var sandbox;
  var injector;
  var mapContainer;

  function mockedRequire(modules, callback) {
    $.each(modules, function(index, value) {
      loadedModules.push(value);
    });
    injector.require(modules, callback);
  }

  function initializeDOM() {
    $('#testArea').remove();
    $('body').append('<div id="testArea" style="width:400px; height:200px; border:solid red 2px"></div>');
    $('#testArea').append('<div id="bing"</div>');
    $('#testArea').append('<div id="google"</div>');
    $('#testArea').append('<div id="here"</div>');
  }

  function initialize(mapName, done) {
    sandbox = sinon.sandbox.create();
    sandbox.useFakeServer();

    initializeDOM();
    testableMapContainer.create(mapName, sandbox.server)
    .done(function(newMapContainer) {
      mapContainer = newMapContainer;
      sandbox.server.respond();
      done();
    });
  }

  function cleanup() {
    $('#testArea').remove();
    sandbox.restore();
  }

  function verifyMapTrailDataMatchesView(map) {
    var west = map.trackData[0].loc[0];
    var north = map.trackData[0].loc[1];
    var east = map.trackData[1].loc[0];
    var south = map.trackData[1].loc[1];
    var width = east - west;
    var height = north - south;
    expect(width).to.equal(map.getBounds().width * mapContainer.trackBoundsMultiple);
    expect(height).to.equal(map.getBounds().height * mapContainer.trackBoundsMultiple);

    var marker = map.mileMarkerData[0];
    expect(marker.loc[0]).to.equal(map.getCenter().longitude);
    expect(marker.loc[1]).to.equal(map.getCenter().latitude);
  }

  describe('Map container', function() {
    describe('Initializing the map container', function() {
      before(function(done) {
        initialize('bing', done);
      });

      it ('should load the requested map module', function() {
        expect(mapContainer.loadedModules.length).to.equal(1);
        expect(mapContainer.loadedModules[0]).to.equal("bingmaps");
      });

      it ('should give the map module a DOM element to work with', function() {
        expect(mapContainer.fakeBingMaps.container.id).to.equal($('#bing')[0].id);
      });

      it ('should configure the map module with the default center and zoom', function() {
        var config = mapContainer.fakeBingMaps.getCenterAndZoom();
        expect(config.center).to.equal(mapContainer.defaultCenter);
        expect(config.zoom).to.equal(mapContainer.defaultZoomLevel);
      });

      it ('should load trail data from the server and display it on the map', function() {
        expect(mapContainer.numberOfServerRequests).to.equal(1);
        expect(mapContainer.fakeBingMaps.trackData).to.be.ok;
        expect(mapContainer.fakeBingMaps.mileMarkerData).to.be.ok;

        verifyMapTrailDataMatchesView(mapContainer.fakeBingMaps);
      });

      after(function() {
        cleanup();
      });
    });

    describe('Switching to another map type', function() {
      before(function(done) {
        initialize('bing', function() {
          mapContainer.showingMap('google')
          .done(function() {
            sandbox.server.respond();
            done();
          });
        });
      });

      it ('should load the default and the new map modules', function() {
        expect(mapContainer.loadedModules.length).to.equal(2);
        expect(mapContainer.loadedModules[1]).to.equal("googlemaps");
      });

      it ('should give the new map module a DOM element to work with', function() {
        expect(mapContainer.fakeGoogleMaps.container.id).to.equal($('#google')[0].id);
      });

      it ('should configure the second map module with the same center and zoom as the first map', function() {
        var config = mapContainer.fakeGoogleMaps.getCenterAndZoom();
        expect(config.center).to.equal(mapContainer.defaultCenter);
        expect(config.zoom).to.equal(mapContainer.defaultZoomLevel);
      });

      it ('should not reload trail data from the server', function() {
        expect(mapContainer.numberOfServerRequests).to.equal(1);
      });

      it ('should display trail data on the second map', function() {
        verifyMapTrailDataMatchesView(mapContainer.fakeGoogleMaps);
      });

      it ('should publish the active map name', function() {
        expect(mapContainer.activeMapName()).to.equal('google');
      });

      after(function() {
        cleanup();
      });
    });

    describe('Zooming in on the map', function() {
      before(function(done) {
        initialize('bing', function() {
          mapContainer.fakeBingMaps.setCenterAndZoom({
            center: mapContainer.fakeBingMaps.getCenter(),
            zoom: mapContainer.fakeBingMaps.getZoom() + 1
          });
          sandbox.server.respond();
          done();
        });
      });

      it ('should load new trail data', function() {
        expect(mapContainer.numberOfServerRequests).to.equal(2);
      });

      after(function() {
        cleanup();
      });
    });

    describe('Panning a little bit on the map', function() {
      before(function(done) {
        initialize('bing', function() {
          var newCenter = mapContainer.fakeBingMaps.getCenter();
          newCenter.latitude += 1;
          mapContainer.fakeBingMaps.setCenterAndZoom({
            center: newCenter,
            zoom: mapContainer.fakeBingMaps.getZoom()
          });
          sandbox.server.respond();
          done();
        });
      });

      it ('should not load new trail data', function() {
        expect(mapContainer.numberOfServerRequests).to.equal(1);
      });

      after(function() {
        cleanup();
      });
    });

    describe('Panning a lot on the map', function() {
      before(function(done) {
        initialize('bing', function() {
          var newCenter = mapContainer.fakeBingMaps.getCenter();
          newCenter.latitude += 20;
          mapContainer.fakeBingMaps.setCenterAndZoom({
            center: newCenter,
            zoom: mapContainer.fakeBingMaps.getZoom()
          });
          sandbox.server.respond();
          done();
        });
      });

      it ('should load new trail data', function() {
        expect(mapContainer.numberOfServerRequests).to.equal(2);
      });

      it ('should display new trail data on the map', function() {
        verifyMapTrailDataMatchesView(mapContainer.fakeBingMaps);
      });

      after(function() {
        cleanup();
      });
    });

    describe('Switching to new map type after changing view', function() {
      before(function(done) {
        initialize('bing', function() {
          mapContainer.setCenterAndZoom({
            center: mapContainer.fakeBingMaps.getCenter(),
            zoom: mapContainer.fakeBingMaps.getZoom() + 1
          });
          mapContainer.showingMap('google')
          .done(function() {
            sandbox.server.respond();
            done();
          });
        });
      });

      it ('show the new map with the same view as the old map', function() {
        expect(mapContainer.fakeGoogleMaps.getZoom()).to.equal(mapContainer.fakeBingMaps.getZoom());
      });

      it ('should not load new trail data for the new map', function() {
        expect(mapContainer.numberOfServerRequests).to.equal(2);
      });

      it ('should display trail data on the map', function() {
        verifyMapTrailDataMatchesView(mapContainer.fakeGoogleMaps);
      });

      after(function() {
        cleanup();
      });
    });

    describe('Switching to an already-loaded map type after changing view', function() {
      before(function(done) {
        initialize('bing', function() {
          mapContainer.showingMap('google')
          .then(function() {
            mapContainer.setCenterAndZoom({
              center: mapContainer.fakeGoogleMaps.getCenter(),
              zoom: mapContainer.fakeGoogleMaps.getZoom() + 1
            });
          }).done(function() {
            mapContainer.showingMap('bing')
            .done(function() {
              sandbox.server.respond();
              done();
            });
          });
        });
      });

      it ('show the map with the same view as the old map', function() {
        expect(mapContainer.fakeBingMaps.getZoom()).to.equal(mapContainer.fakeGoogleMaps.getZoom());
      });

      it ('should not load new trail data for the map', function() {
        expect(mapContainer.numberOfServerRequests).to.equal(2);
      });

      it ('should display trail data on the map', function() {
        verifyMapTrailDataMatchesView(mapContainer.fakeBingMaps);
      });

      after(function() {
        cleanup();
      });
    });

    describe('Changing the view', function() {
      before(function(done) {
        initialize('bing', function() {
          mapContainer.setCenterAndZoom({
            center: mapContainer.fakeBingMaps.getCenter(),
            zoom: mapContainer.fakeBingMaps.getZoom() + 1
          });
          sandbox.server.respond();
          done();
        });
      });

      it ('should load new trail data', function() {
        expect(mapContainer.numberOfServerRequests).to.equal(2);
      });

      after(function() {
        cleanup();
      });
    });

    describe('Getting a URL fragment', function() {
      before(function(done) {
        initialize('bing', function() {
          done();
        });
      });

      it ('should build a URL that describes the current map and view', function() {
        expect(mapContainer.getUrlFragment()).to.equal('bing?lat=40.50643&lon=-121.36088&zoom=5');
      });

      after(function() {
        cleanup();
      });
    });

  });
});
