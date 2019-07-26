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

    public static function switchUnits() {

      # If a "units" cookie is set, use that to determine which unit to change to
      if (isSet($_COOKIE['units'])) {
        if ($_COOKIE['units'] == 'si') {
          setcookie('units', 'us', time() + 31557600);
        }
        else {
          setcookie('units', 'si', time() + 31557600);
        }
      }

      # If not, switch to Celsius because the lack of a cookie implies Fahrenheit
      else {
          setcookie('units', 'si', time() + 31557600);
      }

      # Redirect back to home page
      header('Location: /');
    }

  }

?>
