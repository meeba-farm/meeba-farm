const TANK_BUFFER = 20;

export const seed = parseInt(Math.random().toString().slice(2)).toString(36);

export const tank = {
  width: window.innerWidth - TANK_BUFFER,
  height: window.innerHeight - TANK_BUFFER
};

export const simulation = {
  bodies: 50,
  energy: 1000000
}

export const meebas = {
  maxRadius: 60,
  minRadius: 10
};
