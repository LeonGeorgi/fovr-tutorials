import { TagComponent, Component, Types } from "https://ecsyjs.github.io/ecsy/build/ecsy.module.js";

export class Mesh extends Component {
}

Mesh.schema = {
  value: { type: Types.Ref }
}

export class Position extends Component {
}

Position.schema = {
  x: { type: Types.Number, default: 0 },
  y: { type: Types.Number, default: 0 },
  z: { type: Types.Number, default: 0 }
}

export class Speed extends Component {
}

Speed.schema = {
  x: { type: Types.Number, default: 0 },
  y: { type: Types.Number, default: 0 },
  z: { type: Types.Number, default: 0 }
}

export class Spin extends Component {
}

Spin.schema = {
  x: { type: Types.Number, default: 0 },
  y: { type: Types.Number, default: 0 },
  z: { type: Types.Number, default: 0 }
}

export class PositionRange extends Component {
}

PositionRange.schema = {
  minX: { type: Types.Number, default: -10 },
  maxX: { type: Types.Number, default: 10 },
  minY: { type: Types.Number, default: -10 },
  maxY: { type: Types.Number, default: 10 },
  minZ: { type: Types.Number, default: -10 },
  maxZ: { type: Types.Number, default: 10 },
}

export class Gravity extends TagComponent {
}

export class FallThrough extends TagComponent {
}

export class Bounce extends TagComponent {
}

export class AirResistance extends Component {
}

AirResistance.schema = {
  value: { type: Types.Number, default: 0.1 }
}

export class Pulse extends Component {
}

Pulse.schema = {
  speed: { type: Types.Number, default: 1 },
  min: { type: Types.Number, default: 1 },
  max: { type: Types.Number, default: 2 }
}