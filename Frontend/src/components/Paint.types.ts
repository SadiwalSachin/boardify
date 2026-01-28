export type ShapeType = "freedraw" | "rectangle" | "circle" | "arrow" | "text" | "scribble";

export type Shape = {
  id: string;
  type: ShapeType;
  color: string;
  x: number;
  y: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  remove?: boolean;
};

export type Scribble = Shape & {
  type: "freedraw" | "scribble";
  points: number[];
};

export type Circle = Shape & {
  type: "circle";
  radius: number;
};

export type Rectangle = Shape & {
  type: "rectangle";
  width: number;
  height: number;
};

export type Arrow = Shape & {
  type: "arrow";
  points: number[];
};

export type TextShape = Shape & {
  type: "text";
  text: string;
  fontSize: number;
};

export type BoardElement = Scribble | Circle | Rectangle | Arrow | TextShape;

export interface Size {
  width: number;
  height: number;
}