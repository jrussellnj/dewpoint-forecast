<?php

  class weatherController extends applicationController {

    public static function getWeather() {

      $params = $_GET;

      # Construct API URL
      $apiKey = $_SERVER['darkSkyApiKey'];
      $apiUrl = 'https://api.darksky.net/forecast/';
      $apiExcludes = 'minutely,alerts,flags';
      $apiExtend = 'hourly';
      $fullApiUrl = $apiUrl . $apiKey . '/' . $params['latitude'] . ',' . $params['longitude'] . '?exclude=' . $apiExcludes . '&extend=' . $apiExtend;

      # Fetch the API using a compression stream wrapper, as suggested by the Dark Sky API when requesting extended hourly details
      print file_get_contents("compress.zlib://" . $fullApiUrl, false, stream_context_create(array('http'=>array('header'=>"Accept-Encoding: gzip\r\n"))));
    }

  }

?>
