<?php

  # Get Composer-installed libraries
  require 'vendor/autoload.php';

  # Include controller(s)
  require_once('controllers/applicationController.php');
  require_once('controllers/homeController.php');
  require_once('controllers/weatherController.php');

  # Use AltoRouter to map routes
  $router = new AltoRouter();

  # Home page
  $router->map('GET', '/', 'homeController#index');

  # Switch units between Farenheit and Celcius
  $router->map('GET', '/switch-units', 'homeController#switchUnits');

  # Endpoint to make the server-side Dark Sky API call
  $router->map('GET', '/get-weather', 'weatherController#getWeather');

  # Figure out if the route is matched, and if it is, call its controller action
  $match = $router->match();

  if ($match === false) {
    header("HTTP/1.0 404 Not Found");
    print "Not found.";
  }
  else {
    list( $controller, $action ) = explode( '#', $match['target'] );

    if ( is_callable(array($controller, $action)) ) {
        call_user_func_array(array($controller, $action), array($match['params']));
    }
    else {
      header("HTTP/1.0 500 Internal Server Error");
    }
  }
?>
