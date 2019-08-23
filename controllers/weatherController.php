<?php

  class weatherController extends applicationController {

    public static function getWeather() {

      $params = $_GET;

      # Construct API URL
      $apiKey = $_SERVER['darkSkyApiKey'];
      $apiUrl = 'https://api.darksky.net/forecast/';
      $apiQueryArgs = array(
        'units=' . (isSet($_COOKIE['units']) ? $_COOKIE['units'] : 'us'),
        'exclude=hourly,minutely,alerts,flags',
      );

      $fullApiUrl = $apiUrl . $apiKey . '/' . $params['latitude'] . ',' . $params['longitude'] . '?' . implode($apiQueryArgs, '&');

      # Fetch the API using a compression stream wrapper, as suggested by the Dark Sky API when requesting extended hourly details
      print file_get_contents("compress.zlib://" . $fullApiUrl, false, stream_context_create(array('http'=>array('header'=>"Accept-Encoding: gzip\r\n"))));
    }

  }

?>
