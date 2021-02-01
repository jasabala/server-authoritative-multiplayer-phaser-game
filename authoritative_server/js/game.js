const players = {};
ships = []

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

function preload() {
 this.load.image('ship', 'assets/player.png');
 this.load.image('ball', 'assets/circle.png');

}

function create() {


this.matter.world.setBounds(0, 0, 2000,2000);

const self = this
let spacer = 2000/5
  for(let o = 1; o < 5; o++){
    for(let i = 1; i < 5; i++){
        let c = this.matter.add.sprite(spacer*i,spacer*o,"ball").setScale(.25)
        c.setCircle(c.width/2*.25).setInteractive(true).setStatic(true).setBounce(1)    
    }
  }
  let c = this.matter.add.sprite(100,100,"ball")
  c.setCircle(c.width/2).setInteractive(true).setStatic(true).setBounce(1)

  io.on('connection', function (socket) {
    console.log('a user connected');
    // create a new player and add it to our players object
    players[socket.id] = {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      tint:  '0x'+Math.floor(Math.random()*16777215).toString(16),
      input: {
        left: false,
        right: false,
        up: false
      }
    };



    // add player to server
    addPlayer(self, players[socket.id]);
    // send the players object to the new player
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
  });
}


function update() {

   ships.forEach((ship) => {
     
    if(ship.input){
      const input =ship.input;

      if (input.left) {      
        Phaser.Physics.Matter.Matter.Body.setAngularVelocity(ship.body, -0.03);
        
      } else if (input.right) {
        Phaser.Physics.Matter.Matter.Body.setAngularVelocity(ship.body, 0.03);
        
      } 
      if (input.up) {
        
            ship.thrust(.0075)
      } else if (input.down) {
            ship.thrust(-.005)
      }

    }
    
     players[ship.playerId].x = ship.x;
     players[ship.playerId].y = ship.y;
     players[ship.playerId].rotation = ship.rotation;
  })
  io.emit('playerUpdates', players);
        
}

function handlePlayerInput(self, playerId, input) {
  let sh = ships.filter(s=>s.playerId === playerId)
  if(sh && sh[0]){
      sh[0].input = input;
  }  
}
function addPlayer(self, playerInfo) {
   
 let ship = self.matter.add.sprite(100+randomPosition(800),100+randomPosition(800),"ship")
 ship.playerId = playerInfo.playerId
 ship.setFriction(.05, .025,.065)
 ship.setInteractive(true) 
 ship.setBounce(.9)
 ships.push(ship)
 ships[ships.length-1].body.onWorldBounds = true;
 console.log("just added to array", Object.keys(players),ships.map(a=>a.playerId))
   
}

function removePlayer(self, playerId) {
  console.log("remove")
   delete players[playerId]
   let s = ships.filter((s)=>{return s.playerId === playerId})
   if(s && s[0]){
    ships.splice(ships.indexOf(s[0]), 1)
   }   
  console.log("just removed from array", Object.keys(players),ships.map(a=>a.playerId)) 
}


function randomPosition(max) {
  return Math.floor(Math.random() * max) + 50;
}

const game = new Phaser.Game(config);
window.gameLoaded();
