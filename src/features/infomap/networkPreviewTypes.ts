import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";
import type { ModuleId } from "./moduleColors";
import type { PreviewNode } from "./parseInfomapPreview";

export interface SimNode extends PreviewNode, SimulationNodeDatum {
  radius: number;
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
  source: SimNode;
  target: SimNode;
  weight: number;
  flow: number;
  directed: boolean;
  width: number;
  reverseWidth: number;
  sharedModule?: ModuleId;
}

export interface Graph {
  nodes: SimNode[];
  links: SimLink[];
}

export interface ModuleFlow {
  module: number;
  flow: number;
}

export interface ModuleSlice {
  moduleId: ModuleId;
  flow: number;
}

export type ModuleFlowMap = Map<number, ModuleFlow[]>;

export type HoverState = {
  node: SimNode;
  moduleIds?: ModuleId[];
  x: number;
  y: number;
} | null;
