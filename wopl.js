//const URL = "https://bccls.libcal.com/ical_subscribe.php?src=p&cid=10341"
const URL = "cal.ics"
const DEBUG=true;

let oldText;
let oldEvents;

let events;

// the entry point to the program
async function main() {
	const newEvents = await getData();
	// this means that we dont have anything new
	if (newEvents===null) { 
		console.info("[INFO] Using oldEvents");
		events = oldEvents;
	}
	else { 
		console.info("[INFO] Refresh events");
		oldEvents = newEvents;
		events = newEvents;
	}

	updateDelta(events, "yesterday", -1);
	updateDelta(events, "today", 0);
	updateDelta(events, "tomorrow", 1);
}

async function getData() {
	const resp = await fetch(URL);
	const text = await resp.text();
	if (!oldText) oldText = text;
	else if (oldText == text) return null;
	const events = parseICS(text);
	return events;
}

function diff(dateA, dateB) {
	const EN_DASH = "\u2013"
	const strip_leading_ws = (s) => s[0] == " " ? s.slice(1) : s;
	let res;
	if (!dateB)
		res = strftime(dateA, "at %I:%M%p");
	else 
		res = "from " + strip_leading_ws(strftime(dateA, dateA.getMinutes() ==  0 ? `%l${EN_DASH}` : `%l:%M${EN_DASH}`)) + strip_leading_ws(strftime(dateB, dateB.getMinutes() == 0 ? "%l%p" : "%l:%M%p"));
	if (DEBUG) console.log(`DIFF(${strftime(dateA, "%X %x")}, ${strftime(dateB, "%X %x")}): ${res}`)
	return res;
}

function e(name, data) {
	const elem = document.createElement(name);
	if (!data) return elem;
	if (data.html) elem.innerHTML = data.html;
	if (data.text) elem.textContent = data.text;
	if (data.d) elem.appendChild(data.d);
	if (data.appendTo) data.appendTo.appendChild(elem);
	for (const key in data) if (key != "d" && key != "text" && key != "appendTo" && key != "html") elem.setAttribute(key, data[key])
	return elem;
}

async function updateDelta(data, slideID, delta) {
	const main = document.querySelector(`slide#${slideID}>main`);
	let ul;
	if (main.contains(main.querySelector("div.side>ul")))
		ul = main.querySelector(`div.side>ul`)
	else
		ul = e("ul", { appendTo: main.querySelector("div.side") });
	//https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
	ul.replaceChildren();
	for (const ev of data) {
		if (!ev.dtStart) continue;
		if (isToday(ev.dtStart, new Date(), delta)) {
			const time = diff(ev.dtStart, ev.dtEnd);
			e("li", {
				appendTo: ul,
				class: "condensed",
				text: `${ev.summary}: ${ev.location} ${time}`
			});
		}
	}
}

function isToday(d, today, delta) {
	let targetDay = new Date(today); // clone
	targetDay.setDate(targetDay.getDate() + delta);
	return (d.getDate() == targetDay.getDate())
		&& (d.getMonth() == targetDay.getMonth())
		&& (d.getFullYear() == targetDay.getFullYear());
}
function ifStartsWith(s, pat, f) {
	if (s.startsWith(pat)) f(s.split(pat)[1])
}

function parseDate(stamp) {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(stamp);
  if (!match) throw new Error("Invalid timestamp format");
  const [_, year, month, day, hour, min, sec] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
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
