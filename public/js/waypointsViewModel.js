define(["waypointViewModel"], function (WaypointViewModel) {
  return function () {
    const self = this;
    const waypoints = [];
    let activeWaypoint = null;

    self.getWaypoints = () => waypoints;

    self.loadData = function () {
      const url = "/api/trails/pct/waypoints";
      return fetch(url)
        .then((response) => response.json())
        .then((data) => {
          waypoints.length = 0; // Clear array

          data.forEach(function (element) {
            const waypoint = new WaypointViewModel();
            waypoint.fromJS(element);
            waypoints.push(waypoint);
          });

          return true;
        });
    };

    self.deleteWaypoint = function (waypoint) {
      return waypoint.delete().then(function (success) {
        if (success) {
          const index = waypoints.indexOf(waypoint);
          if (index > -1) {
            waypoints.splice(index, 1);
          }
          return true;
        } else {
          alert("Error deleting waypoint.");
          return false;
        }
      });
    };

    self.edit = function (waypoint) {
      if (activeWaypoint) {
        activeWaypoint.cancelEdit();
      }

      activeWaypoint = waypoint;
      waypoint.edit();
    };

    self.confirmEdit = function (waypoint) {
      activeWaypoint = null;
      return waypoint.confirmEdit();
    };

    self.cancelEdit = function (waypoint) {
      if (waypoint === activeWaypoint) {
        waypoint.cancelEdit();
      }
      activeWaypoint = null;
    };

    self.isEditingWaypoint = function (waypoint) {
      return waypoint.isEditing();
    };
  };
});
