'use strict';

const e = React.createElement;

// Create a React component to fetch weather data and display the upcoming dew point forecast
class DewpointForecast extends React.Component {

  constructor(props) {
    super(props);

    // Set the empty default state
    this.state = {
      city: null,
      weather: null
    };
  }

  componentDidMount() {
    let that = this;

    // TODO: If the user has a cookie with their latitude and longitude, use that to make the API call,
    // and if not, request their location from their browser
    if (false) {
    }
    else {

      // Get the user's latitude and longitude
      if ("geolocation" in navigator) {

        navigator.geolocation.getCurrentPosition(

          // If we get permission to the user's location, use it to kick off the API call
          function(userCoords) {
            console.log(userCoords);

            // Fetch the weather data
            fetch('/get-weather?longitude=' + userCoords.coords.longitude + '&latitude=' + userCoords.coords.latitude)
              .then(results => {
                return results.json()
              })
              .then(data => {
                console.log(data);

                // Update the state with the retrieveved weather data
                that.setState({
                  weather: data
                });
              });

            // Get the city name for the user's location
            that.getCityName(userCoords);
          },

          // If not, display an error
          function(error) {
            console.log(error);
          }
        );
      }
      else {

        // If the user's browser doesn't have a geolocation API at all, display an error
        console.log("Nope");
      }
    }
  }

  getCityName(userCoords) {
    let
      geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + userCoords.coords.latitude + ',' + userCoords.coords.longitude,
      that = this;

    fetch(geocodeUrl)
      .then(results => {
        return results.json()
      })
      .then(data => {
        console.log(data);

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

    let levelText = '';

    if (dewpoint < 50) {
      levelText = 'Pleasant';
    }
    else if (dewpoint >= 50 && dewpoint <= 55.99) {
      levelText = 'Comfortable';
    }
    else if (dewpoint >= 56 && dewpoint <= 60.99) {
      levelText = 'Noticible';
    }
    else if (dewpoint >= 61 && dewpoint <= 65.99) {
      levelText = 'Sticky';
    }
    else if (dewpoint >= 66 && dewpoint <= 70.99) {
      levelText = 'Uncomfortable';
    }
    else if (dewpoint >= 71 && dewpoint <= 75.99) {
      levelText = 'Harsh';
    }
    else if (dewpoint > 75) {
      levelText = 'Severe Discomfort';
    }

    return levelText;
  }

  render() {
    console.log(this.state.weather);

    let dailyData = this.state.weather != null ? this.state.weather.daily.data.map(day =>
      <div className="day" key={day.time}>{day.dewPoint} - {this.getDiscomfortLevel(day.dewPoint)}</div>
    ) : null;

    console.log("daily data", dailyData);

    return (
      <div>
        <h2>{this.state.city}</h2>
        <div className="daily-data">{dailyData}</div>
      </div>
    );
  }
}

const domContainer = document.querySelector('#forecast');
ReactDOM.render(e(DewpointForecast), domContainer);
