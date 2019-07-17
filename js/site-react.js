'use strict';

const e = React.createElement;

// Any cached location coordinates that might be in local storage
const cachedCoords = localStorage.getItem('cachedCoords');

/* Create a React component to fetch weather data and display the upcoming dew point forecast */
class DewpointForecast extends React.Component {

  /* React constructor */
  constructor(props) {
    super(props);

    // Set the empty default state
    this.state = {
      city: null,
      weather: null
    };

    // Required to make 'this' work in the click callback
    this.resetUserLocation = this.resetUserLocation.bind(this);
  }

  /* What to do after the React component mounts */
  componentDidMount() {
    let that = this,
        $locateMe = $('.locate-me');

    // If the user has a latitude and longitude stored in local storage, use that to make the API call,
    // and if not, request their location from their browser
    if (cachedCoords != null) {
      this.getWeather(JSON.parse(cachedCoords));
    }
    else {
      this.getUserLocation();
    }

    // Connect the initLookup function within this class to the global window context, so Google Maps can invoke it
    window.initLookup = this.initLookup.bind(this);

    // Get the Maps API key and then load the Maps script
    loadJS('/js/api-key.js', function() {

      // Asynchronously load the Google Maps script, passing in the callback reference
      loadJS('https://maps.googleapis.com/maps/api/js?key=' + googleMapsApiKey + '&libraries=places&callback=initLookup');
    });

    $locateMe.click(function(e) {
      e.preventDefault();
      that.resetUserLocation();
    });
  }

  /* Use geolocation to find the user's latitude and longitude */
  getUserLocation() {
    let that = this,
        $gettingLocation = $('.getting-location'),
        $userDeniedGeolocation = $('.denied-geolocation');

    $gettingLocation.addClass('showing');

    // Get the user's latitude and longitude
    if ("geolocation" in navigator) {

      navigator.geolocation.getCurrentPosition(

        // If we get permission to the user's location, use it to kick off the API call
        function(userCoords) {

          // Hide the "Getting location..." indicator
          $gettingLocation.removeClass('showing');

          // Save these coordinates to the local storage for faster weather retrieval on subsequent visits
          localStorage.setItem('cachedCoords', JSON.stringify(cloneAsObject(userCoords.coords)));

          // Get the weather
          that.getWeather(userCoords.coords);
        },

        // If not, display a 'geolocation denied' message
        function(error) {
          $gettingLocation.removeClass('showing');
          $userDeniedGeolocation.addClass('showing');
        },

        // Options
        {
          timeout:10000
        });
    }
    else {

      // If the user's browser doesn't have a geolocation API at all, display an error
      alert("Location unavailable from browser");
    }
  }

  /* Re-geolocate the user */
  resetUserLocation(e) {
    let that = this,
        $gettingLocation = $('.getting-location'),
        $forecastHolder = $('.forecast-holder');

    if (e) {
      e.preventDefault();
    }

    // Fade out the forecast data
    $forecastHolder.fadeOut(function() {

      // Remove the locally-stored coords
      localStorage.removeItem('cachedCoords');

      // Reset the state
      that.setState({
        city: null,
        weather: null
      });

      // Show location loader
      $gettingLocation.addClass('showing');

      // Reinitialize the retrieval of the user's location
      that.getUserLocation();
    });
  }

  /* Ask the server side to make an API call to Dark Sky to get the weather */
  getWeather(coords) {
    let that = this,
        $gettingWeather = $('.getting-weather'),
        $forecastHolder = $('.forecast-holder'),
        $userDeniedGeolocation = $('.denied-geolocation');

    $gettingWeather.addClass('showing');

    fetch('/get-weather?longitude=' + coords.longitude + '&latitude=' + coords.latitude)
      .then(results => {
        return results.json()
      })
      .then(data => {

        $gettingWeather.removeClass('showing');
        $userDeniedGeolocation.removeClass('showing');

          // Fade the forecast blocks out, if they're out, then fade the new weather in
          $forecastHolder.fadeOut(function() {

            // Get the city name for the user's location
            that.getCityName(coords);

            // Update the state with the retrieveved weather data
            that.setState({
              weather: data
            });
          }).fadeIn();
        // });
      });
  }

