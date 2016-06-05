// In-game classes

var Meeba = function() {
  this.id = '#m' + ('00' + state.count++).slice(-3);
  this.r = rand(config.minR, config.maxR);
  this.x = rand(this.r, config.w - this.r);
  this.y = rand(this.r, config.h - this.r);
  this.angle = rand();
  this.speed = config.speed;
  this.color = config.color;
};
