import { System } from "https://ecsyjs.github.io/ecsy/build/ecsy.module.js";
import {
  Gravity,
  Position,
  Mesh,
  Speed,
  Spin,
  PositionRange,
  Bounce,
  FallThrough, AirResistance, Pulse
} from './components.mjs';


export class GravitySystem extends System {
  execute(delta, time) {
    this.queries.gravity.results.forEach(entity => {
      const speed = entity.getMutableComponent(Speed);
      speed.y -= 9.8 * delta;
    });
  }
}

GravitySystem.queries = {
  gravity: {
    components: [Gravity, Speed]
  }
}

export class SpinSystem extends System {
  execute(delta, time) {
    this.queries.spin.results.forEach(entity => {
      const spin = entity.getMutableComponent(Spin);
      const mesh = entity.getComponent(Mesh).value;
      mesh.rotation.x += spin.x * delta;
      mesh.rotation.y += spin.y * delta;
      mesh.rotation.z += spin.z * delta;
    });
  }
}

SpinSystem.queries = {
  spin: {
    components: [Spin, Mesh]
  }
}

export class MovementSystem extends System {
  execute(delta, time) {
    this.queries.positions.results.forEach(entity => {
      const position = entity.getMutableComponent(Position);
      const speed = entity.getComponent(Speed);
      position.x += speed.x * delta;
      position.y += speed.y * delta;
      position.z += speed.z * delta;
    });
  }
}

MovementSystem.queries = {
  positions: {
    components: [Position, Speed]
  }
}

export class RenderSystem extends System {
  execute(delta, time) {
    this.queries.positions.results.forEach(entity => {
      const position = entity.getComponent(Position);
      const mesh = entity.getComponent(Mesh).value;
      mesh.position.set(position.x, position.y, position.z);
    });
  }
}

RenderSystem.queries = {
  positions: {
    components: [Position, Mesh]
  }
}

export class FallThroughSystem extends System {
  execute(delta, time) {
    this.queries.positions.results.forEach(entity => {
      const position = entity.getMutableComponent(Position);
      const positionRange = entity.getComponent(PositionRange);
      position.x = putIntoLimits(position.x, positionRange.minX, positionRange.maxX);
      position.y = putIntoLimits(position.y, positionRange.minY, positionRange.maxY);
      position.z = putIntoLimits(position.z, positionRange.minZ, positionRange.maxZ);
    });
  }
}

FallThroughSystem.queries = {
  positions: {
    components: [Position, PositionRange, FallThrough]
  }
}

function putIntoLimits(value, min, max) {
  if (value < min) {
    return max;
  } else if (value > max) {
    return min;
  } else {
    return value;
  }
}

export class BounceSystem extends System {
  execute(delta, time) {
    this.queries.bounce.results.forEach(entity => {
      const position = entity.getMutableComponent(Position);
      const speed = entity.getMutableComponent(Speed);
      const positionRange = entity.getComponent(PositionRange);
      if (position.x < positionRange.minX || position.x > positionRange.maxX) {
        speed.x *= -1;
      }
      if (position.y < positionRange.minY || position.y > positionRange.maxY) {
        speed.y *= -1;
      }
      if (position.z < positionRange.minZ || position.z > positionRange.maxZ) {
        speed.z *= -1;
      }
    });
  }
}

BounceSystem.queries = {
  bounce: {
    components: [Bounce, Position, Speed, PositionRange]
  }
}

export class AirResistanceSystem extends System {
  execute(delta, time) {
    this.queries.airResistance.results.forEach(entity => {
      const speed = entity.getMutableComponent(Speed);
      const airResistance = entity.getComponent(AirResistance).value;
      speed.x *= (1 - airResistance) ** delta;
      speed.y *= (1 - airResistance) ** delta;
      speed.z *= (1 - airResistance) ** delta;
    });
  }
}

AirResistanceSystem.queries = {
  airResistance: {
    components: [AirResistance, Speed]
  }
}

export class PulseSystem extends System {
  execute(delta, time) {
    this.queries.pulse.results.forEach(entity => {
      const pulse = entity.getMutableComponent(Pulse);
      const mesh = entity.getComponent(Mesh).value;
      const pulsePerMillisecond = pulse.speed / 1000;
      const scale = (Math.sin(time * pulsePerMillisecond * Math.PI * 2) / 2 + 1) * (pulse.max - pulse.min) + pulse.min;
      console.log(time, scale);
      mesh.scale.x = scale;
      mesh.scale.y = scale;
      mesh.scale.z = scale;
    });
  }
}

PulseSystem.queries = {
  pulse: {
    components: [Pulse, Mesh]
  }
}