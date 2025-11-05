import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  name: string;
  sequence: number;
}

const CounterSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  sequence: {
    type: Number,
    required: true,
    default: 0
  }
});

export default mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);
