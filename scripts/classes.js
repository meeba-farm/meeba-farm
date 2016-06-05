// In-game classes

var Meeba = function() {
  this.r = rand(config.minR, config.maxR);
  this.angle = rand();
  this.speed = config.speed;
  this.color = config.color;
};
