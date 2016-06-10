var request = require('request');
var util = require('util');

var EventEmitter = require('events');

var SteamTrades = module.exports = function (options) {
  EventEmitter.call(this);

  this.access_token = options.access_token;
}

SteamTrades.prototype._call = function (options, callback) {
  options.method = options.method || 'get';

  return request[options.method]({
    uri: 'https://steamtrad.es/api/v1' + options.uri + '/',
    json: true,
    headers: {
      'User-Agent': 'node-steamtrades',
      'Authorization': 'Token ' + this.access_token
    },
    qs: options.params,
    forever: true
  }, function (err, response, body) {
    // error making request (no connection, etc.)
    if (err) {
      callback(err);
      return;
    }

    if (response.statusCode >= 300) {
      var err = new Error(body ? (body.details || body.detail) : response.statusCode);
      err.code = response.statusCode;

      switch (response.statusCode) {
        case 400: err.message = 'Bad request'; break;
        case 403: err.message = 'Access denied'; break;
        case 404: err.message = 'Some of the selected items are missing'; err.items = body.missing_items; break;
        case 423: err.message = 'Some of the selected items are missing'; err.items = body.locked_items; break;

      }
      
      // api error :(
      return callback(err);
    }

    // success :)
    callback(null, body);
  });
}

SteamTrades.prototype.getGames = function (callback) {
  return this._call({
    uri: '/game'
  }, callback);
}

SteamTrades.prototype.getGame = function (id, callback) {
  return this._call({
    uri: '/game/' + id
  }, callback);
}

SteamTrades.prototype.getUser = function (steam_id, force_refresh, callback) {
  if (typeof force_refresh == 'function')
    callback = force_refresh;

  return this._call({
    uri: '/user/info_by_steam_id',
    params: {
      steam_id: steam_id,
      force_refresh: typeof force_refresh !== 'function' ? !!force_refresh : false
    }
  }, callback);
}

SteamTrades.prototype.getItems = function (callback) {
  return this._call({
    uri: '/item/mine'
  });
}

SteamTrades.prototype.scanInventory = function (trade_url, context_id, force_refresh, callback) {
  if (typeof force_refresh == 'function')
    callback = force_refresh;

  return this._call({
    method: 'post',
    uri: '/item/scan_user_inventory',
    params: {
      trade_url: trade_url,
      context_id: context_id,
      force_refresh: typeof force_refresh !== 'function' ? !!force_refresh : false
    }
  }, callback);
}

SteamTrades.prototype.getInventory = function (trade_url, context_id, callback) {
  return this._call({
    uri: '/item/user_inventory',
    params: {
      trade_url: trade_url,
      context_id: context_id
    }
  }, callback);
}

SteamTrades.prototype.getTrade = function (id, callback) {
  return this._call({
    uri: '/trade/' + id
  }, callback);
}

SteamTrades.prototype.requestItems = function (trade_url, items, message, callback) {
  if (typeof message == 'function')
    callback = message;

  return this._call({
    method: 'post',
    uri: '/trade/request_items',
    params: {
      trade_url: trade_url,
      items: items.join(','),
      message: typeof message !== 'function' ? message : null,
      omit_vtt_url: !!message
    }
  }, callback);
}

SteamTrades.prototype.sendItems = function (trade_url, items, message, callback) {
  if (typeof message == 'function')
    callback = message;

  return this._call({
    method: 'post',
    uri: '/trade/send_items',
    params: {
      trade_url: trade_url,
      items: items.join(','),
      message: typeof message !== 'function' ? message : null,
      omit_vtt_url: !!message
    }
  }, callback);
}
