<?php

  class homeController extends applicationController {

    public static function index() {

      # Initialize and inflate the template
      $tpl = parent::tpl()->loadTemplate('index');

      print $tpl->render(array(
        'assetPaths' => parent::getAssetPaths(),
        'oppositeUnits' => ((isSet($_COOKIE['units']) && $_COOKIE['units'] == 'si') ? 'Fahrenheit' : 'Celsius')
      ));
    }

  }

?>
