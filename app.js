(function () {
  "use strict";

  var STAGE_ORDER = [
    "Announced",
    "Pilot",
    "Production",
    "Scaled",
    "Measured outcome",
    "Not specified"
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function asNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatDate(value, includeYear) {
    if (!value) return "—";
    var date = new Date(String(value).slice(0, 10) + "T12:00:00");
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: includeYear ? "numeric" : undefined
    }).format(date);
  }

  function formatTimestamp(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || "—";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    }).format(date);
  }

  function setSheetLinks(url) {
    document.querySelectorAll(".sheet-link").forEach(function (link) {
      link.href = url;
    });
  }

  function renderSummary(data) {
    byId("evidence-count").textContent = data.evidence.length;
    byId("run-count").textContent = data.runs.length;
    byId("perception-count").textContent = data.perceptions.length;
    byId("outcome-count").textContent = data.outcomes.length;
    byId("updated-at").textContent = formatTimestamp(data.meta.generatedAt);
    setSheetLinks(data.meta.sourceSpreadsheet);
  }

  function renderStageChart(evidence) {
    var grouped = {};

    evidence.forEach(function (row) {
      var stage = row["Deployment Stage"] || "Not specified";
      if (!grouped[stage]) grouped[stage] = [];
      grouped[stage].push(row);
    });

    var stages = STAGE_ORDER.filter(function (stage) {
      return grouped[stage] && grouped[stage].length;
    });

    Object.keys(grouped).forEach(function (stage) {
      if (stages.indexOf(stage) === -1) stages.push(stage);
    });

    var maxCount = Math.max.apply(null, stages.map(function (stage) {
      return grouped[stage].length;
    }).concat([1]));

    byId("stage-chart").innerHTML = stages.map(function (stage) {
      var rows = grouped[stage];
      var scores = rows.map(function (row) {
        return asNumber(row["Evidence Strength (1-5)"]);
      }).filter(Boolean);
      var average = scores.length
        ? scores.reduce(function (sum, score) { return sum + score; }, 0) / scores.length
        : 0;
      var width = rows.length / maxCount * 100;

      return '<div class="stage-row">' +
        '<span class="stage-name">' + escapeHtml(stage) + '</span>' +
        '<div class="stage-track" aria-label="' + escapeHtml(stage + ": " + rows.length + " records") + '">' +
          '<i class="stage-fill" style="width:' + width.toFixed(1) + '%"></i>' +
        '</div>' +
        '<strong class="stage-count">' + rows.length + '</strong>' +
        '<span class="stage-score">Average evidence score ' + average.toFixed(1) + '/5</span>' +
      '</div>';
    }).join("");
  }

  function renderRecords(evidence) {
    var rows = evidence.slice().sort(function (a, b) {
      return String(b["Source Published Date"]).localeCompare(String(a["Source Published Date"])) ||
        String(b["Evidence ID"]).localeCompare(String(a["Evidence ID"]));
    });

    byId("records-note").textContent =
      rows.length + " records, newest first. Every row links back to its original source.";

    byId("records-body").innerHTML = rows.map(function (row) {
      var sourceUrl = row["Source URL"];
      var sourceName = row["Source Type"] || "Source";
      var sourceTitle = row["Source Title"] || sourceName;

      return '<tr>' +
        '<td class="date-cell">' + escapeHtml(formatDate(row["Source Published Date"], false)) + '</td>' +
        '<td class="entity-cell"><strong>' + escapeHtml(row["Company / Organization"] || "—") + '</strong>' +
          '<span>' + escapeHtml(row["World Domain"] || row.Industry || "") + '</span></td>' +
        '<td class="evidence-cell">' + escapeHtml(row["Claim / Evidence Summary"] || "—") + '</td>' +
        '<td class="stage-cell">' + escapeHtml(row["Deployment Stage"] || "Not specified") + '</td>' +
        '<td class="strength-cell">' + escapeHtml(row["Evidence Strength (1-5)"] || "—") + '/5</td>' +
        '<td class="source-cell">' +
          (sourceUrl ? '<a href="' + escapeHtml(sourceUrl) + '" target="_blank" rel="noreferrer">' + escapeHtml(sourceName) + ' ↗</a>' : "—") +
          '<span title="' + escapeHtml(sourceTitle) + '">' + escapeHtml(formatDate(row["Source Published Date"], true)) + '</span>' +
        '</td>' +
      '</tr>';
    }).join("");
  }

  function renderWithheld(data) {
    if (data.outcomes.length > 0) {
      byId("withheld-title").textContent = "Outcome analysis is beginning, but the sample remains limited.";
    }

    byId("withheld-copy").textContent =
      "The source spreadsheet currently contains " + data.perceptions.length +
      " perception records and " + data.outcomes.length +
      " follow-up outcomes. They remain available for audit, but are not charted because the current sample does not support a meaningful conclusion.";
  }

  function render(data) {
    renderSummary(data);
    renderStageChart(data.evidence);
    renderRecords(data.evidence);
    renderWithheld(data);
  }

  fetch("./data/ledger.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("Data request failed: " + response.status);
      return response.json();
    })
    .then(render)
    .catch(function (error) {
      console.error(error);
      byId("load-error").hidden = false;
    });
})();
