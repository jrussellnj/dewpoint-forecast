'use strict';

const e = React.createElement; // Any cached location coordinates that might be in local storage

const cachedCoords = localStorage.getItem('cachedCoords');
/* Create a React component to fetch weather data and display the upcoming dew point forecast */

class DewpointForecast extends React.Component {
  /* React constructor */
  constructor(props) {
    super(props); // Set the empty default state

    this.state = {
      city: null,
      weather: null
    }; // Required to make 'this' work in the click callback

    this.resetUserLocation = this.resetUserLocation.bind(this);
  }
  /* What to do after the React component mounts */


  componentDidMount() {
    let that = this,
        $locateMe = $('#locate-me'); // If the user has a latitude and longitude stored in local storage, use that to make the API call,
    // and if not, request their location from their browser

    if (cachedCoords != null) {
      this.getWeather(JSON.parse(cachedCoords));
    } else {
      this.getUserLocation();
    } // Connect the initLookup function within this class to the global window context, so Google Maps can invoke it


    window.initLookup = this.initLookup.bind(this); // Get the Maps API key and then load the Maps script

    loadJS('/js/api-key.js', function () {
      // Asynchronously load the Google Maps script, passing in the callback reference
      loadJS('https://maps.googleapis.com/maps/api/js?key=' + googleMapsApiKey + '&libraries=places&callback=initLookup');
    });
    $locateMe.click(function (e) {
      e.preventDefault(); // Empty out any location entered into the location search bar
      // Clear and rRe-query the browser location

      that.resetUserLocation();
    });
  }
  /* Use geolocation to find the user's latitude and longitude */


