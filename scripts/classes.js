// In-game classes

var Meeba = function() {
  this.r = rand(config.minR, config.maxR);
  this.cx = rand(this.r, config.w - this.r);
  this.cy = rand(this.r, config.h - this.r);
  this.angle = rand();
  this.speed = config.speed;
  this.color = config.color;
};
