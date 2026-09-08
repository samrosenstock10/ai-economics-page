(function () {
  'use strict';

  var state = { projects: [], filtered: [] };

  function byId(id) { return document.getElementById(id); }
  function text(value) { return value == null || value === '' ? '—' : String(value); }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function formatDate(value) {
    if (!value) return '—';
    var date = new Date(String(value).slice(0, 10) + 'T12:00:00');
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  }
  function formatTimestamp(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || '—';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(date);
  }
  function sourceFor(row) { return row['Primary Source'] || row['Discovery Source'] || ''; }
  function measuredSignal(row) {
    if (!row['Measured Metric']) return 'Not reported';
    var value = row['Measured Value'];
    var unit = row['Metric Unit'] || '';
    return row['Measured Metric'] + (value === '' || value == null ? '' : ': ' + value + (unit ? ' ' + unit : ''));
  }
  function setSheetLinks(url) {
    document.querySelectorAll('.sheet-link').forEach(function (link) { link.href = url; });
  }
  function uniqueValues(field) {
    return Array.from(new Set(state.projects.map(function (row) { return row[field]; }).filter(Boolean))).sort();
  }
  function populateSelect(id, values) {
    var select = byId(id);
    values.forEach(function (value) {
      var option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }
  function safeSource(value) {
    try { var url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; } catch (_) { return ''; }
  }
  function field(label, value) {
    return value == null || value === '' || value === '—' ? '' : '<div><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + '</dd></div>';
  }
  function renderRows(rows) {
    byId('records-note').textContent = rows.length + ' of ' + state.projects.length + ' projects shown';
    byId('empty-state').hidden = rows.length !== 0;
    byId('projects-body').innerHTML = rows.map(function (row) {
      var source = safeSource(sourceFor(row));
      var details = field('Project summary', row['Project Summary']) + field('Category', row.Domain) + field('Country', row.Country) + field('Scale', row.Scale) + field('Other bottlenecks', row['Secondary Bottlenecks']) + field('Enabling vendors', row['Enabling Vendors']) + field('Notes', row.Notes);
      return '<tr>' +
        '<td class="date-cell" data-label="Updated">' + escapeHtml(formatDate(row['Last Updated'])) + '</td>' +
        '<td class="project-cell" data-label="Project"><strong>' + escapeHtml(text(row.Entity)) + '</strong><span>' + escapeHtml(text(row['Use Case'])) + '</span><details class="project-details"><summary>Project details<span class="sr-only"> for ' + escapeHtml(text(row.Entity)) + '</span></summary><dl>' + details + '</dl></details></td>' +
        '<td data-label="Stage"><span class="pill">' + escapeHtml(text(row.Stage)) + '</span></td>' +
        '<td class="bottleneck-cell" data-label="Bottleneck"><strong>' + escapeHtml(text(row['Primary Bottleneck'])) + '</strong></td>' +
        '<td class="metric-cell" data-label="Reported signal">' + escapeHtml(measuredSignal(row)) + '</td>' +
        '<td class="source-cell" data-label="Source">' + (source ? '<a href="' + escapeHtml(source) + '" target="_blank" rel="noopener noreferrer" aria-label="Read source for ' + escapeHtml(text(row.Entity)) + '">Source ↗</a><span>Quality ' + escapeHtml(row['Source Quality']) + '/5</span>' : 'Not linked') + '</td>' +
      '</tr>';
    }).join('');
  }
  function applyFilters() {
    var query = byId('project-search').value.trim().toLowerCase();
    var domain = byId('domain-filter').value;
    var stage = byId('stage-filter').value;
    var bottleneck = byId('bottleneck-filter').value;

    byId('clear-filters').hidden = !(query || domain || stage || bottleneck);
    state.filtered = state.projects.filter(function (row) {
      if (domain && row.Domain !== domain) return false;
      if (stage && row.Stage !== stage) return false;
      if (bottleneck && row['Primary Bottleneck'] !== bottleneck) return false;
      if (!query) return true;
      var haystack = [row.Entity, row.Ticker, row.Country, row.Domain, row['Use Case'], row['Project Summary'], row.Stage, row.Scale, row['Primary Bottleneck'], row['Secondary Bottlenecks'], row['Enabling Vendors']].join(' ').toLowerCase();
      return haystack.indexOf(query) !== -1;
    });
    renderRows(state.filtered);
  }
  function render(data) {
    state.projects = data.projects.slice().sort(function (a, b) {
      return String(b['Last Updated']).localeCompare(String(a['Last Updated'])) || String(a.Entity).localeCompare(String(b.Entity));
    });
    byId('updated-at').textContent = formatTimestamp(data.meta.generatedAt);
    setSheetLinks(data.meta.sourceSpreadsheet);
    populateSelect('domain-filter', uniqueValues('Domain'));
    populateSelect('stage-filter', uniqueValues('Stage'));
    populateSelect('bottleneck-filter', uniqueValues('Primary Bottleneck'));
    ['project-search', 'domain-filter', 'stage-filter', 'bottleneck-filter'].forEach(function (id) {
      byId(id).addEventListener(id === 'project-search' ? 'input' : 'change', applyFilters);
    });
    function clearFilters() {
      ['project-search', 'domain-filter', 'stage-filter', 'bottleneck-filter'].forEach(function (id) { byId(id).value = ''; });
      applyFilters();
      byId('project-search').focus();
    }
    byId('clear-filters').addEventListener('click', clearFilters);
    byId('empty-clear').addEventListener('click', clearFilters);
    applyFilters();
  }

  fetch('./data/frontier.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('Data request failed: ' + response.status);
      return response.json();
    })
    .then(render)
    .catch(function (error) {
      console.error(error);
      byId('load-error').hidden = false;
    });
})();

