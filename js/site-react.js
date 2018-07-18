'use strict';

const e = React.createElement;

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
    console.log("DID MOUNT!");

    let that = this;

    // Get the user's latitude and longitude
    if ("geolocation" in navigator) {

      navigator.geolocation.getCurrentPosition(

        // If we get permission to the user's location, use it to kick off the API call
        function(userCoords) {
          console.log(userCoords);

          fetch('/get-weather?longitude=' + userCoords.coords.longitude + '&latitude=' + userCoords.coords.latitude)
            .then(results => {
              return results.json()
            })
            .then(data => {
              console.log(data);

              // Update the state with the retrieveved weather data
              that.setState({
                city: 'Philly!',
                weather: data
              });
            })
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

  // Return the point on the discomfort scale for the provided dewpoint
  getDiscomfortLevel(dewpoint) {
    return "Yes";
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
