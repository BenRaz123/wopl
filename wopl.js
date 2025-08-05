//const URL = "https://bccls.libcal.com/ical_subscribe.php?src=p&cid=10341"
const URL = "cal.ics"

let oldText;

// the entry point to the program
async function main() {
	const events = await getData();
	// this means that we dont have anything new
	if (events===null) {
		return
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
			const time = strftime(ev.dtStart, "%I:%m%p");
			e("li", {
				appendTo: ul,
				class: "condensed",
				text: `${ev.summary}: ${ev.location} at ${time}`
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