  /* Use the Google Geolocation API to get the name of the city corresponding to the user's latitude and longitude */
  getCityName(coords) {
    let
      geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?key=' + googleMapsApiKey + '&latlng=' + coords.latitude + ',' + coords.longitude,
      that = this;

    fetch(geocodeUrl)
      .then(results => {
        return results.json()
      })
      .then(data => {

        let
          addressComponents = data.results[0].address_components,
          localityPieces  = $.grep(addressComponents, function(elem, index) {
            var acceptableElements = [ 'neighborhood', 'locality', 'administrative_area_level_1', 'country' ];
            return acceptableElements.includes(elem.types[0]);
          }),
          sanitizedAddress = $.map(localityPieces, function(e, i) {
            return e.long_name
          }).join(', '),
          cityName = '';

        // Use either a location's neighborhood name or its general locality for displaying
        cityName = localityPieces[0].long_name;

        // Update the state with the city name
        that.setState({
          city: cityName
        });
      });
  }

  /* Return the point on the discomfort scale for the provided dewpoint */
  getDiscomfortLevel(dewpoint) {

    let
      levelText = '',
      dpClass = '';

    if (dewpoint < 50) {
      levelText = 'Pleasant';
      dpClass = 'dp-level-1';
    }
    else if (dewpoint >= 50 && dewpoint <= 55.99) {
      levelText = 'Comfortable';
      dpClass = 'dp-level-1';
    }
    else if (dewpoint >= 56 && dewpoint <= 60.99) {
      levelText = 'Noticible';
      dpClass = 'dp-level-2';
    }
    else if (dewpoint >= 61 && dewpoint <= 65.99) {
      levelText = 'Sticky';
      dpClass = 'dp-level-3';
    }
    else if (dewpoint >= 66 && dewpoint <= 70.99) {
      levelText = 'Uncomfortable';
      dpClass = 'dp-level-4';
    }
    else if (dewpoint >= 71 && dewpoint <= 75.99) {
      levelText = 'Oppressive';
      dpClass = 'dp-level-5';
    }
    else if (dewpoint > 75) {
      levelText = 'Severe Discomfort';
      dpClass = 'dp-level-6';
    }

    return { text: levelText, dpClass: dpClass };
  }

  /* Initialize the location search bar */
  initLookup() {
    let
      that = this,
      input = document.getElementById('location-search'),
      $forecastHolder = $('.forecast-holder'),
      autocomplete = new google.maps.places.Autocomplete(input, { fields: ['place_id', 'name', 'types'] }),
      geocoder = new google.maps.Geocoder;

    autocomplete.addListener('place_changed', function() {
      var place = autocomplete.getPlace();

      if (!place.place_id) {
        return;
      }

      // Hide the old forecast
      $forecastHolder.fadeOut();

      // Get the latitude and longitude for the new location and then find its weather
      geocoder.geocode({ 'placeId': place.place_id }, function(results, status) {
        if (status !== 'OK') {
          window.alert('Geocoder failed due to: ' + status);
          return;
        }

        // Get weather for the requested location
        that.getWeather({ latitude: results[0].geometry.location.lat(), longitude: results[0].geometry.location.lng() });

        // Save this location in localStorage for subsequent visits
        localStorage.removeItem('cachedCoords');
        localStorage.setItem('cachedCoords', JSON.stringify({ latitude: results[0].geometry.location.lat(), longitude: results[0].geometry.location.lng() }));
      });
    });

    // Clicking into the input clears it
    $(input).click(function() {
      $(this).val('');
    });

    // Hitting enter selects the first location in thelocations dropdown
    var _addEventListener = (input.addEventListener) ? input.addEventListener : input.attachEvent;

    // Simulate a 'down arrow' keypress on hitting 'return' when no pac suggestion is selected and then trigger the original listener.
    function addEventListenerWrapper(type, listener) {

      if (type == "keydown") {
        var originalListener = listener;

        listener = function (event) {
          if (event.which == 13 || event.keyCode == 13) {
          var suggestionSelected = $(".pac-item.pac-item-selected").length > 0;

            if (!suggestionSelected) {
              var simulatedDownArrow = $.Event("keydown", { keyCode:40, which:40 });
              originalListener.apply(input, [ simulatedDownArrow ]);
            }
          }

          originalListener.apply(input, [ event ]);
        };
      }

      // Add the modified listener
      _addEventListener.apply(input, [ type, listener ]);
    }

    if (input.addEventListener) {
      input.addEventListener = addEventListenerWrapper;
    }
    else if (input.attachEvent) {
      input.attachEvent = addEventListenerWrapper;
    }
  }

