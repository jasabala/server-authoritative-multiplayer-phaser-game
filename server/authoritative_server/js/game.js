const players = {};
ships = [];

const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-game',
  width: 2000,
  height: 2000,
  physics: {
    default: 'matter',
    matter: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  autoFocus: false
};

let bumperDivisions = 8;

function preload() {
  this.load.image('ship', 'assets/player.png');
  this.load.image('ball', 'assets/circle.png');
}

function create() {
  const self = this;
  this.matter.world.setBounds(0, 0, 2000, 2000);
  makeBumpers(self, bumperDivisions);

  io.on('connection', function (socket) {
    players[socket.id] = makePlayerObject(self, socket.id);
    addShip(self, players[socket.id]);
    playerCommunication(socket, self);
  });
}

function update() {
  let playerUpdates = {};
  ships.forEach((ship) => {
    if (ship.input) {
      const input = ship.input;
      if (input.left) {
        Phaser.Physics.Matter.Matter.Body.setAngularVelocity(ship.body, -0.035);
      } else if (input.right) {
        Phaser.Physics.Matter.Matter.Body.setAngularVelocity(ship.body, 0.035);
      }
      if (input.up) {
        ship.thrust(1 / 2500);
      } else if (input.down) {
        ship.thrust(-1 / 3000);
      }
    }

    players[ship.playerId].x = ship.x;
    players[ship.playerId].y = ship.y;
    players[ship.playerId].rotation = ship.rotation;
    playerUpdates[ship.playerId] = {
      x: Math.round(ship.x),
      y: Math.round(ship.y),
      r: Math.round(ship.rotation * 100) / 100
    };
  });
  io.emit('playerUpdates', playerUpdates);
}

function playerCommunication(socket, self) {
  socket.emit('currentPlayers', players);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('disconnect', function () {
    console.log('user disconnected');
    // remove player from server
    removePlayer(self, socket.id);
    // remove this player from our players object
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('remove', socket.id);
  });

  // when a player moves, update the player data
  socket.on('playerInput', function (inputData) {
    handlePlayerInput(self, socket.id, inputData);
  });
  socket.emit('colortile', { tile: 6, color: '0xffffff' });
}

function addShip(self, playerInfo) {
  let ship = self.matter.add.sprite(
    100 + randomPosition(800),
    100 + randomPosition(800),
    'ship'
  );
  ship.setScale(0.5);
  ship.setOrigin(0.5);
  ship.playerId = playerInfo.playerId;
  ship.setFriction(0.05, 0.025, 0.065);
  ship.setBounce(0.9);
  ships.push(ship);
  ships[ships.length - 1].body.onWorldBounds = true;
  console.log(
    'just added to array',
    Object.keys(players),
    ships.map((a) => a.playerId)
  );
}

function makePlayerObject(self, id) {
  return {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: id,
    tint: '0x' + Math.floor(Math.random() * 16777215).toString(16),
    input: {
      left: false,
      right: false,
      up: false
    }
  };
}

function removePlayer(self, playerId) {
  console.log('remove');
  delete players[playerId];
  let s = ships.filter((s) => {
    return s.playerId === playerId;
  });
  if (s && s[0]) {
    ships.splice(ships.indexOf(s[0]), 1);
  }
  console.log(
    'just removed from array',
    Object.keys(players),
    ships.map((a) => a.playerId)
  );
}

function handlePlayerInput(self, playerId, input) {
  let sh = ships.filter((s) => s.playerId === playerId);
  if (sh && sh[0]) {
    sh[0].input = input;
  }
}

function makeBumpers(self, divisions) {
  let spacer = 2000 / divisions;
  for (let o = 0; o < divisions + 1; o++) {
    for (let i = 0; i < divisions + 1; i++) {
      let c = self.matter.add.sprite(spacer * i, spacer * o, 'ball');
      c.setScale(0.24);
      c.setCircle((c.width / 2) * 0.24);
      c.setStatic(true);
      c.setBounce(0.5);
    }
  }
}

function randomPosition(max) {
  return Math.floor(Math.random() * max) + 50;
}

const game = new Phaser.Game(config);
window.gameLoaded();
