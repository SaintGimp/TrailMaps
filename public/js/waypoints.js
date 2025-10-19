import WaypointsViewModel from "./waypointsViewModel.js";

const waypointsViewModel = new WaypointsViewModel();
const waypointsContainer = document.getElementById("waypoints");

waypointsViewModel.loadData().then(function () {
  if (waypointsContainer) {
    renderWaypoints();
    waypointsContainer.style.display = "block";
  }
});

function renderWaypoints() {
  const waypoints = waypointsViewModel.getWaypoints();
  const tbody = waypointsContainer.querySelector("tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  waypoints.forEach(function (waypoint) {
    const row = createWaypointRow(waypoint);
    tbody.appendChild(row);
  });
}

function createWaypointRow(waypoint) {
  const isEditing = waypoint.isEditing();
  const row = document.createElement("tr");

  if (isEditing) {
    row.innerHTML = `
      <td>
        <input type="text" style="width: 100%;" class="waypoint-name-input" value="${escapeHtml(waypoint.getName())}" />
      </td>
      <td>${escapeHtml(waypoint.halfmileDescription || "")}</td>
      <td>
        <a href="${escapeHtml(waypoint.link)}">${escapeHtml(waypoint.location)}</a>
      </td>
      <td>
        <div class="btn-group btn-group-xs">
          <button class="btn btn-primary disabled">Edit</button>
          <button class="btn btn-link disabled">Delete</button>
        </div>
      </td>
    `;

    const input = row.querySelector(".waypoint-name-input");
    setTimeout(() => input.focus(), 0);

    input.addEventListener("keydown", function (event) {
      if (event.keyCode === 13) {
        // Enter key
        event.preventDefault();
        waypoint.setName(input.value);
        waypointsViewModel.confirmEdit(waypoint).then(() => renderWaypoints());
      } else if (event.keyCode === 27) {
        // Escape key
        event.preventDefault();
        waypointsViewModel.cancelEdit(waypoint);
        renderWaypoints();
      }
    });

    input.addEventListener("blur", function () {
      waypoint.setName(input.value);
      waypointsViewModel.confirmEdit(waypoint).then(() => renderWaypoints());
    });
  } else {
    row.innerHTML = `
      <td class="waypoint-name">${escapeHtml(waypoint.getName())}</td>
      <td>${escapeHtml(waypoint.halfmileDescription || "")}</td>
      <td>
        <a href="${escapeHtml(waypoint.link)}">${escapeHtml(waypoint.location)}</a>
      </td>
      <td>
        <div class="btn-group btn-group-xs">
          <button class="btn btn-primary edit-btn">Edit</button>
          <button class="btn btn-link delete-btn">Delete</button>
        </div>
      </td>
    `;

    const nameCell = row.querySelector(".waypoint-name");
    nameCell.addEventListener("dblclick", function () {
      waypointsViewModel.edit(waypoint);
      renderWaypoints();
    });

    const editBtn = row.querySelector(".edit-btn");
    editBtn.addEventListener("click", function () {
      waypointsViewModel.edit(waypoint);
      renderWaypoints();
    });

    const deleteBtn = row.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", function () {
      if (confirm("Are you sure you want to delete this waypoint?")) {
        waypointsViewModel.deleteWaypoint(waypoint).then(() => renderWaypoints());
      }
    });
  }

  return row;
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
