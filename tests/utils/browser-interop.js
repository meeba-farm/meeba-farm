'use strict';

const stubWindow = () => {
  if (typeof window === 'undefined') {
    global.window = global;
  }

  global.atob = () => 'foo';
  global.btoa = () => 'foo';
  global.localStorage = {
    getItem: () => 'foo',
    setItem: () => {},
    removeItem: () => {},
  };

  global.innerWidth = 0;
  global.innerHeight = 0;

  const frameDuration = 16.67;
  let timePassed = 0;
  global.requestAnimationFrame = (callback) => {
    setTimeout(() => {
      timePassed += frameDuration;
      callback(timePassed);
    }, frameDuration);
  };
};

module.exports = {
  stubWindow,
};