  /* Perform date formatting on a unix timestamp */
  formatDate(timestamp) {
    let
      today = new Date(),
      tomorrow = new Date(today.getTime() + 86400000),
      providedDate = new Date(timestamp * 1000),
      outputtedFormat = '';

    // If the provided timestamp is today or tomorrow, say "Today" or "Tomorrow",
    // else output a formatted date like 'Thursday, April 20th'
    if (providedDate.format('M/j') == today.format('M/j')) {
      outputtedFormat = "Today's forecast";
    }
    else if (providedDate.format('M/j') == tomorrow.format('M/j')) {
      outputtedFormat = 'Tomorrow';
    }
    else {
      outputtedFormat = providedDate.format('l, F jS');
    }

    return outputtedFormat;
  }

  render() {

    let currentlyData = this.state.weather != null ?
      <div className="col-11 col-md-6 currently day">
        <div className={'p-3 inner-wrapper ' + this.getDiscomfortLevel(this.state.weather.currently.dewPoint).dpClass}>
          <div>Currently</div>
          <div className="city-name">{this.state.city}</div>

          <div className="dewpoint">
            <div><img className="dewdrop-icon" src="/image/icons8-water-48.png" /> {Math.round(this.state.weather.currently.dewPoint)}&deg;</div>
            <div className="discomfort-text">{this.getDiscomfortLevel(this.state.weather.currently.dewPoint).text}</div>
          </div>

          <div className="currently-data">
            <div><img className="small-icon" src="/image/icons8-partly-cloudy-day-30.png"/> {this.state.weather.currently.summary}</div>
            <div><img className="small-icon" src="/image/icons8-temperature-24.png" /> Temperature: {Math.round(this.state.weather.currently.temperature)}&deg;</div>
            <div><img className="small-icon" src="/image/icons8-humidity-26.png" />  Humidity: {Math.round(this.state.weather.currently.humidity * 100)}%</div>
          </div>
        </div>
      </div>
      : null;

    let dailyData = this.state.weather != null ? this.state.weather.daily.data.map(day =>
      <div className="col-11 col-sm-4 col-md-3 day" key={day.time}>
        <div className={ 'd-flex align-items-center p-3 inner-wrapper ' + this.getDiscomfortLevel(day.dewPoint).dpClass}>
          <div className="day-contents">

            <div className="temperature">
              <div className="date">{this.formatDate(day.time)}</div>
              <img className="dewdrop-icon" src="/image/icons8-water-48.png" /> {Math.round(day.dewPoint)}&deg;
              <div className="discomfort-text">{this.getDiscomfortLevel(day.dewPoint).text}</div>
            </div>

            <div className="summary">
              <div>{day.summary} High: {Math.round(day.temperatureHigh)}&deg;. Humidity: {Math.round(day.humidity * 100)}%.</div>
            </div>
          </div>
        </div>
      </div>
    ) : null;

    return (
      <div className="row justify-content-center justify-content-md-start">
        {currentlyData}
        {dailyData}
      </div>
    );
  }
}

// Find the forecast container and kick off React
const domContainer = document.querySelector('#forecast');
ReactDOM.render(e(DewpointForecast), domContainer);