  getUserLocation() {
    let that = this,
        $gettingLocation = $('#getting-location'),
        $userDeniedGeolocation = $('.denied-geolocation');
    $gettingLocation.addClass('showing'); // Get the user's latitude and longitude

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition( // If we get permission to the user's location, use it to kick off the API call
      function (userCoords) {
        // Hide the "Getting location..." indicator
        $gettingLocation.removeClass('showing'); // Save these coordinates to the local storage for faster weather retrieval on subsequent visits

        localStorage.setItem('cachedCoords', JSON.stringify(cloneAsObject(userCoords.coords))); // Get the weather

        that.getWeather(userCoords.coords);
      }, // If not, display a 'geolocation failed' message
      function (error) {
        $gettingLocation.removeClass('showing');
        $userDeniedGeolocation.addClass('showing');
      }, // Options
      {
        timeout: 10000
      });
    } else {
      // If the user's browser doesn't have a geolocation API at all, display an error
      alert("Location unavailable from browser");
    }
  }
  /* Re-geolocate the user */


  resetUserLocation(e) {
    let that = this,
        $locationSearch = $('#location-search'),
        $gettingLocation = $('#getting-location'),
        $forecastHolder = $('#forecast-blocks'),
        $dewPointIn = $('#dew-point-in');

    if (e) {
      e.preventDefault();
    } // Fade out the city name


    $dewPointIn.removeClass('showing'); // Clear location bar 

    $locationSearch.val(''); // Fade out the forecast data

    $forecastHolder.fadeOut(function () {
      // Remove the locally-stored coords
      localStorage.removeItem('cachedCoords'); // Reset the state

      that.setState({
        city: null,
        weather: null
      }); // Show location loader

      $gettingLocation.addClass('showing'); // Reinitialize the retrieval of the user's location

      that.getUserLocation();
    });
  }
  /* Ask the server side to make an API call to Dark Sky to get the weather */


  getWeather(coords) {
    let that = this,
        $gettingWeather = $('#getting-weather'),
        $forecastHolder = $('#forecast-blocks'),
        $locationSearch = $('#location-search'),
        $userDeniedGeolocation = $('.denied-geolocation'),
        parsedCoords = JSON.parse(localStorage.getItem('cachedCoords')),
        cityName = '';
    $gettingWeather.addClass('showing');
    fetch('/get-weather?longitude=' + coords.longitude + '&latitude=' + coords.latitude).then(results => {
      return results.json();
    }).then(data => {
      $gettingWeather.removeClass('showing');
      $userDeniedGeolocation.removeClass('showing'); // Fade the forecast blocks out, if they're out, then fade the new weather in

      $forecastHolder.fadeOut(function () {
        // Get the city name for the user's location if one isn't cached in cachedCoords
        if (parsedCoords && parsedCoords['placeName'] !== undefined && $locationSearch.val() == '') {
          cityName = parsedCoords['placeName']; // Update the state with the retrieveved weather data and the city name

          that.setState({
            weather: data,
            city: cityName
          });
        } else {
          that.getCityName(coords); // Update the state with the retrieveved weather data

          that.setState({
            weather: data
          });
        }
      }).fadeIn();
    });
  }
  /* Use the Google Geolocation API to get the name of the city corresponding to the user's latitude and longitude */


  getCityName(coords) {
    let that = this,
        geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?key=' + googleMapsApiKey + '&latlng=' + coords.latitude + ',' + coords.longitude,
        $locationSearch = $('#location-search');
    fetch(geocodeUrl).then(results => {
      return results.json();
    }).then(data => {
      let addressComponents = data.results[0].address_components,
          localityPieces = $.grep(addressComponents, function (elem, index) {
        var acceptableElements = ['neighborhood', 'locality', 'administrative_area_level_1', 'country'];
        return acceptableElements.includes(elem.types[0]);
      }),
          sanitizedAddress = $.map(localityPieces, function (e, i) {
        return e.long_name;
      }).join(', ');
      that.setState({
        city: sanitizedAddress
      });
    });
  }
  /* Return the point on the discomfort scale for the provided dewpoint */


  getDiscomfortLevel(dewpoint) {
    let levelText = '',
        dpClass = '',
        levelIsFound = false,
        thisLevel = null,
        scale = [{
      'f': 50,
      'c': 10,
      'text': 'Pleasant',
      'class': 'dp-level-1'
    }, {
      'f': 55,
      'c': 12.8,
      'text': 'Comfortable',
      'class': 'dp-level-1'
    }, {
      'f': 60,
      'c': 15.6,
      'text': 'Noticible',
      'class': 'dp-level-2'
    }, {
      'f': 65,
      'c': 18.3,
      'text': 'Sticky',
      'class': 'dp-level-3'
    }, {
      'f': 70,
      'c': 21.1,
      'text': 'Uncomfortable',
      'class': 'dp-level-4'
    }, {
      'f': 75,
      'c': 23.9,
      'text': 'Oppressive',
      'class': 'dp-level-5'
    }, {
      'f': 100,
      'c': 37.8,
      'text': 'Severe Discomfort',
      'class': 'dp-level-6'
    }];
    scale.forEach(function (value, i) {
      if (!levelIsFound) {
        if (getCookie('units') != null && getCookie('units') == 'si' && dewpoint < value['c'] || (getCookie('units') != null && getCookie('units') == 'us' || getCookie('units') == null) && dewpoint < value['f']) {
          levelIsFound = true;
          thisLevel = value;
        }
      }
    });
    return {
      text: thisLevel['text'],
      dpClass: thisLevel['class']
    };
  }
  /* Initialize the location search bar */


  initLookup() {
    let that = this,
        input = $('#location-search').get(0),
        $forecastHolder = $('#forecast-blocks'),
        autocomplete = new google.maps.places.Autocomplete(input, {
      fields: ['place_id', 'name', 'types']
    }),
        geocoder = new google.maps.Geocoder();
    autocomplete.addListener('place_changed', function () {
      var place = autocomplete.getPlace();

      if (place.place_id) {
        // Hide the old forecast
        $forecastHolder.fadeOut(); // Get the latitude and longitude for the new location and then find its weather

        geocoder.geocode({
          'placeId': place.place_id
        }, function (results, status) {
          if (status !== 'OK') {
            window.alert('Geocoder failed due to: ' + status);
            return;
          } // Get weather for the requested location


          that.getWeather({
            latitude: results[0].geometry.location.lat(),
            longitude: results[0].geometry.location.lng()
          }); // Save this location in localStorage for subsequent visits

          localStorage.removeItem('cachedCoords');
          localStorage.setItem('cachedCoords', JSON.stringify({
            latitude: results[0].geometry.location.lat(),
            longitude: results[0].geometry.location.lng(),
            placeName: place.name
          }));
        });
      }
    }); // Clicking into the input clears it

    $(input).click(function () {
      $(this).val('');
    }); // Hitting enter selects the first location in thelocations dropdown

    var _addEventListener = input.addEventListener ? input.addEventListener : input.attachEvent; // Simulate a 'down arrow' keypress on hitting 'return' when no pac suggestion is selected and then trigger the original listener.


    function addEventListenerWrapper(type, listener) {
      if (type == "keydown") {
        var originalListener = listener;

        listener = function (event) {
          if (event.which == 13 || event.keyCode == 13) {
            var suggestionSelected = $(".pac-item.pac-item-selected").length > 0;

            if (!suggestionSelected) {
              var simulatedDownArrow = $.Event("keydown", {
                keyCode: 40,
                which: 40
              });
              originalListener.apply(input, [simulatedDownArrow]);
            }
          }

          originalListener.apply(input, [event]);
        };
      } // Add the modified listener


      _addEventListener.apply(input, [type, listener]);
    }

    if (input.addEventListener) {
      input.addEventListener = addEventListenerWrapper;
    } else if (input.attachEvent) {
      input.attachEvent = addEventListenerWrapper;
    }
  }
  /* Perform date formatting on a unix timestamp */


  formatDate(timestamp) {
    let today = new Date(),
        tomorrow = new Date(today.getTime() + 86400000),
        providedDate = new Date(timestamp * 1000),
        outputtedFormat = ''; // If the provided timestamp is today or tomorrow, say "Today" or "Tomorrow",
    // else output a formatted date like 'Thursday, April 20th'

    if (providedDate.format('M/j') == tomorrow.format('M/j')) {
      outputtedFormat = 'Tomorrow';
    } else {
      outputtedFormat = providedDate.format('l, F jS');
    }

    return outputtedFormat;
  }

  render() {
    let currentlyData = this.state.weather != null ? React.createElement("div", {
      className: "col-11 col-md-12 currently day"
    }, React.createElement("div", {
      className: "row today"
    }, React.createElement("div", {
      className: 'p-3 inner-wrapper col-12 col-md-6 ' + this.getDiscomfortLevel(this.state.weather.currently.dewPoint).dpClass
    }, React.createElement("div", {
      className: "currently-data"
    }, React.createElement("p", {
      className: "heading"
    }, "Right Now"), React.createElement("p", null, React.createElement("img", {
      className: "small-icon",
      src: "/image/sun-cloud.svg"
    }), " ", this.state.weather.currently.summary), React.createElement("p", null, React.createElement("img", {
      className: "small-icon",
      src: "/image/thermometer.svg"
    }), " Temperature: ", Math.round(this.state.weather.currently.temperature), "\xB0"), React.createElement("p", null, React.createElement("img", {
      className: "small-icon",
      src: "/image/humidity.svg"
    }), "  Humidity: ", Math.round(this.state.weather.currently.humidity * 100), "%"), React.createElement("div", {
      className: "dewpoint"
    }, React.createElement("div", null, React.createElement("img", {
      className: "dewdrop-icon",
      src: "/image/drop-silhouette.svg"
    }), " ", Math.round(this.state.weather.currently.dewPoint), "\xB0"), React.createElement("div", {
      className: "discomfort-text"
    }, this.getDiscomfortLevel(this.state.weather.currently.dewPoint).text)))), React.createElement("div", {
      className: 'p-3 inner-wrapper col-12 col-md-6 ' + this.getDiscomfortLevel(this.state.weather.daily.data[0].dewPoint).dpClass
    }, React.createElement("p", {
      className: "heading"
    }, "Today's forecast"), React.createElement("p", null, React.createElement("img", {
      className: "small-icon",
      src: "/image/sun-cloud.svg"
    }), " ", this.state.weather.daily.data[0].summary), React.createElement("p", null, React.createElement("img", {
      className: "small-icon",
      src: "/image/thermometer.svg"
    }), " Temperature: ", Math.round(this.state.weather.daily.data[0].temperatureHigh), "\xB0"), React.createElement("p", null, React.createElement("img", {
      className: "small-icon",
      src: "/image/humidity.svg"
    }), " Humidity: ", Math.round(this.state.weather.daily.data[0].humidity * 100), "%"), React.createElement("div", {
      className: "dewpoint"
    }, React.createElement("div", null, React.createElement("img", {
      className: "dewdrop-icon",
      src: "/image/drop-silhouette.svg"
    }), " ", Math.round(this.state.weather.daily.data[0].dewPoint), "\xB0"), React.createElement("div", {
      className: "discomfort-text"
    }, this.getDiscomfortLevel(this.state.weather.daily.data[0].dewPoint).text))))) : null;
    let dailyData = this.state.weather != null ? this.state.weather.daily.data.slice(1).map(day => React.createElement("div", {
      className: "col-11 col-sm-4 col-md-3 day",
      key: day.time
    }, React.createElement("div", {
      className: 'd-flex align-items-center p-3 inner-wrapper ' + this.getDiscomfortLevel(day.dewPoint).dpClass
    }, React.createElement("div", {
      className: "day-contents"
    }, React.createElement("div", {
      className: "temperature"
    }, React.createElement("div", {
      className: "date"
    }, this.formatDate(day.time)), React.createElement("img", {
      className: "dewdrop-icon",
      src: "/image/drop-silhouette.svg"
    }), " ", Math.round(day.dewPoint), "\xB0", React.createElement("div", {
      className: "discomfort-text"
    }, this.getDiscomfortLevel(day.dewPoint).text)), React.createElement("div", {
      className: "summary"
    }, React.createElement("div", null, day.summary, " High: ", Math.round(day.temperatureHigh), "\xB0. Humidity: ", Math.round(day.humidity * 100), "%.")))))) : null;
    return React.createElement("div", null, React.createElement("div", {
      className: "row"
    }, React.createElement("div", {
      className: "col-12"
    }, React.createElement("h5", {
      className: "city-name"
    }, this.state.city))), React.createElement("div", {
      className: "row justify-content-center justify-content-md-start",
      id: "forecast-blocks"
    }, currentlyData, dailyData), React.createElement("div", {
      className: "row denied-geolocation text-center"
    }, React.createElement("div", {
      className: "col-12"
    }, React.createElement("h3", null, "Geolocation failed"), React.createElement("p", null, "But that's alright! You can use the site without geolocation by entering a location above."))));
  }

} // Find the forecast container and kick off React


$(document).ready(function () {
  const domContainer = document.querySelector('#forecast');
  ReactDOM.render(e(DewpointForecast), domContainer);
});