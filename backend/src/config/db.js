import mongoose from "mongoose";
import Appointment from "../models/Appointments.js";

export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

  await Appointment.init();
  const indexes = await Appointment.collection.indexes();
  const legacyTimeIndexes = indexes.filter(
    (index) =>
      index.unique &&
      Object.keys(index.key).length === 1 &&
      ["requestedTime", "scheduledTime"].some(
        (field) => index.key[field] === 1,
      ),
  );

  for (const index of legacyTimeIndexes) {
    await Appointment.collection.dropIndex(index.name);
  }

  console.log(" MongoDB connected");
}
