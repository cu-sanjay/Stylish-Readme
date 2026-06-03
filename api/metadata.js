'use strict';

const metadata = require('../lib/metadata');

module.exports = async (req, res) => {
  try {
    const themesArray = Object.entries(metadata.THEMES).map(([id, t]) => ({ id, ...t }));
    const timezonesArray = Object.entries(metadata.TIMEZONES).map(([id, label]) => ({ id, label }));
    const countriesArray = Object.entries(metadata.COUNTRIES).map(([code, name]) => ({ code, name }));
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600');
    
    res.status(200).json({
      THEMES: themesArray,
      TIMEZONES: timezonesArray,
      COUNTRIES: countriesArray,
      SKILLS: metadata.SKILLS,
      CODING_PLATFORMS: metadata.CODING_PLATFORMS,
      MUSIC_PLATFORMS: metadata.MUSIC_PLATFORMS,
      WIDGETS: metadata.WIDGETS,
      SONGS: metadata.SONGS,
      QUOTES: metadata.QUOTES,
      PRESETS: metadata.PRESETS,
      WIDGET_PARAMS: metadata.WIDGET_PARAMS
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
