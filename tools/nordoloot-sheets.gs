// Nordoloot -> Google Sheets webhook, themed to match the app.
// Setup (one time, ~10 minutes):
//   1. Create a Google Sheet (this becomes the raider-facing link).
//   2. Extensions -> Apps Script -> delete the placeholder, paste this whole file, save.
//   3. Deploy -> New deployment -> type "Web app" -> Execute as: Me -> Who has access: Anyone -> Deploy.
//      (Google shows a scary consent screen because it's your own script - approve it.)
//   4. Copy the web app URL (ends in /exec) into Nordoloot's Sheets dialog.
//   5. Share the SHEET view-only with the raid. Keep the /exec URL private - anyone with it can write.
// After code changes here: Deploy -> Manage deployments -> edit -> New version. The URL stays the same.
//
// Every push clears and fully repaints each tab, so the colors always line up with the data
// no matter how many rows come and go. Hand-applied formatting on these tabs will be erased;
// style a separate tab (e.g. ={Standings!A:E}) if you want your own look.

var THEME = {
  bg: "#111214", card: "#1a1b1e", text: "#e6e4de", muted: "#96938d",
  gold: "#fbbf24", green: "#4ade80", red: "#f87171", blue: "#56c8ea"
};

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(data.tabs).forEach(function (name) {
    var rows = data.tabs[name];
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.clear();
    sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).setBackground(THEME.bg).setFontColor(THEME.text);
    if (!rows.length) return;
    var n = rows.length, m = rows[0].length;
    sh.getRange(1, 1, n, m).setValues(rows);

    var bgs = [], colors = [], weights = [];
    for (var r = 0; r < n; r++) {
      var isHeader = r === 0;
      var isSection = !isHeader && rows[r][0] && rows[r].slice(1).join("") === "";
      var rowBg = [], rowCol = [], rowW = [];
      for (var c = 0; c < m; c++) {
        rowBg.push(isHeader || isSection ? THEME.card : THEME.bg);
        rowW.push(isHeader || isSection ? "bold" : "normal");
        var col = THEME.text;
        if (isHeader || isSection) col = THEME.gold;
        else if (name === "Standings") {
          var v = String(rows[r][c]);
          if (c === 1) col = v.indexOf("/roll") === 0 ? THEME.red : THEME.green;   // winner
          else if (c === 2) col = THEME.gold;                                       // points
          else if (c === 3) col = v === "Contested" ? THEME.gold : v === "/roll tie" ? THEME.red : THEME.muted;
          else if (c === 4) col = THEME.muted;                                      // also in line
        } else if (name === "Awarded" && c === 3 && String(rows[r][c]) === "yes") col = THEME.red;
        else if (name === "LC Lines" && c === 3) col = String(rows[r][c]) === "RECEIVED" ? THEME.green : THEME.muted;
        rowCol.push(col);
      }
      bgs.push(rowBg); colors.push(rowCol); weights.push(rowW);
    }
    sh.getRange(1, 1, n, m).setBackgrounds(bgs).setFontColors(colors).setFontWeights(weights);
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, m);
  });
  return ContentService.createTextOutput("ok");
}
