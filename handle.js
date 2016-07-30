var moment = require('moment')
var Agenda = require('agenda')
var Postmark = require('postmark')

var helper = require('./helper')

var postmark = new Postmark.Client(process.env.POSTMARK_API_KEY)
var agenda = new Agenda({db: {address: process.env.MONGODB_URI}})

agenda.define('send reminder', { priority: 'high', concurrency: 10 }, function (job, done) {
  var obj = job.attrs.data
  think(obj, done)
})

var scheduleReminder = function (futureTime, obj) {
  obj.emitter.emit('schedule', {
    email: obj.to,
    time: helper.formatTime(moment(futureTime))
  })

  agenda.schedule(futureTime, 'send reminder', obj)
}

var think = function (obj, callback) {
  console.log('***** Thinking *****')
  if (obj.thinkBefore.diff(moment()) > 5000) {
    scheduleReminder(obj.thinkBefore.toDate(), obj)
    callback()
  } else {
    helper.uberGODuration(obj.sourceObj, function (uberGOTime) {
      console.log('***** uberGO API *****')
      console.log(uberGOTime)
      console.log('*****')

      obj.emitter.emit('uberAPI', {
        email: obj.to
      })

      obj.uberDuration = uberGOTime

      if (obj.leaveBefore.subtract(uberGOTime, 'seconds').diff(moment()) > 0) {
        obj.late = false
      } else {
        obj.late = true
      }

      console.log('***** Send Email *****')

      helper.sendEmail(postmark, obj, callback)
    })
  }
}

module.exports = function (emitter, source, destination, email, reachBy) {
  source = source.split(',')
  destination = destination.split(',')

  var sourceObj = {
    latitude: source[0].trim(),
    longitude: source[1].trim()
  }

  var destinationObj = {
    latitude: destination[0].trim(),
    longitude: destination[1].trim()
  }

  helper.travelMatrix(sourceObj, destinationObj, function (matrix) {
    emitter.emit('googleMapsAPI', {
      email: email
    })

    console.log('***** GoogleMapsAPI *****')
    console.log(email)
    console.log(matrix)
    console.log('*****')

    var maxUberDuration = 20 * 60
    var deviation = 60 * 60
    var maxTravelDuration = matrix.duration + deviation + maxUberDuration

    var obj = {
      leaveBefore: moment(reachBy, 'h:m a').subtract(matrix.duration + deviation, 'seconds'),
      thinkBefore: moment(reachBy, 'h:m a').subtract(maxTravelDuration, 'seconds'),
      sourceObj: sourceObj,
      matrix: matrix,
      to: email,
      whenToReachText: helper.formatTime(moment(reachBy, 'h:m a')),
      uberDuration: null,
      emitter: emitter
    }

    think(obj, function () {})
  })
}
