import mongoose, { Schema, Document } from "mongoose";

export interface IChunk extends Document {
  documentId: mongoose.Types.ObjectId;
  chunkIndex: number;
  text: string;
  pageNumber: number;
  tokenCount: number;
  createdAt: Date;
}

const ChunkSchema = new Schema<IChunk>({
  documentId: {
    type: Schema.Types.ObjectId,
    ref: "Document",
    required: true,
    index: true,
  },

  chunkIndex: {
    type: Number,
    required: true,
  },

  text: {
    type: String,
    required: true,
  },

  pageNumber: {
    type: Number,
    default: 1,
  },

  tokenCount: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IChunk>("Chunk", ChunkSchema);
