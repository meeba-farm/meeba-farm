const TANK_BUFFER = 20;

export const seed = Math.random().toString(36).slice(2);

export const tank = {
  width: window.innerWidth - TANK_BUFFER,
  height: window.innerHeight - TANK_BUFFER,
};

export const simulation = {
  bodies: 75,
  energy: 2000000,
  temperature: 30,
};

export const meebas = {
  minRadius: 10,
  averageStartingGeneCount: 48,
  averageStartingGeneSize: 6,
};
