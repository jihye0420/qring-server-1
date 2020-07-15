var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.io = require('socket.io')();

app.io.on('connection', (socket) => {
  console.log("connection ok")
  //setTimeout(sendHeartbeat, 9000);
  sendHeartbeat;

  socket.on('joinRoom', (meetingId) => {

    console.log("joinRoom ok")
    socket.join(meetingId, () => {
      console.log(meetingId);
      app.io.to(meetingId).emit('joinRoom', meetingId);
    });
  });

  socket.on('leaveRoom', (meetingId) => {
    console.log("leaveRoom ok")
    socket.leave(meetingId, () => {
      app.io.to(meetingId).emit('leaveRoom', meetingId);
    });
  });

  socket.on('disconnect', () => {
    console.log('disconnect ok');
  });

  function sendHeartbeat() {
    setTimeout(sendHeartbeat, 9000);
    app.io.emit("ping", {
      beat: 1
    });
  }

});


app.use((req, res, next) => {
  req.io = app.io;
  next();
});

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;