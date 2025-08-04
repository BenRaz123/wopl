const URL = "https://bccls.libcal.com/ical_subscribe.php?src=p&cid=10341"
const SHOW_UPDATE_DATE = true;

// the entry point to the program
async function main() {
	updateDelta("today", 0);	
}

async function updateDelta(slideID, delta) {
	const response = await fetch(URL);
	if (!response.ok) {
		console.error(`failed to get response: ${response.status}`);
		return;
	} else {
		console.log(response);
		return;
	}
	const ics = parseICS()
	const slide = document.querySelector(`#${slideID}`);
	
}

function ifStartsWith(s, pat, f) {
  if (s.startsWith(pat)) f(s.split(pat)[1])
}

function parseDate(stamp) {
  return new Date(stamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z'));

}

function parseICS(ics, deb) {
  const events = String(ics).split("BEGIN:VEVENT").slice(1);
  let output = [];
  for (const ev of events) {
    var parsedEv = {};
    if (deb) parsedEv.raw = ev;
    for (const evLine of ev.split("\n")) {
      ifStartsWith(evLine, "DTSTART:", stamp => {
        parsedEv.dtStart = parseDate(stamp);
      });
      ifStartsWith(evLine, "DTEND:", stamp => {
        parsedEv.dtEnd = parseDate(stamp);
      });
      ifStartsWith(evLine, "DTSTAMP:", stamp => {
        parsedEv.dtStamp = parseDate(stamp);
      });
      ifStartsWith(evLine, "SUMMARY:", summary => {
        parsedEv.summary = summary;
      });
      ifStartsWith(evLine, "LOCATION:", loc => {
        const spl = String(loc.split("West Orange - ")[1]);
        parsedEv.location = spl.includes(`\\`) ? spl.split(`\\`)[0] : spl;
      });
    }
    output.push(parsedEv);  
  }
  return output;
}
