import "dotenv/config";
import app from "./app.js";

if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
  throw new Error("JWT_SECRET must be set to a random value at least 32 bytes long.");
}

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
