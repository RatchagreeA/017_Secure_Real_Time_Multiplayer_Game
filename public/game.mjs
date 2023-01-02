import Player from "./Player.mjs";
import Collectible from "./Collectible.mjs";
import dimension from "./dimension.mjs";
const socket = io();

window.addEventListener("load", function () {
  const canvas = document.getElementById("game-window");
  const ctx = canvas.getContext("2d");
  canvas.style.backgroundColor = "#c9e9fa";
  canvas.style.border = "5px solid blue";

  const KEYS = {
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };
  class UI {
    constructor(game) {
      this.game = game;
      this.color = "black";
      this.font = `26px 'Modak'`;
      this.fontSize = 25;
    }
    draw(context) {
      context.fillStyle = "pink";
      context.fillRect(0, 0, dimension.canvasWidth, dimension.minY - 5);
      context.fillStyle = "blue";
      context.fillRect(0, dimension.minY - 10, dimension.canvasWidth, 5);
      context.fillStyle = this.color;
      context.font = this.font;
      let rankTxt = this.game.player.calculateRank(this.game.playersList);
      let scoreTxt = `Score : ${this.game.player.score}`;
      let summaryTxt = `Controls: WASD  |   ${scoreTxt}     ->      ${rankTxt}`;
      context.fillText(summaryTxt, 20, 23);
    }
  }
  class InputHandler {
    constructor(game) {
      this.game = game;
      window.addEventListener("keydown", (e) => {
        let keyDown = e.key;
        if (keyDown in KEYS) {
          let idx = this.game.keys.indexOf(KEYS[keyDown]);
          if (idx == -1) {
            this.game.keys.push(KEYS[keyDown]);
          }
        }
      });
      window.addEventListener("keyup", (e) => {
        let keyUp = e.key;
        if (keyUp in KEYS) {
          let idx = this.game.keys.indexOf(KEYS[keyUp]);
          if (idx > -1) {
            this.game.keys.splice(idx, 1);
          }
        }
      });
    }
  }
  class Game {
    constructor(playerInfo, item, playersList, playerImg, itemImg) {
      this.player = new Player(playerInfo);
      this.item = new Collectible(item);
      this.input = new InputHandler(this);
      this.UI = new UI(this);
      this.keys = [];
      this.speed = 5;
      this.playersList = playersList;
      this.playerImg = playerImg;
      this.itemImg = itemImg;
    }
    update() {
      if (this.keys.includes("up")) {
        this.player.movePlayer("up", this.speed);
      }
      if (this.keys.includes("down")) {
        this.player.movePlayer("down", this.speed);
      }
      if (this.keys.includes("left")) {
        this.player.movePlayer("left", this.speed);
      }
      if (this.keys.includes("right")) {
        this.player.movePlayer("right", this.speed);
      }
      if (this.player.collision(this.item)) {
        this.item.isHit = true;
      }
      return [this.player, this.item];
    }
    draw(ctx) {
      this.item.draw(ctx, this.itemImg);
      this.player.draw(ctx, this.playerImg);
      this.UI.draw(ctx);
    }
  }

  let playersList;
  socket.on("init", ({ id, players, item }) => {
    playersList = players;
    console.log(id, playersList, item);

    let playerInfo = playersList.filter((x) => x.id === id)[0];
    let playerImg = new Image();
    let itemImg = new Image();
    playerImg.src = "public/img/tom.png";
    itemImg.src = "public/img/jerry.png";
    const game = new Game(playerInfo, item, playersList, playerImg, itemImg);

    let lastTime = 0;
    function animate(timeStamp) {
      const deltaTime = timeStamp - lastTime;
      lastTime = timeStamp;
      //   console.log(deltaTime);
      ctx.clearRect(0, 0, dimension.canvasWidth, dimension.canvasHeight);
      const [playerUpdate, itemUpdate] = game.update();
      if (itemUpdate.isHit) {
        socket.emit("update", { playerUpdate, itemUpdate });
      }
      socket.on("update", ({ id, players, player, item }) => {
        playersList = players;
        game.playersList = playersList;
        if (game.player.id == id) {
          game.player.score = player.score;
          game.item.x = item.x;
          game.item.y = item.y;
          game.item.isHit = item.isHit;
        }
      });
      game.draw(ctx);
      requestAnimationFrame(animate);
    }
    animate(0);
  });
});
