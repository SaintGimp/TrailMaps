export default function WaypointViewModel() {
  const self = this;

  let name = "";
  let isEditing = false;
  let originalValues = null;

  self.id = null;
  self.halfmileDescription = null;
  self.latitude = null;
  self.longitude = null;
  self.seq = null;
  self.location = null;
  self.link = null;

  self.getName = () => name;
  self.setName = (value) => {
    name = value;
  };

  self.isEditing = () => isEditing;

  self.fromJS = function (data) {
    self.id = data._id;
    name = data.name;
    self.halfmileDescription = data.halfmileDescription;
    self.latitude = data.loc[1];
    self.longitude = data.loc[0];
    self.seq = data.seq;

    self.location = self.latitude.toFixed(5) + ", " + self.longitude.toFixed(5);
    self.link = "maps/azure?lat=" + self.latitude.toFixed(5) + "&lon=" + self.longitude.toFixed(5) + "&zoom=15";
  };

  self.toJS = function () {
    return {
      name: name,
      loc: [self.longitude, self.latitude],
      seq: self.seq,
      _id: self.id
    };
  };

  self.edit = function () {
    originalValues = self.toJS();
    isEditing = true;
  };

  self.confirmEdit = function () {
    return fetch("/api/trails/pct/waypoints/" + self.id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(self.toJS())
    })
      .then((response) => {
        if (response.ok) {
          isEditing = false;
          return true;
        }
        return false;
      })
      .catch(() => false);
  };

  self.cancelEdit = function () {
    self.fromJS(originalValues);
    isEditing = false;
  };

  self.delete = function () {
    return fetch("/api/trails/pct/waypoints/" + self.id, {
      method: "DELETE"
    })
      .then((response) => response.ok)
      .catch(() => false);
  };
}
