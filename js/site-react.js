'use strict';

const e = React.createElement;
const cachedCoords = localStorage.getItem('cachedCoords');

// Create a React component to fetch weather data and display the upcoming dew point forecast
class DewpointForecast extends React.Component {

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

  componentDidMount() {

    // If the user has a latitude and longitude stored in local storage, use that to make the API call,
    // and if not, request their location from their browser
    if (cachedCoords != null) {

      // Hide the "Getting location..." indicator
      $('.getting-location').fadeOut();

      this.getWeather(JSON.parse(cachedCoords));
    }
    else {
      this.getUserLocation();
    }
  }

  getUserLocation() {
    let that = this;

    // Get the user's latitude and longitude
    if ("geolocation" in navigator) {

      console.log("Getting location...");

      navigator.geolocation.getCurrentPosition(

        // If we get permission to the user's location, use it to kick off the API call
        function(userCoords) {
          console.log("Getting weather...");

          // Hide the "Getting location..." indicator
          $('.getting-location').fadeOut();

          // Save these coordinates to the local storage for faster weather retrieval on subsequent visits
          localStorage.setItem('cachedCoords', JSON.stringify(cloneAsObject(userCoords.coords)));

          // Get the weather
          that.getWeather(userCoords.coords);
        },

        // If not, display an error
        function(error) {
          console.log(error);
        },

        // Options
        {
          enableHighAccuracy: true,
          // timeout: 5000,
          maximumAge: 60000
        });
    }
    else {

      // If the user's browser doesn't have a geolocation API at all, display an error
      console.log("Nope");
    }
  }

  resetUserLocation(e) {
    e.preventDefault();

    // Remove the locally-stored coords
    localStorage.removeItem('cachedCoords');

    // Reset the state
    this.setState({
      city: null,
      weather: null
    });

    // Reinitialize the retrieval of the user's location
    this.getUserLocation();
  }

  // Ask the server side to make an API call to Dark Sky to get the weather
  getWeather(coords) {

    let that = this;

    fetch('/get-weather?longitude=' + coords.longitude + '&latitude=' + coords.latitude)
      .then(results => {
        return results.json()
      })
      .then(data => {
        console.log(data);

        // Update the state with the retrieveved weather data
        that.setState({
          weather: data
        });

        // Fade the forecast blocks in
        $('.forecast-holder').fadeIn();
      });

    // Get the city name for the user's location
    this.getCityName(coords);
  }

  // Use the Google Geolocation API to get the name of the city corresponding to the user's latitude and longitude
  getCityName(coords) {
    let
      geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyCBYBfpS2m1cNHWPvPrp0WrUv1dTZiYO24&latlng=' + coords.latitude + ',' + coords.longitude,
      that = this;

    fetch(geocodeUrl)
      .then(results => {
        return results.json()
      })
      .then(data => {

        let
          arr_address_comp = data.results[0].address_components,
          cityName = '';

        arr_address_comp.forEach(function(val) {
          if(val.types[0] === "locality" ){
            cityName = val.long_name;
          }
        });

        // Update the state with the city name
        that.setState({
          city: cityName
        });
      });
  }

  // Return the point on the discomfort scale for the provided dewpoint
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

