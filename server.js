const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const instagramRoutes = require("./routes/instagram");

const app = express();
const PORT = 7000;

app.use(cors());
app.use(bodyParser.json());
app.use("/api/instagram", instagramRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});  
 