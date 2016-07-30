var util = require('util')
var request = require('request')
var striptags = require('striptags')

var googleMapsAPIEndpoint = 'https://maps.googleapis.com/maps/api/distancematrix/json'
var uberAPIEndpoint = 'https://api.uber.com/v1/estimates/time'

var latLongToString = function (obj) {
  return obj.latitude + ',' + obj.longitude
}

var printnl = function (text) {
  return util.format('%s<br>', text)
}

var prepareMessage = function (obj) {
  var html
  var text

  html = printnl('Hey')

  if (obj.late) {
    html += printnl('You are already late! Book uberGO <strong><i>now</i></strong> to reach <strong>%s</strong> as early as possible!')

    if (obj.uberDuration) {
      html += printnl('Your uberGO will be there in <strong>%s</strong> if you book it now!')
      text = util.format(html, obj.matrix.destination_address, obj.uberDuration)
    } else {
      text = util.format(html, obj.matrix.destination_address)
    }
  } else {
    html += printnl('Book your uberGO <strong><i>now</i></strong> to reach <strong>%s</strong> by <strong>%s</strong>!')

    if (obj.uberDuration) {
      html += printnl('Your uberGO will be there in <strong>%s</strong> if you book it now!')
      text = util.format(html, obj.matrix.destination_address, obj.whenToReachText, obj.uberDuration)
    } else {
      text = util.format(html, obj.matrix.destination_address, obj.whenToReachText)
    }
  }

  html += printnl('Regards,')
  html += 'Everyone @ Uber Remind Me'

  text = striptags(text.replace(/<br\s*[\/]?>/gi, '\n'))

  return {
    text: text,
    html: html
  }
}

module.exports.formatTime = function (obj) {
  return obj.format('hh:mm a')
}

module.exports.travelMatrix = function (source, destination, callback) {
  var params = {
    key: process.env.GOOGLE_MAPS_API_KEY,
    units: 'metric',
    origins: latLongToString(source),
    destinations: latLongToString(destination)
  }

  request({ url: googleMapsAPIEndpoint, qs: params }, function (err, response, body) {
    if (err) {
      console.error(err)
    } else {
      var t = JSON.parse(body)
      if (t.status === 'OK' && t.rows[0].elements[0].status === 'OK') {
        var r = {
          source_address: t.origin_addresses[0] || params.origins,
          destination_address: t.destination_addresses[0] || params.destinations,
          duration: t.rows[0].elements[0].duration.value
        }
        callback(r)
      }
    }
  })
}

module.exports.uberGODuration = function (source, callback) {
  var params = {
    server_token: process.env.UBER_API_TOKEN,
    start_latitude: source.latitude,
    start_longitude: source.longitude
  }

  request({url: uberAPIEndpoint, qs: params}, function (err, response, body) {
    if (err) {
      console.error(err)
    } else {
      var t = JSON.parse(body)
      var time = null

      for (time of t.times) {
        if (time.display_name === 'uberGO') {
          time = time.estimate
          break
        }
      }

      callback(time)
    }
  })
}

module.exports.sendEmail = function (postmark, obj, callback) {
  var m = prepareMessage(obj)

  postmark.sendEmail({
    'From': 'uber-remind-me@harshjv.github.io',
    'To': obj.to,
    'Subject': 'Reminder to book uberGO!',
    'TextBody': m.text,
    'HtmlBody': m.html
  }, function (error, success) {
    if (error) {
      console.error('Unable to send via postmark: ' + error.message)
    } else {
      console.info('Sent to postmark for delivery')
    }

    obj = null

    callback(error)
  })
}
