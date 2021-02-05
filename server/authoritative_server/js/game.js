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
const players = {};
const tiles = {}
ships = [];

function preload() {
  this.load.image('ship', 'assets/player.png');
  this.load.image('ball', 'assets/circle.png');
}

function create() {
  const self = this;
  this.matter.world.setBounds(0, 0, 2000, 2000);
  this.matter.world.on('collisionstart', function (event, bodyA, bodyB) {
  //  console.log('collision');
});
  makeBumpers(self, bumperDivisions);

  io.on('connection', function (socket) {
    players[socket.id] = makePlayerObject(self, socket.id);
    addShip(self, players[socket.id]);

    let changes = []
    Object.keys(tiles).forEach(index =>{
      changes.push({color: tiles[index], square: index})
    })
    console.log("sending the following changes", changes)
    socket.emit("colortile", changes)
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


  let colorChanges = []
  Object.keys(players).forEach(id =>{
    let sq = getSquare(players[id])

    if(sq != players[id].block){
      console.log("changin",sq, "to", players[id].tint)
      colorChanges.push( {square: sq, color: players[id].tint})
      tiles[sq] = players[id].tint      
      players[id].block = sq
    }
  })
  if(colorChanges.length > 0){
    io.emit("colortile",colorChanges)
  }
  
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
  let color = new Phaser.Display.Color();
  color.random(180);
   let x =  Math.floor(Math.random() * 700) + 50
  let y =  Math.floor(Math.random() * 500) + 50
  return {
    rotation: 0,
    x: x,
    y: y,
    square: getSquare({x:x, y:y}),
    playerId: id,
    tint: color.color,
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



function getSquare(ship){
  let size = 2000
  let space = size/bumperDivisions
  let square = 0
  for (let o = 0; o < bumperDivisions; o++) {
    for (let i = 0; i <bumperDivisions ; i++) {      
      if( ship.x > space*i && ship.x < space*i+space && ship.y > space*o && ship.y < space*o+space){
        return o*bumperDivisions+i
      }      
    }
  }
}