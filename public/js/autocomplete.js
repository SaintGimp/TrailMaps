/**
 * Vanilla JavaScript autocomplete implementation
 */
export default function Autocomplete(inputElement, options) {
  if (!inputElement || !options.source) {
    throw new Error("Autocomplete requires an input element and a source function");
  }

  const minLength = options.minLength || 3;
  const onSelect = options.onSelect || function () {};
  let currentSuggestions = [];
  let selectedIndex = -1;
  let dropdown = null;

  // Create dropdown element
  function createDropdown() {
    const div = document.createElement("div");
    div.className = "autocomplete-dropdown";
    div.style.cssText =
      "position: absolute; z-index: 1000; background: white; border: 1px solid #ccc; " +
      "border-top: none; max-height: 300px; overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);";
    document.body.appendChild(div);
    return div;
  }

  // Position dropdown below input
  function positionDropdown() {
    if (!dropdown) return;

    const rect = inputElement.getBoundingClientRect();
    dropdown.style.left = rect.left + window.scrollX + "px";
    dropdown.style.top = rect.bottom + window.scrollY + "px";
    dropdown.style.width = rect.width + "px";
  }

  // Show suggestions
  function showSuggestions(suggestions) {
    if (!dropdown) {
      dropdown = createDropdown();
    }

    currentSuggestions = suggestions;
    selectedIndex = -1;

    if (suggestions.length === 0) {
      hideDropdown();
      return;
    }

    dropdown.innerHTML = "";
    suggestions.forEach((suggestion, index) => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.textContent = suggestion;
      item.style.cssText =
        "padding: 8px 12px; cursor: pointer; color: #333; " + "transition: background-color 0.15s ease;";

      item.addEventListener("mouseenter", function () {
        selectedIndex = index;
        updateSelection();
      });

      item.addEventListener("click", function (e) {
        e.preventDefault();
        selectItem(index);
      });

      dropdown.appendChild(item);
    });

    positionDropdown();
    dropdown.style.display = "block";
  }

  // Hide dropdown
  function hideDropdown() {
    if (dropdown) {
      dropdown.style.display = "none";
    }
    currentSuggestions = [];
    selectedIndex = -1;
  }

  // Update visual selection
  function updateSelection() {
    if (!dropdown) return;

    const items = dropdown.querySelectorAll(".autocomplete-item");
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.style.backgroundColor = "#007bff";
        item.style.color = "#fff";
      } else {
        item.style.backgroundColor = "#fff";
        item.style.color = "#333";
      }
    });
  }

  // Select an item
  function selectItem(index) {
    if (index >= 0 && index < currentSuggestions.length) {
      const selectedValue = currentSuggestions[index];
      inputElement.value = selectedValue;
      hideDropdown();
      onSelect(selectedValue);
    }
  }

  // Handle input event
  inputElement.addEventListener("input", function () {
    const query = inputElement.value;

    if (query.length < minLength) {
      hideDropdown();
      return;
    }

    // Call the source function to get suggestions
    options.source(query, function (suggestions) {
      showSuggestions(suggestions || []);
    });
  });

  // Handle keyboard navigation
  inputElement.addEventListener("keydown", function (e) {
    if (!dropdown || dropdown.style.display === "none") {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
        updateSelection();
        break;

      case "ArrowUp":
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelection();
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectItem(selectedIndex);
        }
        break;

      case "Escape":
        e.preventDefault();
        hideDropdown();
        break;
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (e.target !== inputElement && dropdown && !dropdown.contains(e.target)) {
      hideDropdown();
    }
  });

  // Reposition on window resize/scroll
  window.addEventListener("resize", positionDropdown);
  window.addEventListener("scroll", positionDropdown, true);

  // Public API
  return {
    destroy: function () {
      if (dropdown && dropdown.parentNode) {
        dropdown.parentNode.removeChild(dropdown);
      }
      dropdown = null;
    }
  };
}
