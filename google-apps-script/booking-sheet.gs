/**
 * OwnFit – save website bookings to the "OwnFit Bookings" Google Sheet.
 *
 * Setup (once):
 * 1. Open the OwnFit Bookings sheet → Extensions → Apps Script.
 * 2. Delete everything in Code.gs, paste this whole file, click Save.
 * 3. Deploy → New deployment → type "Web app".
 *      Execute as: Me      Who has access: Anyone
 *    Click Deploy, allow the permissions, and copy the Web app URL.
 * 4. Put that URL in js/data.js as bookingSheet: 'https://script.google.com/macros/s/.../exec'
 */

var COLUMNS = ['Submitted at', 'Language', 'Name', 'Mobile', 'Training', 'Coach', 'Package',
               'Emirate', 'Area', 'Preferred time', 'Coach preference', 'Notes', 'Status'];
var FIELDS  = ['language', 'name', 'mobile', 'training', 'coach', 'package',
               'emirate', 'area', 'time', 'preference', 'notes'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
    var p = (e && e.parameter) || {};
    var when = Utilities.formatDate(new Date(), 'Asia/Dubai', 'yyyy-MM-dd HH:mm');
    var row = [when].concat(FIELDS.map(function (f) { return clean(p[f]); })).concat(['New']);
    sheet.appendRow(row);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// Plain text only: trims, caps length, and stops values like "=..." becoming formulas.
function clean(v) {
  v = String(v == null ? '' : v).trim().slice(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

// Optional: run once from the editor to style the header row.
function setup() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.setName('Bookings');
  sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS])
       .setFontWeight('bold').setBackground('#D7192A').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.getRange('M2:M').setDataValidation(SpreadsheetApp.newDataValidation()
       .requireValueInList(['New', 'Contacted', 'Booked', 'Cancelled'], true).build());
  sheet.autoResizeColumns(1, COLUMNS.length);
}
