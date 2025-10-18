/*global define: false*/

define(function () {
  return function (mapContainer) {
    const self = this;
    self.mapContainer = mapContainer;

    let waypointName = "";

    // Event listeners for modal
    const modal = document.getElementById("createWaypointDialog");
    if (modal) {
      modal.addEventListener("show.bs.modal", function () {
        waypointName = "";
        const input = document.getElementById("newWaypointName");
        if (input) {
          input.value = "";
        }
      });

      modal.addEventListener("shown.bs.modal", function () {
        const input = document.getElementById("newWaypointName");
        if (input) {
          input.focus();
        }
      });
    }

    self.getWaypointName = () => waypointName;
    self.setWaypointName = (name) => {
      waypointName = name;
      const input = document.getElementById("newWaypointName");
      if (input) {
        input.value = name;
      }
    };

    self.create = function () {
      const input = document.getElementById("newWaypointName");
      if (input) {
        waypointName = input.value;
      }

      return fetch("/api/trails/pct/waypoints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(self.toJS())
      })
        .then((response) => {
          self.hide();
          return response.ok;
        })
        .catch(() => {
          self.hide();
          return false;
        });
    };

    self.toJS = function () {
      const viewOptions = mapContainer.getViewOptions();
      return {
        name: waypointName,
        loc: [viewOptions.view.center.longitude, viewOptions.view.center.latitude]
      };
    };

    self.hide = function () {
      // Bootstrap 3 requires jQuery for modal control
      if (window.jQuery && window.jQuery.fn.modal) {
        window.jQuery("#createWaypointDialog").modal("hide");
      }
    };
  };
});
