$(document).ready(function () {
  var table = $("#data-table").DataTable();

  $("#file-upload-btn").click(function () {
    $("#file-upload").click();
  });

  //   $("#file-upload").change(function (event) {
  //     var file = event.target.files[0];
  //     if (!file) return;

  //     var reader = new FileReader();
  //     reader.onload = function (e) {
  //       var data = new Uint8Array(e.target.result);
  //       var workbook = XLSX.read(data, { type: "array" });

  //       var sheet = workbook.Sheets[workbook.SheetNames[0]];
  //       var jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Get as 2D array

  //       // Dynamically populate table headers based on the first row of data
  //       var headerRow = jsonData[0];
  //       var tableHeadHtml = "<tr>";
  //       headerRow.forEach(function (col) {
  //         tableHeadHtml += '<th class="text-center">' + col + "</th>";
  //       });
  //       tableHeadHtml += "</tr>";

  //       $("#data-table thead").html(tableHeadHtml);

  //       table.clear();

  //       // Add data rows
  //       jsonData.slice(1).forEach(function (row) {
  //         var rowData = [];
  //         headerRow.forEach(function (_, i) {
  //           // If data in row[i] doesn't exist, add a placeholder for alignment
  //           rowData.push(row[i] !== undefined ? row[i] : "");
  //         });

  //         // Add row if the column count is correct
  //         if (rowData.length === headerRow.length) {
  //           table.row.add(rowData); // Add row with matching columns
  //         }
  //       });

  //       // Redraw the table
  //       table.draw();
  //     };

  //     reader.readAsArrayBuffer(file);
  //   });

  //   $("area").on("click", function (event) {
  //     event.preventDefault();
  //     const city = $(this).data("city");

  //     table.column(4).search(city).draw();
  //   });

  $("#file-upload").change(function (event) {
    var file = event.target.files[0];
    if (!file) return;

    var formData = new FormData();
    formData.append("file", file);

    $.ajax({
      url: "http://localhost:3000/upload",
      method: "POST",
      data: formData,
      contentType: false,
      processData: false,
      success: function (response) {
        console.log(response);
        alert("File berhasil di-upload dan di-replace!");
      },
      error: function (error) {
        console.error("Terjadi error saat upload:", error);
        alert("Gagal upload file.");
      },
    });
  });

  // $("#load-data-btn").click(function () {
  loadExcelFromServer();
  // });

  function loadExcelFromServer() {
    console.log("Button clicked!");
    fetch("http://localhost:3000/uploads/excel-file/last-update")
      .then((response) => response.json())
      .then((data) => {
        const lastUpdateDate = data.lastModified; // lastupdate

        // Display the last update date in the HTML
        document.getElementById("last-update").innerText = new Date(
          lastUpdateDate
        ).toLocaleString();

        // get file excel
        return fetch("http://localhost:3000/uploads/excel-file").then(
          (response) => response.arrayBuffer()
        );
      })
      .then((buffer) => {
        var data = new Uint8Array(buffer);
        var workbook = XLSX.read(data, { type: "array" });
        var sheet = workbook.Sheets[workbook.SheetNames[0]];
        var jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        var headerRow = jsonData[0];
        var tableHeadHtml = "<tr>";
        headerRow.forEach(function (col) {
          tableHeadHtml += '<th class="text-center">' + col + "</th>";
        });
        tableHeadHtml += "</tr>";

        $("#data-table thead").html(tableHeadHtml);

        table.clear();

        // Add data rows
        jsonData.slice(1).forEach(function (row) {
          var rowData = [];
          headerRow.forEach(function (_, i) {
            rowData.push(row[i] !== undefined ? row[i] : "");
          });

          if (rowData.length === headerRow.length) {
            table.row.add(rowData);
          }
        });

        // Redraw the table
        table.draw();
      })
      .catch((error) => console.error("Error reading file: ", error));
  }

  $("area").on("click", function (event) {
    event.preventDefault();
    const city = $(this).data("city");

    table.column(4).search(city).draw();
  });

  $(".run-py-btn").click(function () {
    runPythonScript();
  });

  function runPythonScript() {
    fetch("/run-python", {
      method: "GET", // Call the endpoint
    })
      .then((response) => response.text())
      .then((data) => {
        console.log(data); // Output response in console
        alert("Python script executed successfully!");
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to execute Python script.");
      });
  }
});