  render() {

    let dailyData = this.state.weather != null ? this.state.weather.daily.data.map(day =>
      <div className="col-12 col-sm-4 col-md-3 day" key={day.time}>
        <div className={ 'd-flex align-items-center p-3 inner-wrapper ' + this.getDiscomfortLevel(day.dewPoint).dpClass}>
          <div className="day-contents">{Math.round(day.dewPoint)}&deg; - {this.getDiscomfortLevel(day.dewPoint).text}</div>
        </div>
      </div>
    ) : null;

    let currentlyData = this.state.weather != null ?
      <div className="currently-data">
        <div><img className="temp-icon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAMnSURBVGhD1dlJ6E5fHMfxn3koM7EwLoRkLFamlJREFoidpY0pGVLGlRILIVOx4N8/paTYIDIvFFmYFlJIFuZ5fn/i1unb189zn3Pu89znU6/8uve459yee890m2qQBVj4+8/GTT+8wGsM1IFGTAucxc8/LqEVGi7Lkd1EZj0aKoPxAfZGvmA0GiItcRH2JjK30Balz1J4NxDajFJnEN7Ba3zoK8aitDkFr+GeGyhlLzYXXoObswylSic8RtjISh6xt9CgWZrsgG3kGeeY5wRKEY0L3xA27gpOm2PNmY265zxsw2agkkcr8wDtULfMgW2UBsOJ5lglVqAuaYP7sA2aBs2p7PF/eYmeqHnUddrGXIZyAfZcJXaipukBrTNsQ6ajIz4Fx/LQiD8MNctW2EZcgzIV9lwe/6Mm0a+hgcw2YB6U1bDn8viOISg8m2Arf4TWUI7Dns/rEApNZ6h3sRWvRJYnsOfz0ruimXRhWQtb6Wd0h6J/7flq7UEh6YDnsBUeQ5ZJsOerpZ6vN5JnEbwKZyLLYnhlqrUGyXMVtiL9QtlLruyCLRNDczBtKyXLcHgVHUaYk/DKxZiAZNkIrxK7FaodEq9cjO1IltuwFWjgspM8r2uO9RBJ0gdeBXcRRnMsr1wKSfaNvTWHaAQP0x9euRTmIzp/ez/2I4zmR165FDQtis5eeBe3NzIGXrkU1IboHIF3cTvdVjfplUtBbYjOAXgX105JmPHwyqWwD9HZAu/i+goVbnkOhVcuhSTviL4BeheXcciiBZdXJoUkvVZz3eo2hHkGr1ysvkgSb2QXPV69kCXP7mKlbiJZVsGrRHYjyxJ4ZWKEq8/odMMbeBVp33cWFD2GWqZ65arxCl2RNBvgVSbvMRnKUXhlqrEOydMe9+BVKPpiq/3bAdC745XJ4w4K29jWNOQjvIozejnPmWN56RceiUKj2bD9HpJS+M4VHq0MtQ3kNSSGrplk8MuTKXgKr0HV0DfIpOvzPNFSV9ubP+A1rhL6vwehKU7dMwr/Ic/nBJVVVz0CpYsGTr0/WnRdh/a99NyL/tanB03JNRHtgkRpavoF+r3rOcpEAekAAAAASUVORK5CYII=" />  Dewpoint: {Math.round(this.state.weather.currently.dewPoint)}&deg;</div>

        <div><img className="temp-icon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGUSURBVGhD7dlPKwVRGMfxkT/vgIWyUeyEbCysLbHxCki8ARTegSxI1raUl6CUpPAqZMMGJSt/vk9ZnE5PY+YM5zx3Or/61G3uOdPv6XZvc2eKnJyc6BnCHq5x65Fj8t4gTGcMT/j6xSNkrdncQSuuuYHJjEArXGYY5jIDt+QbFj1yzF0je8zFH+QZfuSYuyYP8p9p7SDv2PDIMXfNEdz3J5E8/iAh1pA8eRBHxw5yjhPHLJInZBDZYy55EGsJGWQJU45+JE/IIL788/uXyYM4OnYQ2WMurRikG8fQypaRPbLXRHpwCq1oFXKNZWKYTWgF61hH0ozC/9cXQs4h50qWA2jFQuwjSfpQ5fZoVXIbtRfRIzcKtEJNjCN65qGVaWIO0bMMrUwTclkfPQvQyjQhn3L0TEAr00SSZyZdeIBWKMQ95JxJIo/RtFIhdpEsA3iFVqyOFyT/v74KrVwdKzCRQ2gFq5C9ZiJf0h18Qiur+cAWkn3ByzKNS2jFXReQteYj10zbOMPVD3ktx0w/X8/JaWeK4hty3mYSxgquqwAAAABJRU5ErkJggg==" /> Temperature: {Math.round(this.state.weather.currently.temperature)}&deg;</div>

        <div><img className="temp-icon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAALlSURBVGhD7dlJyE1hHMfxay5EvBKRiEy9kTFDLJQFRUKGZPGmLFAWxggrQxYidoqshGRYGVIkRESIbMjCmIUhCxS+v5unnvf4n3vPuc50c3/1Wbznvec5z3PPc57h3FIjjRQrw3ECO9FOB+o1V/Drj6U6UK95CNeQzTpQr7kP15C1OlDEqGIPsLH8l52tUCM+YrAOGOmDc7iNsTqQZXriJ9y3vQthGQZ93kovPIEr5yQyTSe8hKuAGjUOcXMQrgzZi8wzBh/gGjIKcbMPrhHn0RG5RP1ec8TC8l+to+60GOuwBtMQnEu6YwfWo4MOFCldoS7zDe7bdp5jPgoffcP3EGyAT91wEwqds7AqH6TGzEIhMxlWpcNo1s8lg7Ade6CJri/8+CNQVJpjMs9T+JW4CT8X4P8/ilwe/LfwK6GG+fFXulHNQ6X0wAoch7riCzzGRWjYHo3YmY4zuIxTGA8/h2FVNsxnaL9ipTN24wusc32XoMk5scyBdSHfK2jobUbYRmsonsE6P8wPrEIiaYs7sC70HRtQbQkyBO9hlRHFNiQSVeQ1/MJ1FyahWrog7p0I0vxkLZdqygC4B/8rJsCPljDay1zDG3yCHuBbCFasFhqUdI1Y6YblGFH+q3UmQgtFPzMQvGNp2ILI0c7ObYq0QNSdqJS50EMZvGgaVK9I0YhzF/7JUxEWNVpdyP982gaiavrDP0nzS6X3Vvvhfz4LMxEpR6ETjqHasPoOwQulrQWJph+sC6VNg1BiWYRHsC6UNs1f2ma3R83R8+K6Xt5uoAk15QCsQvOiyTf2nZkCLRWsAvOkNzmxchpWQXnTXqYNIkXPhvYZVkFFELb/+Suawa0CikJ7pkjpDauAopiNSFEfjLI9zYu1Sg+N9vNWIXnTwx4relFXxOF3NWLnEKzC8nIVNb3t1zB8BFahWbsO/TL2T1kC/6e1LGnvrkVjor+7jMQCrMzAMuiFh15PNdJII/9nSqXf1/bBDOtlYbMAAAAASUVORK5CYII="/> {this.state.weather.currently.summary}</div>
      </div>
      : null;

    return (
      <div className="row">
        <div className="col-xs-12 col-md-6">

          <div className="currently">
            <div>Currently in...</div>
            <div className="city-name">{this.state.city}</div>
            <a className="update-location" href="#" onClick={this.resetUserLocation}>Update Location</a>

            {currentlyData}
          </div>
        </div>

        {dailyData}
      </div>
    );
  }
}

const domContainer = document.querySelector('#forecast');
ReactDOM.render(e(DewpointForecast), domContainer);

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

