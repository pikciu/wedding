function doGet() {
    return jsonResponse({ ok: true, service: "rsvp-webhook" });
}

function doPost(e) {
    try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RSVP");
        if (!sheet) {
            return jsonResponse({ ok: false, error: "Sheet RSVP not found" });
        }

        var payload = parseRequestPayload(e);

        var guestCode = clean(payload.guestCode);
        var names = clean(payload.names);
        var attendance = clean(payload.attendance);
        var lang = clean(payload.lang);
        var honeypot = clean(payload.website);

        if (honeypot) {
            return jsonResponse({ ok: true, spam: true });
        }

        if (!guestCode) {
            return jsonResponse({ ok: false, error: "guestCode required" });
        }
        if (attendance !== "yes" && attendance !== "no" && attendance !== "partial") {
            return jsonResponse({ ok: false, error: "attendance must be yes, partial or no" });
        }

        sheet.appendRow([
            new Date(),
            guestCode,
            names,
            attendance,
            lang,
            honeypot
        ]);

        return jsonResponse({ ok: true });
    } catch (err) {
        return jsonResponse({ ok: false, error: String(err) });
    }
}

function parseRequestPayload(e) {
    var out = {};

    if (e && e.parameter) {
        Object.keys(e.parameter).forEach(function (k) {
            out[k] = e.parameter[k];
        });
    }

    if (e && e.postData && e.postData.contents) {
        try {
            var json = JSON.parse(e.postData.contents);
            if (json && typeof json === "object") {
                Object.keys(json).forEach(function (k) {
                    out[k] = json[k];
                });
            }
        } catch (_) {
            return out;
        }
    }

    return out;
}

function clean(v) {
    if (v === null || v === undefined) return "";
    return String(v).trim();
}

function jsonResponse(obj) {
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}
