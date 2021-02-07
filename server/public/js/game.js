var config = {
  type: Phaser.WEBGL,
  parent: 'phaser-game',
  physics: {
    default: 'matter',
    matter: {
      debug: true,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);
const ships = [];
const tiles = [];
let divisions = 8;

function preload() {
  this.load.image('tile', 'assets/tile.png');
  this.load.image('ship', 'assets/player.png');
  this.load.image('ball', 'assets/circle.png');
}

function create() {
  let graphics = this.add.graphics();

  
  let spacer = 2000 / divisions;
  for (let o = 1; o < divisions + 1; o++) {
    for (let i = 1; i < divisions + 1; i++) {
      let color1 = 0x888888;
      let color2 = 0x999999;
      let t = this.add.image(spacer * i, spacer * o, 'tile').setTint(color1);
      
      if ((i + o) % 2 === 0) t.setTint(color2);
      t.setScale(spacer / t.width);
      t.setOrigin(1, 1);
      tiles.push(t);
    }
  }
  for (let o = 0; o < divisions + 1; o++) {
    for (let i = 0; i < divisions + 1; i++) {
      let im = this.add.image(spacer * i, spacer * o, 'ball');
      im.setScale(0.25);
      im.setDepth(3);
    }
  }

  //  spacer = 2000/(divisions*2)
  //   for(let o = 0; o < (divisions*2); o++){
  //         this.add.line( 1000,o*spacer,0, o*spacer, 2000,o*spacer, 0x222222)
  //          this.add.line( o*spacer,1000, o*spacer, 0, o*spacer, 2000, 0x222222)

  //     }

  var self = this;
  this.socket = io();

  this.socket.on('currentPlayers', (playerData) => {
    Object.keys(playerData).forEach((id) => {
      displayPlayers(self, playerData[id]);
    });
  });

  this.socket.on('newPlayer', (playerData) => {
    displayPlayers(self, playerData);
  });

  this.socket.on('remove', (playerId) => {
    let pl = ships.filter((p) => p.playerId == playerId);
    if (pl && pl[0]) {
      players.splice(players.indexOf(pl[0], 1));
      pl[0].destroy();
    }
  });

  this.socket.on('playerUpdates', function (players) {
    Object.keys(players).forEach(function (id) {
      let sh = ships.filter((s) => id == s.playerId);
      if (sh && sh[0]) {
        sh[0].setRotation(players[id].r);
        sh[0].setPosition(players[id].x, players[id].y);
        sh[0].setVelocityX(players[id].vx)
      }
    });
  });

  this.socket.on('colortile', (data) => {
    data.forEach( dat =>{
      tiles[dat.square].setTint(dat.color);
      tiles[dat.square].setAlpha(.9);
    })
    
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
  this.downKeyPressed = false;
  this.wKey = this.input.keyboard.addKey('W', true, false)
  this.sKey = this.input.keyboard.addKey('S', true, false)
  this.aKey = this.input.keyboard.addKey('A', true, false)
  this.dKey = this.input.keyboard.addKey('D', true, false)
}

function update() {
  const left = this.leftKeyPressed;
  const right = this.rightKeyPressed;
  const up = this.upKeyPressed;
  const down = this.downKeyPressed;

  this.leftKeyPressed =  this.cursors.left.isDown|| this.aKey.isDown 
  this.rightKeyPressed = this.cursors.right.isDown|| this.dKey.isDown
  this.upKeyPressed =this.cursors.up.isDown || this.wKey.isDown
  this.downKeyPressed = this.cursors.down.isDown|| this.sKey.isDown
  if (
    left !== this.leftKeyPressed ||
    right !== this.rightKeyPressed ||
    up !== this.upKeyPressed ||
    down !== this.downKeyPressed
  ) {
    this.socket.emit('playerInput', {
      left: this.leftKeyPressed,
      right: this.rightKeyPressed,
      up: this.upKeyPressed,
      down: this.downKeyPressed
    });
  }
}

function displayPlayers(self, playerInfo) {
   let ship = self.matter.add.sprite(
    playerInfo.x,
    playerInfo.y,
    'ship'
  );
  ships.push(ship);
  ship.body.onWorldBounds = true;
  ship.setScale(0.5);
  ship.setOrigin(0.5);
  ship.playerId = playerInfo.playerId;
  ship.setFriction(0.05, 0.025, 0.065);
  ship.setBounce(0.9);
  ship.playerId = playerInfo.playerId;
  if (playerInfo.playerId === self.socket.id) {
    self.cameras.main.startFollow(ship);
  }
  ship.setTint(playerInfo.tint);
  
  
}
