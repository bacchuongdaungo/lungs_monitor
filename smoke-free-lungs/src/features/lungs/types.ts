export type LobeId = "LUL" | "LLL" | "RUL" | "RML" | "RLL";
export type AirwayId = "trachea" | "bronchi";
export type Lungs3DPartId = LobeId | AirwayId;

export type BreathingParams = {
  respRateBpm: number;
  posture: "upright" | "supine";
  effort: "rest" | "light" | "heavy";
};
