export interface VectorPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export async function upsertVectors(_points: VectorPoint[]): Promise<void> {
  throw new Error("Vector database not configured yet");
}

export async function searchVectors(
  _vector: number[],
  _limit?: number
): Promise<VectorPoint[]> {
  throw new Error("Vector database not configured yet");
}

export async function deleteVectors(_ids: string[]): Promise<void> {
  throw new Error("Vector database not configured yet");
}
