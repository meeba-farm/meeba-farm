import { PI_2, sqr, cos, sin, acos } from './math.js';

// Break an angle/speed vector into an x/y vector
export const breakVector = ({ angle, speed }) => ({
  x: cos(angle) * speed,
  y: -sin(angle) * speed,
});

// Merge an x/y vector into angle(in turns) and speed
export const mergeVector = ({ x, y }) => {
  const speed = Math.sqrt(sqr(x) + sqr(y));
  const angle = acos(x / speed) / PI_2;

  // ACos always gives northwards angles, check if should be southwards
  return {
    angle: y > 0 ? 1 - angle : angle,
    speed,
  };
};

// Quick functions to elastically collide bodies off a wall
export const bounceX = ({ velocity }) => {
  const { angle } = velocity;
  velocity.angle = angle <= 0.5 ? 0.5 - angle : 1.5 - angle;
};
export const bounceY = ({ velocity }) => {
  const { angle } = velocity;
  velocity.angle = angle === 0 ? 0 : 1 - angle;
};

// Calculate a collision between two bodies, using math outlined here:
// http://vobarian.com/collisions/2dcollisions2.pdf
export const collide = (body1, body2) => {
  const m1 = body1.mass;
  const m2 = body2.mass;
  const v1 = breakVector(body1.velocity);
  const v2 = breakVector(body2.velocity);

  // Calculate unit normal vector and unit tangent vector
  const n = { x: body2.x - body1.x, y: body2.y - body1.y };
  const mn = Math.sqrt(sqr(n.x) + sqr(n.y));
  const un = { x: n.x / mn, y: n.y / mn };
  const ut = { x: -un.y, y: un.x };

  // Calculate scalar velocities on the normal and the tangent
  const vn1 = un.x * v1.x + un.y * v1.y;
  const vt1 = ut.x * v1.x + ut.y * v1.y;
  const vn2 = un.x * v2.x + un.y * v2.y;
  const vt2 = ut.x * v2.x + ut.y * v2.y;

  // Calculate final velocities along the normal (tangent will not change)
  const vn1F = (vn1 * (m1 - m2) + 2 * m2 * vn2) / (m1 + m2);
  const vn2F = (vn2 * (m2 - m1) + 2 * m1 * vn1) / (m1 + m2);

  // Convert scalar velocities back into vectors
  const vn1Vec = { x: vn1F * un.x, y: vn1F * un.y };
  const vt1Vec = { x: vt1 * ut.x, y: vt1 * ut.y };
  const vn2Vec = { x: vn2F * un.x, y: vn2F * un.y };
  const vt2Vec = { x: vt2 * ut.x, y: vt2 * ut.y };

  // Calculate final vectors, by adding normal and tangent vectors
  const v1F = { x: vn1Vec.x + vt1Vec.x, y: vn1Vec.y + vt1Vec.y };
  const v2F = { x: vn2Vec.x + vt2Vec.x, y: vn2Vec.y + vt2Vec.y };

  // Convert back to angle (in turns) and magntitude and save to bodies
  const { speed: speed1, angle: angle1 } = mergeVector(v1F);
  const { speed: speed2, angle: angle2 } = mergeVector(v2F);

  body1.velocity.speed = speed1;
  body1.velocity.angle = angle1;
  body2.velocity.speed = speed2;
  body2.velocity.angle = angle2;
};
