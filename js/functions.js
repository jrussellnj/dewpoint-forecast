// Needed for turning navigator.geolocation object into a JSON.stringify-able object
function cloneAsObject(obj) {
  if (obj === null || !(obj instanceof Object)) {
    return obj;
  }

  var temp = (obj instanceof Array) ? [] : {};

  for (var key in obj) {
    temp[key] = cloneAsObject(obj[key]);
  }

  return temp;
}

// Used for loading external Javascript
function loadJS(src, callback) {
  var
    ref = window.document.getElementsByTagName("script")[0],
    script = window.document.createElement("script");

  script.src = src;
  script.async = true;
  script.onload = callback;

  ref.parentNode.insertBefore(script, ref);
}

// Get cookie values
function getCookie(name) {
  var value = "; " + document.cookie,
      parts = value.split("; " + name + "="),
      value = null;

  if (parts.length == 2) {
    value = parts.pop().split(";").shift();
  }

  return value;
}
