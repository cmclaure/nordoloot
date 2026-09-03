// Nordoloot -> Google Sheets webhook.
// Setup (one time, ~10 minutes):
//   1. Create a Google Sheet (this becomes the raider-facing link).
//   2. Extensions -> Apps Script -> delete the placeholder, paste this whole file, save.
//   3. Deploy -> New deployment -> type "Web app" -> Execute as: Me -> Who has access: Anyone -> Deploy.
//      (Google shows a scary consent screen because it's your own script - approve it.)
//   4. Copy the web app URL (ends in /exec) into Nordoloot's Sheets dialog.
//   5. Share the SHEET view-only with the raid. Keep the /exec URL private - anyone with it can write.
// After code changes here: Deploy -> Manage deployments -> edit -> New version. The URL stays the same.

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(data.tabs).forEach(function (name) {
    var rows = data.tabs[name];
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.clearContents();
    if (rows.length) sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    sh.getRange(1, 1, 1, rows.length ? rows[0].length : 1).setFontWeight("bold");
  });
  return ContentService.createTextOutput("ok");
}
