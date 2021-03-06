var config = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: 800,
  height: 600,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);
const ships = []

function preload() {
  this.load.image('ship', 'assets/player.png');
   this.load.image('ball', 'assets/circle.png');
 }

function create() {


let spacer = 2000/5
  for(let o = 1; o < 5; o++){
    for(let i = 1; i < 5; i++){
        this.add.image(spacer*i,spacer*o,"ball").setScale(.25)
    }
  }

  console.log("created")
 var self = this;
  this.socket = io();

  this.socket.on('currentPlayers', (playerData)=>{
    console.log(Object.keys(playerData)+" deteced")
   Object.keys(playerData).forEach((id)=> {
        displayPlayers(self, playerData[id]);      
    });
  })

   this.socket.on('newPlayer', (playerData)=>{
        displayPlayers(self, playerData);      
  })

  this.socket.on('remove', (playerId)=>{
    let pl = players.filter(p=>p.playerId==playerId)
    if(pl && pl[0]){
      players.splice(players.indexOf(pl[0], 1))
      pl[0].destroy()
    }
  })

  this.socket.on('playerUpdates', function (players) {
    Object.keys(players).forEach(function (id) {
      let sh = ships.filter(s => players[id].playerId === s.playerId)
      if (sh && sh[0]) {
          sh[0].setRotation(players[id].rotation);
          sh[0].setPosition(players[id].x, players[id].y);
      }
    })
  })

  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
    this.downKeyPressed = false;


}

function update() {
  const left = this.leftKeyPressed;
  const right = this.rightKeyPressed;
  const up = this.upKeyPressed;
  const down = this.downKeyPressed;

  if (this.cursors.left.isDown) {
    this.leftKeyPressed = true;
  } else if (this.cursors.right.isDown) {
    this.rightKeyPressed = true;
  } else {
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
  }

  if (this.cursors.up.isDown) {
    this.upKeyPressed = true;
  } else if(this.cursors.down.isDown){
    this.downKeyPressed = true;
  }else{
    this.upKeyPressed = false;
    this.downKeyPressed = false;
  }

  if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed || up !== this.downKeyPressed) {
    this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed, down: this.downKeyPressed });
  }
}

function displayPlayers(self, playerInfo) {
  console.log("adding"+playerInfo.playerId)
  const player = self.add.image(playerInfo.x, playerInfo.y, "ship")
  player.playerId = playerInfo.playerId;
  if(playerInfo.playerId === self.socket.id){
    self.cameras.main.startFollow(player)
  }
  player.setTint(playerInfo.tint)
  ships.push(player);
}
