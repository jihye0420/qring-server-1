io = require("socket.io")();

io.on("connection", (socket) => {

    socket.on('leaveRoom', (roomName) => {

        socket.on('joinRoom', (roomName) => {
            socket.join(roomName, () => {
                
            });
        });

        socket.leave(roomName, () => {
            console.log("socket - leave");
        });
    });

    // socket.on("sss", (data) => {
    //     console.log("클라이언트로부터 받은 메시지 : " + data);
    //     socket.emit("echo", data);
    // })
});