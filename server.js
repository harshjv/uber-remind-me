var events = require('events')
var path = require('path')
var express = require('express')
var bodyParser = require('body-parser')

var handle = require('./handle')

var emitter = new events.EventEmitter()
var app = express()

var logs = {}
var googleMapsAPICount = 0
var uberAPICount = 0
var scheduleCount = 0

emitter.on('googleMapsAPI', function (data) {
  if (logs[data.email] === undefined) {
    logs[data.email] = {
      googleMapsAPICount: 1
    }
  } else {
    logs[data.email].googleMapsAPICount++
  }

  googleMapsAPICount++

  console.log('GoogleMapsAPI')
})

emitter.on('uberAPI', function (data) {
  if (logs[data.email].uberAPICount === undefined) {
    logs[data.email].uberAPICount = 1
  } else {
    logs[data.email].uberAPICount++
  }

  uberAPICount++

  console.log('UberAPI')
})

emitter.on('schedule', function (data) {
  if (logs[data.email].scheduleCount === undefined) {
    logs[data.email].scheduleCount = 1
  } else {
    logs[data.email].scheduleCount++
  }

  logs[data.email].scheduledOn = data.time

  scheduleCount++

  console.log('Schedule')
})

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.render('index')
})

app.get('/logs', function (req, res) {
  console.log(logs)
  res.render('logs', {
    logs: logs,
    logLength: Object.keys(logs).length,
    googleMapsAPICount: googleMapsAPICount,
    uberAPICount: uberAPICount,
    scheduleCount: scheduleCount
  })
})

app.post('/remind', function (req, res) {
  if (req.body.source === null ||
      req.body.destination === null ||
      req.body.email === null ||
      req.body.time === null) {
    res.render('error')
  } else {
    handle(emitter, req.body.source, req.body.destination, req.body.email, req.body.time)
    res.render('success', {
      email: req.body.email
    })
  }
})

app.use(express.static('public'))

app.listen(process.env.PORT || 7070, function () {
  console.log('Listening...')
})
