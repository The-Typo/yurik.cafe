'use strict';

var fs = require('fs');
var path = require('path');

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

hexo.extend.tag.register('timeline', function () {
  var filePath = path.join(hexo.base_dir, 'source/_data/timeline.json');
  var timelineData = [];

  try {
    var raw = fs.readFileSync(filePath, 'utf8');
    timelineData = JSON.parse(raw);
  } catch (e) {
    return '';
  }

  if (!Array.isArray(timelineData) || !timelineData.length) return '';

  timelineData = timelineData.slice().sort(function (a, b) {
    return b.year - a.year;
  });

  var html = '<section class="section" style="padding-bottom:0;padding-top:0">';
  html += '<ul class="timeline">';

  timelineData.forEach(function (item) {
    html += '<li class="timeline__item">';
    html += '<div class="timeline__year">' + escapeHTML(String(item.year)) + '</div>';
    html += '<div class="timeline__title">' + escapeHTML(String(item.title)) + '</div>';
    html += '<div class="timeline__desc">' + escapeHTML(String(item.description)) + '</div>';
    html += '</li>';
  });

  html += '</ul>';
  html += '</section>';

  return html;
}, { ends: false });
