/*global define: false*/

define(["knockout"], function(ko) {
  ko.bindingHandlers.enterkey = {
    init: function(element, valueAccessor, allBindingsAccessor, data, bindingContext) {
      // wrap the handler with a check for the enter key
      var wrappedHandler = function(data, event) {
        if (event.keyCode === 13) {
          valueAccessor().call(this, data, event);
          element.blur();
        }
      };
      // call the real event binding for "keyup" with our wrapped handler
      ko.bindingHandlers.event.init(element, function() { return { keyup: wrappedHandler }; }, allBindingsAccessor, data, bindingContext);
    }
  };

  ko.bindingHandlers.escapekey = {
    init: function(element, valueAccessor, allBindingsAccessor, data, bindingContext) {
      // wrap the handler with a check for the escape key
      var wrappedHandler = function(data, event) {
        if (event.keyCode === 27) {
          valueAccessor().call(this, data, event);
          element.blur();
        }
      };
      // call the real event binding for "keyup" with our wrapped handler
      ko.bindingHandlers.event.init(element, function() { return { keyup: wrappedHandler }; }, allBindingsAccessor, data, bindingContext);
    }
  };
});