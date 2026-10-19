/* CreativeHub UI interactions — demo frontend only */
(() => {
  const $ = (id) => document.getElementById(id);
  let toastTimer;
  function toast(message) {
    let node = $('toast');
    if (!node) {
      node = document.createElement('div');
      node.className = 'toast';
      node.id = 'toast';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => node.classList.remove('show'), 2800);
  }
  document.querySelectorAll('[data-toast]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      toast(el.dataset.toast || 'This feature is a prototype.');
    });
  });

  // Mobile drawer for app pages
  const sidebar = document.querySelector('.sidebar');
  const overlay = $('mobileOverlay');
  const menuButton = $('mobileMenu');
  function closeMenu() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('show');
    document.body.classList.remove('drawer-open');
  }
  menuButton?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('show');
    document.body.classList.toggle('drawer-open');
  });
  overlay?.addEventListener('click', closeMenu);
  sidebar?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 800) closeMenu(); });

  // Login interactions: front-end demo; replace with server-side authentication.
  const password = $('password');
  $('togglePassword')?.addEventListener('click', () => {
    if (!password) return;
    const showing = password.type === 'text';
    password.type = showing ? 'password' : 'text';
    $('togglePassword').setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    $('togglePassword').innerHTML = showing
      ? '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="m3 3 18 18M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.1 3.8M6.2 6.3C3.5 8.1 2 12 2 12s3.5 7 10 7c1.3 0 2.5-.3 3.6-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  });
  $('loginForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = $('email')?.value.trim();
    const feedback = $('loginFeedback');
    if (!email || !password?.value) {
      if (feedback) feedback.textContent = 'Please enter your email and password.';
      return;
    }
    if (feedback) feedback.textContent = 'Demo sign-in complete. Opening your workspace…';
    const submit = $('loginForm').querySelector('button[type="submit"]');
    if (submit) {
      const old = submit.innerHTML;
      submit.disabled = true;
      submit.innerHTML = '<span>Signing in…</span><span class="button-arrow">↗</span>';
      window.setTimeout(() => { window.location.href = 'dashboard.html'; }, 650);
      window.setTimeout(() => { submit.disabled = false; submit.innerHTML = old; }, 1800);
    }
  });
  $('forgotLink')?.addEventListener('click', (event) => {
    event.preventDefault();
    const email = $('email')?.value.trim();
    toast(email ? `Password reset flow for ${email} needs backend setup.` : 'Enter your email first, then request a password reset.');
  });
  $('signupLink')?.addEventListener('click', (event) => {
    event.preventDefault();
    toast('Access requests will be available when user management is connected.');
  });
  $('googleLogin')?.addEventListener('click', () => toast('Google sign-in needs OAuth configuration.'));

  // Dashboard demo actions
  $('createProject')?.addEventListener('click', () => {
    const name = window.prompt('Name your new project:');
    if (name && name.trim()) toast(`“${name.trim()}” is ready to be connected to project storage.`);
  });
  $('viewProjects')?.addEventListener('click', () => toast('Project list will open when the projects module is connected.'));
  $('chartPeriod')?.addEventListener('click', () => {
    const button = $('chartPeriod');
    const current = button.textContent.includes('Weekly') ? 'Monthly' : button.textContent.includes('Monthly') ? 'Yearly' : 'Weekly';
    button.textContent = `${current}⌄`;
    toast(`Chart view switched to ${current.toLowerCase()} demo.`);
  });

  // Data table: search, status and department filters, selection, sort, CSV import/export.
  const recordsBody = $('recordsBody');
  const tableSearch = $('tableSearch');
  const globalSearch = $('globalSearch');
  const statusFilter = $('statusFilter');
  const departmentFilter = $('departmentFilter');
  const selectAll = $('selectAll');
  const bulkToolbar = $('bulkToolbar');
  const fileInput = $('csvFileInput');
  const recordRows = () => recordsBody ? Array.from(recordsBody.querySelectorAll('tr')) : [];
  const shownRows = () => recordRows().filter(row => row.style.display !== 'none');

  function updateSummary() {
    if (!recordsBody) return;
    const rows = recordRows();
    const active = rows.filter(row => row.dataset.status === 'Active').length;
    const pending = rows.filter(row => row.dataset.status === 'Pending').length;
    if ($('totalCount')) $('totalCount').textContent = String(rows.length);
    if ($('activeCount')) $('activeCount').textContent = String(active);
    if ($('pendingCount')) $('pendingCount').textContent = String(pending);
    if ($('selectedCount')) $('selectedCount').textContent = `${rows.filter(row => row.querySelector('.row-check')?.checked).length} selected`;
  }
  function updateSelection() {
    if (!recordsBody) return;
    const selected = recordRows().filter(row => row.querySelector('.row-check')?.checked);
    if (bulkToolbar) bulkToolbar.classList.toggle('show', selected.length > 0);
    if ($('selectedCount')) $('selectedCount').textContent = `${selected.length} selected`;
    if (selectAll) {
      const shown = shownRows();
      selectAll.checked = shown.length > 0 && shown.every(row => row.querySelector('.row-check')?.checked);
      selectAll.indeterminate = shown.some(row => row.querySelector('.row-check')?.checked) && !selectAll.checked;
    }
  }
  function applyFilters() {
    if (!recordsBody) return;
    const query = (tableSearch?.value || globalSearch?.value || '').toLowerCase().trim();
    const status = statusFilter?.value || 'all';
    const department = departmentFilter?.value || 'all';
    let count = 0;
    recordRows().forEach(row => {
      const textMatch = row.innerText.toLowerCase().includes(query);
      const statusMatch = status === 'all' || row.dataset.status === status;
      const deptMatch = department === 'all' || row.dataset.department === department;
      const show = textMatch && statusMatch && deptMatch;
      row.style.display = show ? '' : 'none';
      if (show) count++;
    });
    $('emptyState')?.classList.toggle('show', count === 0);
    if ($('tableResultText')) $('tableResultText').textContent = `Showing ${count} visible record${count === 1 ? '' : 's'} of ${recordRows().length} demo records`;
    updateSelection();
  }
  tableSearch?.addEventListener('input', () => {
    if (globalSearch) globalSearch.value = tableSearch.value;
    applyFilters();
  });
  globalSearch?.addEventListener('input', () => {
    if (tableSearch) tableSearch.value = globalSearch.value;
    applyFilters();
  });
  statusFilter?.addEventListener('change', applyFilters);
  departmentFilter?.addEventListener('change', applyFilters);
  selectAll?.addEventListener('change', () => {
    shownRows().forEach(row => { const cb = row.querySelector('.row-check'); if (cb) cb.checked = selectAll.checked; });
    updateSelection();
  });
  recordsBody?.addEventListener('change', event => {
    if (event.target.classList.contains('row-check')) updateSelection();
  });
  $('clearSelection')?.addEventListener('click', () => {
    recordRows().forEach(row => { const cb = row.querySelector('.row-check'); if (cb) cb.checked = false; });
    updateSelection();
  });
  $('deleteSelected')?.addEventListener('click', () => {
    const selected = recordRows().filter(row => row.querySelector('.row-check')?.checked);
    if (!selected.length) return;
    if (!window.confirm(`Remove ${selected.length} selected demo record(s)?`)) return;
    selected.forEach(row => row.remove());
    updateSummary(); applyFilters(); toast(`${selected.length} demo record(s) removed from this page.`);
  });
  $('addRecordBtn')?.addEventListener('click', () => {
    const name = window.prompt('Enter the new team member name:');
    if (!name?.trim()) return;
    const safeName = name.trim().replace(/[<>]/g, '');
    const initials = safeName.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    const email = safeName.toLowerCase().replace(/\s+/g, '.') + '@creativehub.id';
    const row = document.createElement('tr');
    row.dataset.status = 'Pending'; row.dataset.department = 'Creative'; row.dataset.name = safeName; row.dataset.date = new Date().toISOString().slice(0, 10);
    row.innerHTML = `<td><input class="row-check" type="checkbox" aria-label="Select ${initials}"></td><td><div class="table-person"><span class="table-avatar avatar-gray">${initials}</span><span><strong></strong><small></small></span></div></td><td>New member</td><td>Creative</td><td><span class="status-pill status-pending">Pending</span></td><td>${new Date().toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'})}</td><td><button class="row-menu" aria-label="Row actions">•••</button></td>`;
    row.querySelector('strong').textContent = safeName;
    row.querySelector('small').textContent = email;
    recordsBody?.prepend(row);
    updateSummary(); applyFilters(); toast('Sample record added. Connect a backend to save it permanently.');
  });
  recordsBody?.addEventListener('click', event => {
    const button = event.target.closest('.row-menu');
    if (!button) return;
    const row = button.closest('tr');
    const name = row?.dataset.name || row?.querySelector('.table-person strong')?.textContent || 'Record';
    const action = window.prompt(`Actions for ${name}: type "edit", "delete", or cancel.`, 'edit');
    if (!action) return;
    if (action.toLowerCase() === 'delete') {
      if (window.confirm(`Delete ${name} from demo data?`)) { row.remove(); updateSummary(); applyFilters(); toast('Demo record deleted.'); }
    } else if (action.toLowerCase() === 'edit') {
      const newName = window.prompt('Update name:', name);
      if (newName?.trim()) {
        const clean = newName.trim().replace(/[<>]/g, '');
        row.dataset.name = clean;
        row.querySelector('.table-person strong').textContent = clean;
        const initials = clean.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
        row.querySelector('.table-avatar').textContent = initials;
        row.querySelector('.table-person small').textContent = clean.toLowerCase().replace(/\s+/g, '.') + '@creativehub.id';
        applyFilters(); toast('Demo record updated.');
      }
    }
  });
  document.querySelectorAll('[data-sort]').forEach(button => button.addEventListener('click', () => {
    if (!recordsBody) return;
    const key = button.dataset.sort;
    const rows = recordRows();
    const asc = button.dataset.direction !== 'asc';
    button.dataset.direction = asc ? 'asc' : 'desc';
    rows.sort((a,b) => {
      const av = key === 'date' ? a.dataset.date || '' : a.dataset.name || a.querySelector('.table-person strong')?.textContent || '';
      const bv = key === 'date' ? b.dataset.date || '' : b.dataset.name || b.querySelector('.table-person strong')?.textContent || '';
      return av.localeCompare(bv) * (asc ? 1 : -1);
    }).forEach(row => recordsBody.appendChild(row));
    toast(`Sorted by ${key} (${asc ? 'ascending' : 'descending'}).`);
  }));
  $('exportBtn')?.addEventListener('click', () => {
    if (!recordsBody) return;
    const rows = [['Name','Email','Role','Department','Status','Last Updated']];
    recordRows().filter(row => row.style.display !== 'none').forEach(row => {
      const cells = row.querySelectorAll('td');
      rows.push([
        row.querySelector('.table-person strong')?.textContent || '',
        row.querySelector('.table-person small')?.textContent || '',
        cells[2]?.textContent.trim() || '',
        cells[3]?.textContent.trim() || '',
        row.dataset.status || '',
        row.dataset.date || ''
      ]);
    });
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'creativehub-records.csv'; link.click();
    URL.revokeObjectURL(url); toast('CSV export downloaded.');
  });
  $('importBtn')?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) throw new Error('empty');
      toast(`CSV read successfully: ${lines.length - 1} data row(s). Column mapping and saving need backend setup.`);
    } catch {
      toast('Could not read this CSV. Please check the file format.');
    }
    event.target.value = '';
  });
  $('prevPage')?.addEventListener('click', () => toast('You are on the first demo page.'));
  $('nextPage')?.addEventListener('click', () => toast('Connect pagination to the database to load more records.'));
  updateSummary();
  applyFilters();
})();