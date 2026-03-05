fetch('/data/static-texts.json')
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  })
  .then(data => {
    console.log('[footer.js] Data loaded successfully:', data);

    /* ===== footer ===== */
    const footerOrderTitle = document.getElementById('footer-order-title');
    if (footerOrderTitle && data.footer) {
      footerOrderTitle.textContent = data.footer.order_title || '';
    }

    const footerExorcistInfo = document.getElementById('footer-exorcist-info');
    if (footerExorcistInfo && data.footer) {
      footerExorcistInfo.textContent = data.footer.exorcist_info || '';
    }

    const footerMotto = document.getElementById('footer-motto');
    if (footerMotto && data.footer) {
      footerMotto.textContent = data.footer.motto || '';
    }

    const footerCredoLink = document.getElementById('footer-credo-link');
    if (footerCredoLink && data.footer) {
      footerCredoLink.textContent = data.footer.credo_link || '';
    }

    const footerEmergencyTitle = document.getElementById('footer-emergency-title');
    if (footerEmergencyTitle && data.footer) {
      footerEmergencyTitle.textContent = data.footer.emergency_title || '';
    }

    const footerAccessCode = document.getElementById('footer-access-code');
    if (footerAccessCode && data.footer) {
      footerAccessCode.textContent = data.footer.access_code || '';
    }

    const footerHotline = document.getElementById('footer-hotline');
    if (footerHotline && data.footer) {
      footerHotline.textContent = data.footer.hotline || '';
    }

    const footerWarning = document.getElementById('footer-warning');
    if (footerWarning && data.footer) {
      footerWarning.textContent = data.footer.warning || '';
    }

    const footerLocationTitle = document.getElementById('footer-location-title');
    if (footerLocationTitle && data.footer) {
      footerLocationTitle.textContent = data.footer.location_title || '';
    }

    const footerBase = document.getElementById('footer-base');
    if (footerBase && data.footer) {
      footerBase.textContent = data.footer.base || '';
    }
  })
  .catch(err => {
    console.error('[footer.js] Error loading data:', err);
    console.error('[footer.js] Attempted URL: /api/static-texts');
  });