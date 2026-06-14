import { env } from "./config/env.js";
import { app } from "./app.js";

app.listen(env.PORT, () => {
  console.log(`FairShare server listening on port ${env.PORT}`);
});
