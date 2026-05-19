'use strict';

var fs = require('fs');
var path = require('path');

var cache = {};

function loadLang(themeDir, lang) {
  if (cache[lang]) return cache[lang];

  var filePath = path.join(themeDir, 'languages', lang + '.json');
  try {
    var data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    cache[lang] = data;
    return data;
  } catch (e) {
    return null;
  }
}

hexo.extend.helper.register('__', function (key) {
  var lang = hexo.config.language || 'zh-CN';

  var data = loadLang(hexo.theme_dir, lang)
    || loadLang(hexo.theme_dir, lang.slice(0, 2))
    || loadLang(hexo.theme_dir, 'zh-CN')
    || loadLang(hexo.theme_dir, 'en');

  if (!data) return key;

  var keys = key.split('.');
  var val = data;
  for (var i = 0; i < keys.length; i++) {
    if (val == null) return key;
    val = val[keys[i]];
  }

  if (val != null && typeof val === 'string') return val;

  return key;
});
