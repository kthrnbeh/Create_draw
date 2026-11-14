import {
  isSerializedLayerState,
  type SerializedLayerState,
} from "../layers/LayerManager.js";

export const PROJECT_SCHEMA_VERSION = 1;

export interface ProjectDocument extends SerializedLayerState {
  schemaVersion: number;
  projectId: string;
  projectName: string;
  width: number;
  height: number;
  background: string;
  updatedAt: string;
  referenceAssetId?: string | null;
  referenceOpacity?: number;
}

export interface LegacySavedDrawing {
  drawing: string;
  background: string;
}

export function createProjectDocument(
  projectId: string,
  projectName: string,
  width: number,
  height: number,
  background: string,
  layerState: SerializedLayerState,
  updatedAt = new Date().toISOString(),
  referenceAssetId: string | null = null,
  referenceOpacity = 0.28,
): ProjectDocument {
  return {
    ...layerState,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    projectId,
    projectName,
    width,
    height,
    background,
    updatedAt,
    referenceAssetId,
    referenceOpacity,
  };
}

export function isProjectDocument(value: unknown): value is ProjectDocument {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<ProjectDocument>;
  return (
    project.schemaVersion === PROJECT_SCHEMA_VERSION &&
    typeof project.projectId === "string" &&
    project.projectId.length > 0 &&
    typeof project.projectName === "string" &&
    project.projectName.trim().length > 0 &&
    typeof project.width === "number" &&
    project.width > 0 &&
    typeof project.height === "number" &&
    project.height > 0 &&
    typeof project.background === "string" &&
    /^#[\da-f]{6}$/i.test(project.background) &&
    typeof project.updatedAt === "string" &&
    (project.referenceAssetId === undefined ||
      project.referenceAssetId === null ||
      (typeof project.referenceAssetId === "string" && project.referenceAssetId.length > 0)) &&
    (project.referenceOpacity === undefined ||
      (typeof project.referenceOpacity === "number" &&
        Number.isFinite(project.referenceOpacity) &&
        project.referenceOpacity >= 0 &&
        project.referenceOpacity <= 1)) &&
    isSerializedLayerState(project)
  );
}

export function isLegacySavedDrawing(value: unknown): value is LegacySavedDrawing {
  if (!value || typeof value !== "object") return false;
  const drawing = value as Partial<LegacySavedDrawing>;
  return (
    typeof drawing.drawing === "string" &&
    drawing.drawing.startsWith("data:image/png;base64,") &&
    typeof drawing.background === "string" &&
    /^#[\da-f]{6}$/i.test(drawing.background)
  );
}
