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
};

module.exports = {
  stubWindow,
};
