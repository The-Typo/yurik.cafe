'use strict';

var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');

hexo.on('generateBefore', function () {
  var themeName = hexo.config.theme || hexo.theme_dir.split(path.sep).pop();
  var userConfigPath = path.join(hexo.base_dir, '_config.' + themeName + '.yml');
  var themeConfigPath = path.join(hexo.theme_dir, '_config.yml');

  var userConfig = {};
  var themeConfig = {};

  try {
    themeConfig = yaml.load(fs.readFileSync(themeConfigPath, 'utf8')) || {};
  } catch (e) {}

  try {
    userConfig = yaml.load(fs.readFileSync(userConfigPath, 'utf8')) || {};
  } catch (e) {}

  function mergeWithPriority(user, theme) {
    var result = {};
    var key;

    // start with all theme keys as fallback
    for (key in theme) {
      if (theme.hasOwnProperty(key)) {
        result[key] = theme[key];
      }
    }

    // user keys win: for plain objects, shallow-merge; otherwise replace
    for (key in user) {
      if (!user.hasOwnProperty(key)) continue;
      var userVal = user[key];
      var themeVal = theme[key];

      if (userVal === null || typeof userVal === 'string' || typeof userVal === 'boolean' || typeof userVal === 'number' || Array.isArray(userVal)) {
        result[key] = userVal;
      } else if (typeof userVal === 'object' && typeof themeVal === 'object' && !Array.isArray(themeVal)) {
        // both are plain objects: merge, user keys win
        result[key] = {};
        var k;
        for (k in themeVal) {
          if (themeVal.hasOwnProperty(k)) result[key][k] = themeVal[k];
        }
        for (k in userVal) {
          if (userVal.hasOwnProperty(k)) result[key][k] = userVal[k];
        }
      } else {
        // user has an object, theme has something else → user wins
        result[key] = userVal;
      }
    }

    return result;
  }

  var merged = mergeWithPriority(userConfig, themeConfig);
  hexo.theme.config = merged;
  hexo.config.theme_config = merged;
});
