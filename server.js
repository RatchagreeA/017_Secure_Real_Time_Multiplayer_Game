require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const expect = require("chai");
const socket = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
// const nocache = require("nocache");

const fccTestingRoutes = require("./routes/fcctesting.js");
const runner = require("./test-runner.js");

const app = express();

app.use("/public", express.static(process.cwd() + "/public"));
app.use("/assets", express.static(process.cwd() + "/assets"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// helmet part
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());
// app.use(nocache());
app.use(helmet.hidePoweredBy({ setTo: "PHP 7.4.3" }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({ origin: "*" }));

// Index page (static HTML)
app.route("/").get(function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

//For FCC testing purposes
fccTestingRoutes(app);

// 404 Not Found Middleware
app.use(function (req, res, next) {
  res.status(404).type("text").send("Not Found");
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === "test") {
    console.log("Running Tests...");
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log("Tests are not valid:");
        console.error(error);
      }
    }, 1500);
  }
});

// Socket.io setup:
const Player = require("./public/Player");
const Collectible = require("./public/Collectible");
const dimension = require("./public/dimension");

const random = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

const getRandomPosition = () => {
  let x = random(dimension.minX + 50, dimension.maxX - 50);
  let y = random(dimension.minY + 50, dimension.maxY - 50);
  x = Math.floor(x / 10) * 10;
  y = Math.floor(y / 10) * 10;

  return [x, y];
};

let socketList = [];
let playersList = [];

const io = socket(server);
io.sockets.on("connection", (socket) => {
  console.log(`New connection ${socket.id}`);
  socketList.push(socket);
  console.log("Connected: %s sockets connected.", socketList.length);

  let [itemX, itemY] = getRandomPosition();
  let item = new Collectible({ x: itemX, y: itemY, value: 1, id: Date.now() });

  let [positionX, positionY] = getRandomPosition();
  let player = new Player({
    x: positionX,
    y: positionY,
    score: 0,
    id: socket.id,
  });
  playersList.push(player);
  socket.emit("init", { id: socket.id, players: playersList, item: item });

  socket.on("update", ({ playerUpdate, itemUpdate }) => {
    if (itemUpdate.isHit) {
      playerUpdate.score += itemUpdate.value;
      playersList.forEach((user) => {
        if (user.id === socket.id) {
          user.x = playerUpdate.x;
          user.y = playerUpdate.y;
          user.score = playerUpdate.score;
          user.radius = playerUpdate.radius;
        }
      });
      let [itemX, itemY] = getRandomPosition();
      itemUpdate.x = itemX;
      itemUpdate.y = itemY;
      itemUpdate.isHit = false;
      io.emit("update", {
        id: socket.id,
        players: playersList,
        player: playerUpdate,
        item: itemUpdate,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`deconnection ${socket.id}`);
    socket.broadcast.emit("remove-player", socket.id);
    socketList.splice(socketList.indexOf(socket), 1);
    playersList = playersList.filter((player) => player.id !== socket.id);
    console.log("Disconnected: %s sockets connected.", socketList.length);
  });
});

module.exports = app; // For testing
