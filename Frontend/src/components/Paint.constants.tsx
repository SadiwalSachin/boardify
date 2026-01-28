import { LuMousePointer2, LuPencil, LuSquare, LuCircle, LuType, LuArrowUpRight } from "react-icons/lu";

export enum DrawAction {
  Select = "select",
  Rectangle = "rectangle",
  Circle = "circle",
  Scribble = "freedraw",
  Arrow = "arrow",
  Text = "text",
}

export const PAINT_OPTIONS = [
  {
    id: DrawAction.Select,
    label: "Select Shapes",
    icon: <LuMousePointer2 size={20} />,
  },
  {
    id: DrawAction.Scribble,
    label: "Scribble",
    icon: <LuPencil size={20} />,
  },
  {
    id: DrawAction.Rectangle,
    label: "Rectangle",
    icon: <LuSquare size={20} />,
  },
  {
    id: DrawAction.Circle,
    label: "Circle",
    icon: <LuCircle size={20} />,
  },
  {
    id: DrawAction.Arrow,
    label: "Arrow",
    icon: <LuArrowUpRight size={20} />,
  },
  {
    id: DrawAction.Text,
    label: "Text",
    icon: <LuType size={20} />,
  },
];
