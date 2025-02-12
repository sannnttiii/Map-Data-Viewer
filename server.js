const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cors = require("cors");
const { spawn } = require("child_process"); // Untuk menjalankan script Python

const app = express();
const port = 3000;

app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, "data_ready.xlsx");
  },
});

const upload = multer({ storage: storage });

// check file exists
app.get("/uploads/excel-file", (req, res) => {
  const filePath = path.join(__dirname, "uploads", "data_ready.xlsx");

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found.");
  }

  res.sendFile(filePath);
});

// lastupdate
app.get("/uploads/excel-file/last-update", (req, res) => {
  const filePath = path.join(__dirname, "uploads", "data_ready.xlsx");

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found.");
  }

  const stats = fs.statSync(filePath);
  const lastModified = stats.mtime; // Get last modification time

  // Send last update
  res.json({ lastModified: lastModified.toISOString() });
});

// Endpoint untuk upload dan mengganti file Excel yang lama
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Tidak ada file yang di-upload" });
  }

  console.log("File uploaded and replaced:", req.file);

  // Jalankan prepare_data.py
  const pythonScriptPath = path.join(__dirname, "uploads", "prepare_data.py");
  const pythonProcess = spawn("python3", [pythonScriptPath]);

  let outputData = "";
  let errorData = "";

  pythonProcess.stdout.on("data", (data) => {
    outputData += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    errorData += data.toString();
  });

  pythonProcess.on("close", (code) => {
    console.log(`prepare_data.py selesai dengan kode ${code}`);

    if (code === 0) {
      res.json({
        message: "File berhasil di-upload dan diproses!",
        output: outputData,
      });
    } else {
      res.status(500).json({
        message: "Gagal memproses file.",
        error: errorData || "Terjadi kesalahan saat menjalankan script Python.",
      });
    }
  });
});

app.get("/run-python", (req, res) => {
  const pythonScriptPath = path.join(__dirname, "algorithm.py");
  const pythonProcess = spawn("python3", [pythonScriptPath]);
  let outputData = "";

  pythonProcess.stdout.on("data", (data) => {
    outputData += data.toString(); // Append data from py
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
  });

  // On process close, send the response back to the frontend
  pythonProcess.on("close", (code) => {
    console.log(`Python script finished with exit code ${code}`);
    res.send({ message: outputData }); // Send the output back
  });
});

app.get("/load-content/:tab", (req, res) => {
  const tab = req.params.tab;
  const modelMap = {
    tab1: {
      script: "kmeans_model/kmeans_train_model.py",
      txt: "kmeans_model/kmeans_html_results.txt",
      images: [
        "kmeans_model/kmeans_clusters.png",
        "kmeans_model/kmeans_pca.png",
        "kmeans_model/kmeans_confusion_matrix.png",
      ],
    },
    tab2: {
      script: "gmm_model/gmm_train_model.py",
      txt: "gmm_model/gmm_html_results.txt",
      images: [
        "gmm_model/gmm_clusters.png",
        "gmm_pca.png",
        "gmm_confusion_matrix.png",
      ],
    },
    tab3: {
      script: "hierarchical_model/hierarchical_train_model.py",
      txt: "hierarchical_model/hierarchical_html_results.txt",
      images: [
        "hierarchical_model/hierarchical_clusters.png",
        "hierarchical_model/hierarchical_pca.png",
        "hierarchical_model/hierarchical_confusion_matrix.png",
      ],
    },
  };

  const model = modelMap[tab];
  if (!model) {
    return res.status(400).send("Invalid tab name.");
  }

  const scriptPath = path.join(__dirname, "uploads", model.script);
  const filePath = path.join(__dirname, "uploads", model.txt);

  // Run Python script
  const pythonProcess = spawn("python3", [scriptPath]);

  pythonProcess.stdout.on("data", (data) => {
    console.log(`Python Output: ${data}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`Python script finished with code ${code}`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found.");
    }

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return res.status(500).send("Error reading file.");
      }
      res.json({
        images: model.images,
        content: data,
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
