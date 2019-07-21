<?php

  class applicationController {

    # Provide a Mustache template object that descendant classes can access
    protected static function tpl() {

      Mustache_Autoloader::register();

      $mustache = new Mustache_Engine(array(
        'loader' => new Mustache_Loader_FilesystemLoader(dirname(__FILE__) . '/../tpl'),
        'partials_loader' => new Mustache_Loader_FilesystemLoader(dirname(__FILE__) . '/../tpl/partials')
      ));

      return $mustache;
    }

  # Return an object with css and js file hashes for cache-busting purposes
  protected static function getAssetPaths() {
    $manifestFile = 'assets/rev-manifest.json';
    $manifest = file_exists($manifestFile) == true ? json_decode(file_get_contents($manifestFile), true) : [];

    # Mustache can't handle keys with dots, so sanitize them out
    foreach ($manifest as $key => $value) {
      if (strpos($key, '.') !== false)  {
        $dotlessKey = str_replace('.', '', $key);
        $manifest[$dotlessKey] = $value;
        unset($manifest[$key]);
      }
    }

    return $manifest;
  }
}

?>
