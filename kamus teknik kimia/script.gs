var token = "------------"; // ambil token dari botFather telegram
var SSID = "-------------"; // ambil ID pada URL database spreadsheets
var webAppUrl = "----------------"; // ambil url hasil publish
//var SSID = "-----------------------"; //alamat spreadsheet untuk simpan
var namasheet = "Database"; //alamat sheet pada spreadsheet
var logSheetName = "chatlog"; //nama sheet untuk menyimpan chat logs

var url = "https://api.telegram.org/bot" + token;

function setWebhook() {
    var response = UrlFetchApp.fetch(url + "/setWebhook?url=" + webAppUrl);
    Logger.log(response.getContentText());
  }


function getLocation(update) {
  if ('location' in update.message) {
  var latitude = update.message.location.latitude;
  var longitude = update.message.location.longitude;
  var location = latitude + "," + longitude;
  return location;
  } else {
    return null;
  }
}


function doPost(e) {
    var stringJson = e.postData.getDataAsString();
    var updates = JSON.parse(stringJson);
    //log(updates);
    var id = updates.message.from.id;
    var nama = updates.message.from.first_name;
    var textBot = updates.message.text;
    var chat_bot = textBot;
    var command_cek = chat_bot.substring(0, 1);

    // Mendapatkan lokasi pengguna
    var location = getLocation(updates);

    //ambil timestamp
    var now = new Date();
    var waktu = Utilities.formatDate(now, "Asia/Jakarta", "dd/MM/yyyy hh:mm:ss");

    //ambil pesan
    var pesan = '';
    if (updates.message.text) {
      pesan = updates.message.text;
    }

    //simpan chatlogs
    SpreadsheetApp.openById(SSID).getSheetByName(logSheetName).appendRow([waktu, id, nama, pesan, location]);

    // Mengecek apakah pesan adalah permintaan pencarian langsung
    if (command_cek !== '/') {
      var query = textBot.trim(); // mengambil kata kunci yang dicari
      var result = searchData(query);
      sendText(id, result);
    } else {
      var command = chat_bot.split(",")[0]; // command
      var subCommand = chat_bot.split(",")[1]; // odp

      switch (command) {
        case "/start":
          let start = "Halo! " + nama + " 👋\n" +
            "Selamat Datang di Bot Kamus Teknik Kimia.\n\n" +
            "Bot ini digunakan untuk mencari istilah dalam Teknik Kimia (dalam bahasa Inggris)\n" +
            "(sumber: A Dictionary of Chemical Engineering - OXFORD PAPERBACK REFERENCE). \n\n" +
            "Cara menggunakan:✔ \n" +
            "🔶 Ketik : [kata yang ingin dicari]\n" +
            "🔶 Contoh : azeotropic distillation  \n\n" +
            "Note : Program masih dalam pengembangan, kata kunci yang tersedia A sampai H.\n\n" +
            "Terimkasih sudah menggunakan Bot ini, semoga bermanfaat.";
          sendText(id, start);
          break;
        case "/save":
          simpan(updates);
          break;
        case "/cari":
          var query = subCommand.trim(); // mengambil keyword yang dicari
          var result = searchData(query);
          sendText(id, result);
          break;
        default:
          sendText(id, "❌ Command tidak ditemukan ⛔ !!");
      }
    }
}


function simpan(data) {
    let id = data.message.from.id;
    var nama = data.message.from.first_name;
    var username = data.message.from.username;
    var pesan = data.message.text;
    let text = pesan;
    var now = new Date();
    var waktu = Utilities.formatDate(now, "Asia/Jakarta", "dd/MM/yyyy hh:mm:ss"); // format timestamp indonesia
    var number = 1;

    var txt1 = text.split(",")[0]; // kata pertama/command
    var txt2 = text.split(",")[1]; // kata kedua
    var txt3 = text.split(",")[2]; // kata ketiga
    //var txt4 = text.split(",")[3]; // kata keempat

    SpreadsheetApp.openById(SSID).getSheetByName(namasheet).appendRow([txt2, txt3,]); // input log
    sendText(id, "💾 Data Berhasil disimpan ! ✅");
}




function searchData(query) {
  var sheet = SpreadsheetApp.openById(SSID).getSheetByName(namasheet);
  var lastRow = sheet.getLastRow();
  var range = sheet.getRange("A2:B" + lastRow); //asumsi data berada pada kolom A dan B, dimulai dari baris ke-2
  var values = range.getValues();
  var result = "🔍 Hasil Pencarian: \n";
  
  for (var i = 0; i < values.length; i++) {
    if (values[i][0].toLowerCase().indexOf(query.toLowerCase()) !== -1) {
      // Menambahkan tag HTML <b> dan </b> pada kata kunci
      var highlightedKeyword = "<b>" + values[i][0] + "</b>";
      result += "# " + highlightedKeyword + " : " + values[i][1] + "\n\n";
    }
  }
  
  if (result === "🔍 Hasil Pencarian: \n") {
    result = "❌ Tidak ada hasil yang ditemukan untuk keyword tersebut.\n" + 
    "hal ini dapat terjadi karena keyword tidak sesuai atau belum ada di database\n"+
    "database sedang dalam pengembangan, saat ini keyword yang tersedia A sampai E";
  }
  
  return result;
}


//fungsi awal balasan chat tanpa split text, namun ada batasan chat 4096 karakter
//function sendText(chat_id, message) {
  //var data = {
    //method: "post",
    //payload: {
      //method: "sendMessage",
      //chat_id: String(chat_id),
      //text: message,
    //},
  //};
  //UrlFetchApp.fetch(url + "/", data);
//}



//fungsi untuk membagi chat agar dapat tidak melebihi batas maximal
function sendText(chat_id, text) {
  var chunks = splitText(text, 4096); // membagi pesan menjadi bagian-bagian dengan maksimal karakter 4096
  for (var i = 0; i < chunks.length; i++) {
    var message = chunks[i];
    var payload = {
      'method': 'sendMessage',
      'chat_id': String(chat_id),
      'text': message,
      'parse_mode': 'HTML'
    };
    var data = {
      'method': 'post',
      'payload': payload
    };
    UrlFetchApp.fetch(url + '/', data);
  }
}

function splitText(text, maxLength) {
  var result = [];
  var words = text.split(' ');
  var currentLine = words[0];
  for (var i = 1; i < words.length; i++) {
    var word = words[i];
    if ((currentLine + ' ' + word).length <= maxLength) {
      currentLine += ' ' + word;
    } else {
      result.push(currentLine);
      currentLine = word;
    }
  }
  result.push(currentLine);
  return result;
}



