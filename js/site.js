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
        $locateMe = $('#locate-me'),
        $changeUnits = $('#switch-units'),
        $gettingWeather = $('#getting-weather');

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

    // What to do when the user clicks "Use my location" in the site header
    $locateMe.click(function(e) {
      e.preventDefault();

      // Send GA get location event
      ga('send', 'event', 'geolocation', 'click');

      // Clear and re-query the browser location
      that.resetUserLocation();
    });

    // What to do when the user clicks the "change units" link in the header
    $changeUnits.click(function(e) {
      e.preventDefault();

      let parsedCoords = JSON.parse(localStorage.getItem('cachedCoords')),
          $oppositeUnitsWording = $('#opposite-units');

      // Send GA change units event
      ga('send', 'event', 'switch-units', 'click');

      // If a "units" cookie is set, use that to determine which unit to change to
      if (Cookies.get('units') !== undefined) {
        Cookies.set('units', Cookies.get('units') == 'us' ? 'si' : 'us', { expires: 365 });
      }

      // If not, switch to Celsius because the lack of a cookie implies Fahrenheit
      else {
        Cookies.set('units', 'si', { expires: 365 });
      }

      // Update the "change units" link wording
      $oppositeUnitsWording.text(Cookies.get('units') == 'us' ? 'Celsius' : 'Fahrenheit');

      $gettingWeather.addClass('showing');

      // Re-query the Dark Sky API with an (implicit) change in temperature units and update the state object
      fetch('/get-weather?longitude=' + parsedCoords.longitude + '&latitude=' + parsedCoords.latitude)
        .then(results => {
          return results.json();
        })
        .then(data => {

          $gettingWeather.removeClass('showing');

          // Update the state with the retrieveved weather data
          that.setState({
            weather: data
          });
        });
      });
  }

  /* Use geolocation to find the user's latitude and longitude */
  getUserLocation() {
    let that = this,
        $gettingLocation = $('#getting-location'),
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

          // Send success GA event
          ga('send', 'event', 'geolocation', 'get', 'success');
        },

        // If not, display a 'geolocation failed' message
        function(error) {
          $gettingLocation.removeClass('showing');
          $userDeniedGeolocation.addClass('showing');

          // Send error GA event
          ga('send', 'event', 'geolocation', 'get', 'failed');
        },

        // Options
        {
          timeout: 10000
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
        $locationSearch = $('#location-search'),
        $gettingLocation = $('#getting-location'),
        $forecastHolder = $('#forecast-blocks'),
        $dewPointIn = $('#dew-point-in');

    if (e) {
      e.preventDefault();
    }

    // Fade out the city name
    $dewPointIn.removeClass('showing');

    // Clear location bar 
    $locationSearch.val('');

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
        $gettingWeather = $('#getting-weather'),
        $forecastHolder = $('#forecast-blocks'),
        $locationSearch = $('#location-search'),
        $userDeniedGeolocation = $('.denied-geolocation'),
        parsedCoords = JSON.parse(localStorage.getItem('cachedCoords')),
        cityName = '';

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

            // Get the city name for the user's location if one isn't cached in cachedCoords
            if (parsedCoords && (parsedCoords['placeName'] !== undefined) && ($locationSearch.val() == '')) {
              cityName = parsedCoords['placeName'];

              // Update the state with the retrieveved weather data and the city name
              that.setState({
                weather: data,
                city: cityName
              });

              // Send GA get weather event
              ga('send', 'event', 'weather', 'get', cityName);
            }
            else {
              that.getCityName(coords);

              // Update the state with the retrieveved weather data
              that.setState({
                weather: data
              });
            }
          }).fadeIn();
      });
  }

  /* Use the Google Geolocation API to get the name of the city corresponding to the user's latitude and longitude */
  getCityName(coords) {
    let
      that = this,
      geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?key=' + googleMapsApiKey + '&latlng=' + coords.latitude + ',' + coords.longitude,
      $locationSearch = $('#location-search');

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
          }).join(', ');

          that.setState({
            city: sanitizedAddress
          });

          // Send GA get weather event
          ga('send', 'event', 'weather', 'get', sanitizedAddress);
      });
  }

  /* Return the point on the discomfort scale for the provided dewpoint */
  getDiscomfortLevel(dewpoint) {

    let
      levelText = '',
      dpClass = '',
      levelIsFound = false,
      thisLevel = null,
      scale = [
        {'f': 50, 'c': 10, 'text': 'Pleasant', 'class': 'dp-level-1' },
        {'f': 55, 'c': 12.8, 'text': 'Comfortable', 'class': 'dp-level-1' },
        {'f': 60, 'c': 15.6, 'text': 'Noticible', 'class': 'dp-level-2' },
        {'f': 65, 'c': 18.3, 'text': 'Sticky', 'class': 'dp-level-3' },
        {'f': 70, 'c': 21.1, 'text': 'Uncomfortable', 'class': 'dp-level-4' },
        {'f': 75, 'c': 23.9, 'text': 'Oppressive', 'class': 'dp-level-5' },
        {'f': 100, 'c': 37.8, 'text': 'Severe Discomfort', 'class': 'dp-level-6' },
      ];

    scale.forEach(function (value, i) {
      if (!levelIsFound) {
        if ((Cookies.get('units') != null && Cookies.get('units') == 'si' && dewpoint < value['c'])
           || (((Cookies.get('units') != null && Cookies.get('units') == 'us') || Cookies.get('units') == null) && dewpoint < value['f'])) {
          levelIsFound = true
          thisLevel = value;
        }
      }
    });

    return { text: thisLevel['text'], dpClass: thisLevel['class'] };
  }

  /* Initialize the location search bar */
  initLookup() {
    let
      that = this,
      input = $('#location-search').get(0),
      $forecastHolder = $('#forecast-blocks'),
      autocomplete = new google.maps.places.Autocomplete(input, { fields: ['place_id', 'name', 'types'] }),
      geocoder = new google.maps.Geocoder;

    autocomplete.addListener('place_changed', function() {
      var place = autocomplete.getPlace();

      if (place.place_id) {

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

          localStorage.setItem('cachedCoords', JSON.stringify({
            latitude: results[0].geometry.location.lat(),
            longitude: results[0].geometry.location.lng(),
            placeName: place.name
          }));
        });
      }
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
    if (providedDate.format('M/j') == tomorrow.format('M/j')) {
      outputtedFormat = 'Tomorrow';
    }
    else {
      outputtedFormat = providedDate.format('l, F jS');
    }

    return outputtedFormat;
  }

  /* Return a number (usually the dew point value)  with either one decimal place or zero depending on the user's selected units */
  getValueByUnits(value) {
    return value.toFixed(Cookies.get('units') == 'si' ? '1' : '0');
  }

  render() {

    let currentlyData = this.state.weather != null ?
      <div className="col-11 col-md-12 currently day">
        <div className="row today">
          <div className={'p-3 inner-wrapper col-12 col-md-6 ' + this.getDiscomfortLevel(this.state.weather.currently.dewPoint).dpClass}>

            <div className="currently-data">
              <p className="heading">Right Now</p>

              <div>
                <div className="weather-icon"><img className="small-icon" src="/image/sun-cloud.svg"/></div>
                <div className="weather-desc">{this.state.weather.currently.summary}</div>
              </div>

              <div>
                <div className="weather-icon"><img className="small-icon" src="/image/thermometer.svg" /></div>
                <div className="weather-desc">Temperature: {Math.round(this.state.weather.currently.temperature)}&deg;</div>
              </div>

              <div>
                <div className="weather-icon"><img className="small-icon" src="/image/humidity.svg" /></div>
                <div className="weather-desc">Humidity: {Math.round(this.state.weather.currently.humidity * 100)}%</div>
              </div>

              <div className="dewpoint">
                <div><img className="dewdrop-icon" src="/image/drop-silhouette.svg" /> {this.getValueByUnits(this.state.weather.currently.dewPoint)}&deg;</div>
                <div className="discomfort-text">{this.getDiscomfortLevel(this.state.weather.currently.dewPoint).text}</div>
              </div>
            </div>
          </div>

          <div className={'p-3 inner-wrapper col-12 col-md-6 ' + this.getDiscomfortLevel(this.state.weather.daily.data[0].dewPoint).dpClass}>
            <p className="heading">Today's forecast</p>

            <div>
              <div className="weather-icon"><img className="small-icon" src="/image/sun-cloud.svg"/></div>
              <div className="weather-desc">{this.state.weather.daily.data[0].summary}</div>
            </div>

            <div>
              <div className="weather-icon"><img className="small-icon" src="/image/thermometer.svg" /></div>
              <div className="weather-desc">Temperature: {Math.round(this.state.weather.daily.data[0].temperatureHigh)}&deg;</div>
            </div>

            <div>
              <div className="weather-icon"><img className="small-icon" src="/image/humidity.svg" /></div>
              <div className="weather-desc">Humidity: {Math.round(this.state.weather.daily.data[0].humidity * 100)}%</div>
            </div>

            <div className="dewpoint">
              <div><img className="dewdrop-icon" src="/image/drop-silhouette.svg" /> {this.getValueByUnits(this.state.weather.daily.data[0].dewPoint)}&deg;</div>
              <div className="discomfort-text">{this.getDiscomfortLevel(this.state.weather.daily.data[0].dewPoint).text}</div>
            </div>
          </div>
        </div>
      </div>
      : null;

    let dailyData = this.state.weather != null ? this.state.weather.daily.data.slice(1).map(day =>
      <div className="col-11 col-sm-4 col-md-3 day" key={day.time}>
        <div className={ 'd-flex align-items-center p-3 inner-wrapper ' + this.getDiscomfortLevel(day.dewPoint).dpClass}>
          <div className="day-contents">

            <div className="temperature">
              <div className="date">{this.formatDate(day.time)}</div>
              <img className="dewdrop-icon" src="/image/drop-silhouette.svg" /> {this.getValueByUnits(day.dewPoint)}&deg;
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
      <div>
        <div className="row">
          <div className="col-12">
            <h5 className="city-name">{this.state.city}</h5>
          </div>
        </div>

        <div className="row justify-content-center justify-content-md-start" id="forecast-blocks">
          {currentlyData}
          {dailyData}
        </div>

        <div className="row denied-geolocation text-center">
          <div className="col-12">
            <h3>Geolocation failed</h3>
            <p>But that's alright! You can use the site without geolocation by entering a location above.</p>
          </div>
        </div>
      </div>
    );
  }
}

// Find the forecast container and kick off React
$(document).ready(function() {
  const domContainer = document.querySelector('#forecast');
  ReactDOM.render(e(DewpointForecast), domContainer);
});
